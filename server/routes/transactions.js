const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const router = express.Router();

// Validation middleware
const validate_transaction = [
  body('patron_id').isInt().withMessage('Valid patron ID is required'),
  body('transaction_type')
    .isIn(['checkout', 'checkin', 'renewal'])
    .withMessage('Invalid transaction type'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
];

const validate_checkout = [
  body('patron_id').isInt().withMessage('Valid patron ID is required'),
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
    let conditions = '';
    let params = [];

    const filters = [];
    if (patron_id) {
      filters.push('t.patron_id = ?');
      params.push(patron_id);
    }
    if (status) {
      filters.push('t.status = ?');
      params.push(status);
    }
    if (transaction_type) {
      filters.push('t.transaction_type = ?');
      params.push(transaction_type);
    }

    if (filters.length > 0) {
      conditions = ' WHERE ' + filters.join(' AND ');
    }

    const query = `
      SELECT 
        t.*,
        p.first_name,
        p.last_name,
        ci.title,
        ci.item_type,
        b.branch_name
      FROM transactions t
      JOIN patrons p ON t.patron_id = p.id
      JOIN item_copies ic ON t.copy_id = ic.id
      JOIN catalog_items ci ON ic.catalog_item_id = ci.id
      JOIN branches b ON ic.branch_id = b.id
      ${conditions}
      ORDER BY t.created_at DESC
    `;

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
        ci.title,
        ci.item_type,
        b.branch_name
      FROM transactions t
      JOIN patrons p ON t.patron_id = p.id
      JOIN item_copies ic ON t.copy_id = ic.id
      JOIN catalog_items ci ON ic.catalog_item_id = ci.id
      JOIN branches b ON ic.branch_id = b.id
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

      // Verify item copy exists and is available
      const item_copy = await db.get_by_id('item_copies', copy_id);
      if (!item_copy) {
        return res.status(400).json({
          error: 'Item copy not found',
        });
      }

      if (item_copy.status !== 'Available') {
        return res.status(400).json({
          error: 'Item is not available for checkout',
          current_status: item_copy.status,
        });
      }

      // Verify patron exists and is active
      const patron = await db.get_by_id('patrons', patron_id);
      if (!patron || !patron.is_active) {
        return res.status(400).json({
          error: 'Patron not found or inactive',
        });
      }

      // Calculate due date if not provided (default 14 days)
      const checkout_date = new Date();
      const calculated_due_date = due_date
        ? new Date(due_date)
        : new Date(checkout_date.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Create transaction
      const transaction_data = {
        id: uuidv4(),
        copy_id,
        patron_id,
        transaction_type: 'checkout',
        checkout_date,
        due_date: calculated_due_date,
        status: 'Active',
        fine_amount: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await db.create_record('transactions', transaction_data);

      // Update item copy status and checkout info
      await db.update_record('item_copies', copy_id, {
        status: 'Checked Out',
        checked_out_by: patron_id,
        due_date: calculated_due_date,
        updated_at: new Date(),
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

// POST /api/v1/transactions/checkin - Checkin item
router.post(
  '/checkin',
  [
    body('new_condition')
      .optional()
      .isIn(['New', 'Excellent', 'Good', 'Fair', 'Poor'])
      .withMessage('Invalid condition'),
  ],
  handle_validation_errors,
  async (req, res) => {
    try {
      const { copy_id, new_condition, new_location_id, notes } = req.body;

      // Find active transaction for this copy
      const active_transactions = await db.execute_query(
        'SELECT * FROM transactions WHERE copy_id = ? AND status = "Active" ORDER BY created_at DESC LIMIT 1',
        [copy_id]
      );

      if (active_transactions.length === 0) {
        return res.status(400).json({
          error: 'No active transaction found for this item copy',
        });
      }

      const transaction = active_transactions[0];
      const return_date = new Date(); // today
      const due_date = new Date(transaction.due_date);

      // Calculate fine if overdue
      let fine_amount = 0;
      if (return_date > due_date) {
        const days_overdue = Math.ceil(
          (return_date - due_date) / (1000 * 60 * 60 * 24)
        );
        fine_amount = days_overdue * 0.5; // $0.50 per day
      }

      // Update transaction
      await db.update_record('transactions', transaction.id, {
        return_date,
        fine_amount,
        status: 'Completed',
        notes: notes || null,
        updated_at: new Date(),
      });

      // Update item copy
      const update_data = {
        status: 'Available',
        checked_out_by: null,
        due_date: null,
        location: new_location_id || transaction.location_id,
        condition: new_condition || transaction.condition,
        updated_at: new Date(),
      };

      await db.update_record('item_copies', copy_id, update_data);

      // Update patron balance if there's a fine
      if (fine_amount > 0) {
        await db.execute_query(
          'UPDATE patrons SET balance = balance + ? WHERE id = ?',
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
              ? Math.ceil((return_date - due_date) / (1000 * 60 * 60 * 24))
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
    const transaction = await db.get_by_id('transactions', req.params.id);

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

    // Check if item has reservations
    const reservations = await db.execute_query(
      'SELECT COUNT(*) as count FROM reservations WHERE catalog_item_id = (SELECT catalog_item_id FROM item_copies WHERE id = ?) AND status = "pending"',
      [transaction.copy_id]
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
    );

    // Update transaction
    await db.update_record('transactions', req.params.id, {
      due_date: new_due_date,
      updated_at: new Date(),
    });

    // Update item copy
    await db.update_record('item_copies', transaction.copy_id, {
      due_date: new_due_date,
      updated_at: new Date(),
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
