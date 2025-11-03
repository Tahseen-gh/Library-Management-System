const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const router = express.Router();

// Validation middleware
const validate_transaction = [
  body('patron_id').notEmpty().withMessage('Valid patron ID is required'),
  body('transaction_type')
    .isIn(['checkout', 'checkin', 'renewal'])
    .withMessage('Invalid transaction type'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
];

const validate_checkout = [
  body('patron_id').notEmpty().withMessage('Valid patron ID is required'),
  body('copy_id').notEmpty().withMessage('Valid copy ID is required'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
];

// Helper function to handle validation errors
const handle_validation_errors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// GET /api/v1/transactions - Get all transactions
router.get('/', async (req, res) => {
  try {
    const { patron_id, status, transaction_type } = req.query;
    let query = `
      SELECT 
        t.*,
        p.first_name,
        p.last_name,
        li.title,
        li.item_type,
        b.branch_name
      FROM TRANSACTIONS t
      JOIN PATRONS p ON t.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES lic ON t.copy_id = lic.id
      JOIN LIBRARY_ITEMS li ON lic.library_item_id = li.id
      JOIN BRANCHES b ON lic.branch_id = b.id
    `;
    let params = [];
    let conditions = [];

    if (patron_id) {
      conditions.push('t.patron_id = ?');
      params.push(patron_id);
    }
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    if (transaction_type) {
      conditions.push('t.transaction_type = ?');
      params.push(transaction_type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.createdAt DESC';

    const transactions = await db.execute_query(query, params);

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message,
    });
  }
});

// GET /api/v1/transactions/:id - Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.*,
        p.first_name,
        p.last_name,
        p.email,
        li.title,
        li.item_type,
        b.branch_name
      FROM TRANSACTIONS t
      JOIN PATRONS p ON t.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES lic ON t.copy_id = lic.id
      JOIN LIBRARY_ITEMS li ON lic.library_item_id = li.id
      JOIN BRANCHES b ON lic.branch_id = b.id
      WHERE t.id = ?
    `;

    const results = await db.execute_query(query, [req.params.id]);
    const transaction = results[0];

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch transaction',
      message: error.message,
    });
  }
});

// POST /api/v1/transactions/checkout - Checkout item
router.post(
  '/checkout',
  validate_checkout,
  handle_validation_errors,
  async (req, res) => {
    try {
      const { copy_id, patron_id, due_date } = req.body;

      // Verify library item copy exists and is available
      const library_item_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', copy_id);
      if (!library_item_copy) {
        return res.status(400).json({
          error: 'Library item copy not found',
        });
      }

      if (library_item_copy.status !== 'available') {
        return res.status(400).json({
          error: 'Item is not available for checkout',
          current_status: library_item_copy.status,
        });
      }

      // Verify patron exists and is active
      const patron = await db.get_by_id('PATRONS', patron_id);
      if (!patron || !patron.isActive) {
        return res.status(400).json({
          error: 'Patron not found or inactive',
        });
      }

      // CHECK PATRON BALANCE (Fees) - US 2.7
      if (patron.balance > 0) {
        return res.status(400).json({
          error: 'Patron has outstanding fees',
          balance: patron.balance,
          message: `Patron owes $${patron.balance.toFixed(2)}. Fees must be paid before checkout.`
        });
      }

      // CHECK 20-ITEM LIMIT - US 2.3
      const active_checkout_count = await db.execute_query(
        'SELECT COUNT(*) as count FROM TRANSACTIONS WHERE patron_id = ? AND status = "active"',
        [patron_id]
      );

      if (active_checkout_count[0].count >= 20) {
        return res.status(400).json({
          error: 'Checkout limit reached',
          current_checkouts: active_checkout_count[0].count,
          message: 'Patron already has 20 items checked out. Cannot checkout more items.'
        });
      }

      // GET ITEM TYPE FOR DUE DATE CALCULATION - US 2.7
      const library_item = await db.execute_query(
        'SELECT li.item_type FROM LIBRARY_ITEMS li ' +
        'JOIN LIBRARY_ITEM_COPIES lic ON li.id = lic.library_item_id ' +
        'WHERE lic.id = ?',
        [copy_id]
      );

      // Calculate due date based on item type - US 2.7
      const checkout_date = new Date().toISOString();
      let loan_duration_days;

      switch (library_item[0].item_type.toUpperCase()) {
        case 'BOOK':
          loan_duration_days = 28; // 4 weeks
          break;
        case 'VIDEO':
          // TODO: Distinguish "new movies" for 3-day loans
          loan_duration_days = 7; // 1 week for movies
          break;
        case 'AUDIOBOOK':
          loan_duration_days = 28; // Same as books
          break;
        default:
          loan_duration_days = 14; // Default 2 weeks
      }

      const calculated_due_date = due_date
        ? new Date(due_date).toISOString()
        : new Date(Date.now() + loan_duration_days * 24 * 60 * 60 * 1000).toISOString();

      // Create transaction
      const transaction_data = {
        id: uuidv4(),
        copy_id,
        patron_id,
        transaction_type: 'checkout',
        checkout_date,
        due_date: calculated_due_date,
        return_date: null,
        status: 'active',
        fine_amount: 0,
        notes: null,
        createdAt: checkout_date,
        updatedAt: checkout_date,
      };

      await db.create_record('TRANSACTIONS', transaction_data);

      // Update library item copy status
      await db.update_record('LIBRARY_ITEM_COPIES', copy_id, {
        status: 'borrowed',
        updatedAt: checkout_date,
      });

      res.status(201).json({
        success: true,
        message: 'Item checked out successfully',
        data: transaction_data,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to checkout item',
        message: error.message,
      });
    }
  }
);

// POST /api/v1/transactions/checkin - Checkin item (US 3.1, US 3.7)
router.post(
  '/checkin',
  [
    body('copy_id').notEmpty().withMessage('Copy ID is required'),
    body('new_condition')
      .optional()
      .isIn(['New', 'Excellent', 'Good', 'Fair', 'Poor'])
      .withMessage('Invalid condition'),
  ],
  handle_validation_errors,
  async (req, res) => {
    try {
      const { copy_id, new_condition, notes } = req.body;

      // Find active transaction for this copy
      const active_transactions = await db.execute_query(
        'SELECT * FROM TRANSACTIONS WHERE copy_id = ? AND status = "active" ORDER BY createdAt DESC LIMIT 1',
        [copy_id]
      );

      if (active_transactions.length === 0) {
        return res.status(400).json({
          error: 'No active transaction found for this library item copy',
        });
      }

      const transaction = active_transactions[0];
      const return_date = new Date().toISOString();
      const due_date = new Date(transaction.due_date);
      const return_date_obj = new Date(return_date);

      // Calculate fine if overdue - US 3.1
      let fine_amount = 0;
      if (return_date_obj > due_date) {
        const days_overdue = Math.ceil(
          (return_date_obj - due_date) / (1000 * 60 * 60 * 24)
        );
        fine_amount = days_overdue * 0.5; // $0.50 per day
      }

      // Update transaction
      await db.update_record('TRANSACTIONS', transaction.id, {
        return_date,
        fine_amount,
        status: 'returned',
        notes: notes || null,
        updatedAt: return_date,
      });

      // Update library item copy status to 'available' - US 3.7
      const update_data = {
        status: 'available',
        condition: new_condition || transaction.condition,
        updatedAt: return_date,
      };

      await db.update_record('LIBRARY_ITEM_COPIES', copy_id, update_data);

      // Create fine record if there's a fine - US 3.1
      if (fine_amount > 0) {
        const fine_data = {
          id: uuidv4(),
          transaction_id: transaction.id,
          patron_id: transaction.patron_id,
          amount: fine_amount,
          reason: `Late return - ${Math.ceil((return_date_obj - due_date) / (1000 * 60 * 60 * 24))} days overdue`,
          is_paid: false,
          createdAt: return_date,
        };
        await db.create_record('FINES', fine_data);

        // Update patron balance
        await db.execute_query(
          'UPDATE PATRONS SET balance = balance + ? WHERE id = ?',
          [fine_amount, transaction.patron_id]
        );
      }

      res.json({
        success: true,
        message: 'Item checked in successfully',
        data: {
          transaction_id: transaction.id,
          return_date,
          fine_amount,
          days_overdue:
            fine_amount > 0
              ? Math.ceil((return_date_obj - due_date) / (1000 * 60 * 60 * 24))
              : 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to checkin item',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/transactions/:id/renew - Renew transaction
router.put('/:id/renew', async (req, res) => {
  try {
    const transaction = await db.get_by_id('TRANSACTIONS', req.params.id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    if (transaction.status !== 'active') {
      return res.status(400).json({
        error: 'Only active transactions can be renewed',
      });
    }

    // Get library item ID from copy
    const copy = await db.get_by_id('LIBRARY_ITEM_COPIES', transaction.copy_id);
    
    // Check if item has reservations
    const reservations = await db.execute_query(
      'SELECT COUNT(*) as count FROM RESERVATIONS WHERE library_item_id = ? AND status = "active"',
      [copy.library_item_id]
    );

    if (reservations[0].count > 0) {
      return res.status(400).json({
        error: 'Item cannot be renewed due to pending reservations',
      });
    }

    // Extend due date by 14 days
    const current_due_date = new Date(transaction.due_date);
    const new_due_date = new Date(
      current_due_date.getTime() + 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Update transaction
    await db.update_record('TRANSACTIONS', req.params.id, {
      due_date: new_due_date,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Transaction renewed successfully',
      data: {
        transaction_id: req.params.id,
        new_due_date,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to renew transaction',
      message: error.message,
    });
  }
});

module.exports = router;
