const express = require('express');
const { body, validationResult } = require('express-validator');
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
    let conditions = '';
    let params = [];

    if (active_only === 'true') {
      conditions += ' WHERE is_active = 1';
    }

    if (search) {
      conditions += active_only === 'true' ? ' AND' : ' WHERE';
      conditions += ' (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const patrons = await db.execute_query(
      `SELECT * FROM patrons ${conditions}`,
      params
    );
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
    const patron = await db.get_by_id('patrons', req.params.id);

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
    const patron = await db.get_by_id('patrons', req.params.id);

    if (!patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    const transactions = await db.execute_query(
      `SELECT t.*, ci.title, ci.item_type 
       FROM transactions t 
       JOIN item_copies ic ON t.copy_id = ic.id 
       JOIN catalog_items ci ON ic.catalog_item_id = ci.id 
       WHERE t.patron_id = ? 
       ORDER BY t.created_at DESC`,
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

// POST /api/v1/patrons - Create new patron
router.post(
  '/',
  validate_patron,
  handle_validation_errors,
  async (req, res) => {
    try {
      const patron_data = {
        ...req.body,
        balance: req.body.balance || 0.0,
        is_active: true,
        created_at: new Date(),
      };

      const patron_id = await db.create_record('patrons', patron_data);

      res.status(201).json({
        success: true,
        message: 'Patron created successfully',
        data: { id: patron_id, ...patron_data },
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
      const existing_patron = await db.get_by_id('patrons', req.params.id);

      if (!existing_patron) {
        return res.status(404).json({
          error: 'Patron not found',
        });
      }

      const updated = await db.update_record(
        'patrons',
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

// DELETE /api/v1/patrons/:id - Delete patron (soft delete by setting is_active to false)
router.delete('/:id', async (req, res) => {
  try {
    const existing_patron = await db.get_by_id('patrons', req.params.id);

    if (!existing_patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    // Check if patron has active transactions
    const active_transactions = await db.execute_query(
      'SELECT COUNT(*) as count FROM transactions WHERE patron_id = ? AND status = "active"',
      [req.params.id]
    );

    if (active_transactions[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete patron with active transactions',
      });
    }

    const updated = await db.update_record('patrons', req.params.id, {
      is_active: false,
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
