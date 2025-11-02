const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const router = express.Router();

// Validation middleware
const validate_reservation = [
  body('library_item_id')
    .notEmpty()
    .withMessage('Valid library item ID is required'),
  body('patron_id').notEmpty().withMessage('Valid patron ID is required'),
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

// GET /api/v1/reservations - Get all reservations
router.get('/', async (req, res) => {
  try {
    const { patron_id, status, library_item_id } = req.query;
    let query = `
      SELECT 
        r.*,
        p.first_name,
        p.last_name,
        p.email,
        li.title,
        li.item_type
      FROM RESERVATIONS r
      JOIN PATRONS p ON r.patron_id = p.id
      JOIN LIBRARY_ITEMS li ON r.library_item_id = li.id
    `;
    let params = [];
    let conditions = [];

    if (patron_id) {
      conditions.push('r.patron_id = ?');
      params.push(patron_id);
    }
    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (library_item_id) {
      conditions.push('r.library_item_id = ?');
      params.push(library_item_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.queue_position ASC, r.reservation_date ASC';

    const reservations = await db.execute_query(query, params);

    res.json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch reservations',
      message: error.message,
    });
  }
});

// GET /api/v1/reservations/:id - Get single reservation
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.*,
        p.first_name,
        p.last_name,
        p.email,
        li.title,
        li.item_type,
        li.description
      FROM RESERVATIONS r
      JOIN PATRONS p ON r.patron_id = p.id
      JOIN LIBRARY_ITEMS li ON r.library_item_id = li.id
      WHERE r.id = ?
    `;

    const results = await db.execute_query(query, [req.params.id]);
    const reservation = results[0];

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
      });
    }

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch reservation',
      message: error.message,
    });
  }
});

// POST /api/v1/reservations - Create new reservation
router.post(
  '/',
  validate_reservation,
  handle_validation_errors,
  async (req, res) => {
    try {
      const { library_item_id, patron_id } = req.body;

      // Verify library item exists
      const library_item = await db.get_by_id('LIBRARY_ITEMS', library_item_id);
      if (!library_item) {
        return res.status(400).json({
          error: 'Library item not found',
        });
      }

      // Verify patron exists and is active
      const patron = await db.get_by_id('PATRONS', patron_id);
      if (!patron || !patron.isActive) {
        return res.status(400).json({
          error: 'Patron not found or inactive',
        });
      }

      // Check if patron already has a reservation for this item
      const existing_reservation = await db.execute_query(
        'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND patron_id = ? AND status = "active"',
        [library_item_id, patron_id]
      );

      if (existing_reservation.length > 0) {
        return res.status(400).json({
          error: 'Patron already has an active reservation for this item',
        });
      }

      // Check if item is available
      const available_copies = await db.execute_query(
        'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "available"',
        [library_item_id]
      );

      if (available_copies[0].count > 0) {
        return res.status(400).json({
          error: 'Item is currently available - no reservation needed',
        });
      }

      // Get next queue position
      const queue_position_result = await db.execute_query(
        'SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position FROM RESERVATIONS WHERE library_item_id = ? AND status = "active"',
        [library_item_id]
      );

      const queue_position = queue_position_result[0].next_position;

      // Calculate expiry date (7 days from now)
      const reservation_date = new Date().toISOString();
      const expiry_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const reservation_data = {
        id: uuidv4(),
        library_item_id,
        patron_id,
        reservation_date,
        expiry_date,
        status: 'active',
        queue_position,
        notification_sent: null,
        createdAt: reservation_date,
        updatedAt: reservation_date,
      };

      await db.create_record('RESERVATIONS', reservation_data);

      res.status(201).json({
        success: true,
        message: 'Reservation created successfully',
        data: reservation_data,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create reservation',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/reservations/:id/fulfill - Fulfill reservation
router.put('/:id/fulfill', async (req, res) => {
  try {
    const reservation = await db.get_by_id('RESERVATIONS', req.params.id);

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
      });
    }

    if (reservation.status !== 'active') {
      return res.status(400).json({
        error: 'Only active reservations can be fulfilled',
      });
    }

    // Check if item is available
    const available_copies = await db.execute_query(
      'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "available" LIMIT 1',
      [reservation.library_item_id]
    );

    if (available_copies.length === 0) {
      return res.status(400).json({
        error: 'No available copies to fulfill reservation',
      });
    }

    // Update reservation status
    await db.update_record('RESERVATIONS', req.params.id, {
      status: 'fulfilled',
      notification_sent: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Reserve the library item copy
    await db.update_record('LIBRARY_ITEM_COPIES', available_copies[0].id, {
      status: 'reserved',
      updatedAt: new Date().toISOString(),
    });

    // Update queue positions for remaining reservations
    await db.execute_query(
      'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE library_item_id = ? AND queue_position > ? AND status = "active"',
      [reservation.library_item_id, reservation.queue_position]
    );

    res.json({
      success: true,
      message: 'Reservation fulfilled successfully',
      data: {
        reservation_id: req.params.id,
        copy_id: available_copies[0].id,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fulfill reservation',
      message: error.message,
    });
  }
});

// DELETE /api/v1/reservations/:id - Cancel reservation
router.delete('/:id', async (req, res) => {
  try {
    const reservation = await db.get_by_id('RESERVATIONS', req.params.id);

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
      });
    }

    if (reservation.status !== 'active') {
      return res.status(400).json({
        error: 'Only active reservations can be cancelled',
      });
    }

    // Update reservation status to cancelled
    await db.update_record('RESERVATIONS', req.params.id, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    // Update queue positions for remaining reservations
    await db.execute_query(
      'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE library_item_id = ? AND queue_position > ? AND status = "active"',
      [reservation.library_item_id, reservation.queue_position]
    );

    res.json({
      success: true,
      message: 'Reservation cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cancel reservation',
      message: error.message,
    });
  }
});

module.exports = router;