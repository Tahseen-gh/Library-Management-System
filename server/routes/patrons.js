const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const router = express.Router();

// Validation middleware
const validate_patron = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('balance').optional().isFloat().withMessage('Balance must be a number'),
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

// GET /api/v1/patrons - Get all patrons
router.get('/', async (req, res) => {
  try {
    const { search, active_only } = req.query;
    let query = 'SELECT * FROM PATRONS';
    let params = [];
    let conditions = [];

    if (active_only === 'true') {
      conditions.push('isActive = 1');
    }

    if (search) {
      conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const patrons = await db.execute_query(query, params);
    
    res.json({
      success: true,
      count: patrons.length,
      data: patrons,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch patrons',
      message: error.message,
    });
  }
});

// GET /api/v1/patrons/:id - Get single patron
router.get('/:id', async (req, res) => {
  try {
    const patron = await db.get_by_id('PATRONS', req.params.id);

    if (!patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    res.json({
      success: true,
      data: patron,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch patron',
      message: error.message,
    });
  }
});

// GET /api/v1/patrons/:id/transactions - Get patron's transaction history
router.get('/:id/transactions', async (req, res) => {
  try {
    const patron = await db.get_by_id('PATRONS', req.params.id);

    if (!patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    const transactions = await db.execute_query(
      `SELECT t.*, li.title, li.item_type 
       FROM TRANSACTIONS t 
       JOIN LIBRARY_ITEM_COPIES lic ON t.copy_id = lic.id 
       JOIN LIBRARY_ITEMS li ON lic.library_item_id = li.id 
       WHERE t.patron_id = ? 
       ORDER BY t.createdAt DESC`,
      [req.params.id]
    );

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch patron transactions',
      message: error.message,
    });
  }
});

// GET /api/v1/patrons/:id/fines - Get patron's fines
router.get('/:id/fines', async (req, res) => {
  try {
    const patron = await db.get_by_id('PATRONS', req.params.id);

    if (!patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    const fines = await db.execute_query(
      `SELECT * FROM FINES WHERE patron_id = ? ORDER BY createdAt DESC`,
      [req.params.id]
    );

    res.json({
      success: true,
      count: fines.length,
      data: fines,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch patron fines',
      message: error.message,
    });
  }
});

// GET /api/v1/patrons/:id/checkout-eligibility - Check if patron can checkout (NEW - US 1.3, US 2.3, US 2.7)
router.get('/:id/checkout-eligibility', async (req, res) => {
  try {
    const patron = await db.get_by_id('PATRONS', req.params.id);

    if (!patron) {
      return res.status(404).json({
        eligible: false,
        error: 'Patron not found',
      });
    }

    if (!patron.isActive) {
      return res.status(200).json({
        eligible: false,
        reason: 'inactive',
        message: 'Patron account is inactive',
      });
    }

    // Check card expiration - HIGHEST PRIORITY REQUIREMENT
    if (patron.card_expiration) {
      const expiration_date = new Date(patron.card_expiration);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiration_date.setHours(0, 0, 0, 0);

      if (expiration_date < today) {
        return res.status(200).json({
          eligible: false,
          reason: 'card_expired',
          card_expiration: patron.card_expiration,
          message: 'Library card has expired. Please renew your card before checkout.',
        });
      }
    }

    // Check for outstanding fees - US 2.7
    if (patron.balance > 0) {
      return res.status(200).json({
        eligible: false,
        reason: 'fees',
        balance: patron.balance,
        message: `Patron owes $${patron.balance.toFixed(2)}. Fees must be paid before checkout.`,
      });
    }

    // Check checkout limit - US 2.3
    const active_checkouts = await db.execute_query(
      'SELECT COUNT(*) as count FROM TRANSACTIONS WHERE patron_id = ? AND status = "active"',
      [req.params.id]
    );

    if (active_checkouts[0].count >= 20) {
      return res.status(200).json({
        eligible: false,
        reason: 'limit_reached',
        current_checkouts: active_checkouts[0].count,
        message: 'Patron has 20 items checked out. Cannot checkout more items.',
      });
    }

    res.json({
      eligible: true,
      patron_info: {
        id: patron.id,
        name: `${patron.first_name} ${patron.last_name}`,
        active_checkouts: active_checkouts[0].count,
        balance: patron.balance,
      },
    });
  } catch (error) {
    res.status(500).json({
      eligible: false,
      error: 'Failed to check patron eligibility',
      message: error.message,
    });
  }
});

// POST /api/v1/patrons - Create new patron
router.post(
  '/',
  validate_patron,
  handle_validation_errors,
  async (req, res) => {
    try {
      const patron_data = {
        id: uuidv4(),
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
        birthday: req.body.birthday || null,
        card_expiration: req.body.card_expiration || null,
        balance: req.body.balance || 0.0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await db.create_record('PATRONS', patron_data);

      res.status(201).json({
        success: true,
        message: 'Patron created successfully',
        data: patron_data,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create patron',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/patrons/:id - Update patron
router.put(
  '/:id',
  validate_patron,
  handle_validation_errors,
  async (req, res) => {
    try {
      const existing_patron = await db.get_by_id('PATRONS', req.params.id);

      if (!existing_patron) {
        return res.status(404).json({
          error: 'Patron not found',
        });
      }

      const updated = await db.update_record(
        'PATRONS',
        req.params.id,
        req.body
      );

      if (updated) {
        res.json({
          success: true,
          message: 'Patron updated successfully',
        });
      } else {
        res.status(500).json({
          error: 'Failed to update patron',
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update patron',
        message: error.message,
      });
    }
  }
);

// DELETE /api/v1/patrons/:id - Delete patron (soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const existing_patron = await db.get_by_id('PATRONS', req.params.id);

    if (!existing_patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    // Check if patron has active transactions
    const active_transactions = await db.execute_query(
      'SELECT COUNT(*) as count FROM TRANSACTIONS WHERE patron_id = ? AND status = "active"',
      [req.params.id]
    );

    if (active_transactions[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete patron with active transactions',
      });
    }

    const updated = await db.update_record('PATRONS', req.params.id, {
      isActive: false,
    });

    if (updated) {
      res.json({
        success: true,
        message: 'Patron deactivated successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to deactivate patron',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to deactivate patron',
      message: error.message,
    });
  }
});

module.exports = router;
