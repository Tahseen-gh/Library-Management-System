import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

var router = express.Router();

// Validation middleware
var validate_fine = [
  body('transaction_id').notEmpty().withMessage('Transaction ID is required'),
  body('patron_id').notEmpty().withMessage('Patron ID is required'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
];

// Helper function to handle validation errors
var handle_validation_errors = function (req, res, next) {
  var errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// GET /api/v1/fines - Get all fines
router.get('/', async function (req, res) {
  try {
    var unpaid_only = req.query.unpaid_only;
    var query = 'SELECT * FROM FINES';

    if (unpaid_only === 'true') {
      query += ' WHERE is_paid = 0';
    }

    query += ' ORDER BY created_at DESC';

    var fines = await db.execute_query(query);

    res.json({
      success: true,
      count: fines.length,
      data: fines,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch fines',
      message: error.message,
    });
  }
});

// GET /api/v1/fines/:id - Get single fine
router.get('/:id', async function (req, res) {
  try {
    var fine = await db.get_by_id('FINES', req.params.id);

    if (!fine) {
      return res.status(404).json({
        error: 'Fine not found',
      });
    }

    res.json({
      success: true,
      data: fine,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch fine',
      message: error.message,
    });
  }
});

// POST /api/v1/fines - Create new fine
router.post(
  '/',
  validate_fine,
  handle_validation_errors,
  async function (req, res) {
    try {
      var fine_data = {
        transaction_id: req.body.transaction_id,
        patron_id: req.body.patron_id,
        amount: req.body.amount,
        reason: req.body.reason || null,
        is_paid: false,
        paid_date: null,
        payment_method: null,
        notes: req.body.notes || null,
        created_at: new Date().toISOString(),
      };

      await db.create_record('FINES', fine_data);

      // Update patron balance
      await db.execute_query(
        'UPDATE PATRONS SET balance = balance + ? WHERE id = ?',
        [fine_data.amount, fine_data.patron_id]
      );

      res.status(201).json({
        success: true,
        message: 'Fine created successfully',
        data: fine_data,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create fine',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/fines/:id/pay - Mark fine as paid
router.put('/:id/pay', async function (req, res) {
  try {
    var fine = await db.get_by_id('FINES', req.params.id);

    if (!fine) {
      return res.status(404).json({
        error: 'Fine not found',
      });
    }

    if (fine.is_paid) {
      return res.status(400).json({
        error: 'Fine has already been paid',
      });
    }

    var update_data = {
      is_paid: true,
      paid_date: new Date().toISOString().split('T')[0],
      payment_method: req.body.payment_method || 'Cash',
    };

    await db.update_record('FINES', req.params.id, update_data);

    // Update patron balance
    await db.execute_query(
      'UPDATE PATRONS SET balance = balance - ? WHERE id = ?',
      [fine.amount, fine.patron_id]
    );

    res.json({
      success: true,
      message: 'Fine marked as paid',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to mark fine as paid',
      message: error.message,
    });
  }
});

// DELETE /api/v1/fines/:id - Delete fine
router.delete('/:id', async function (req, res) {
  try {
    var fine = await db.get_by_id('FINES', req.params.id);

    if (!fine) {
      return res.status(404).json({
        error: 'Fine not found',
      });
    }

    // If fine was paid, refund to patron balance
    if (fine.is_paid) {
      await db.execute_query(
        'UPDATE PATRONS SET balance = balance + ? WHERE id = ?',
        [fine.amount, fine.patron_id]
      );
    } else {
      // If unpaid, reduce patron balance
      await db.execute_query(
        'UPDATE PATRONS SET balance = balance - ? WHERE id = ?',
        [fine.amount, fine.patron_id]
      );
    }

    var deleted = await db.delete_record('FINES', req.params.id);

    if (deleted) {
      res.json({
        success: true,
        message: 'Fine deleted successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete fine',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete fine',
      message: error.message,
    });
  }
});

export default router;
