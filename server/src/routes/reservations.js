import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

// Validation middleware
const validate_reservation = [
  body('library_item_id')
    .isUUID()
    .withMessage('Valid library item ID is required'),
  body('patron_id').isString().withMessage('Valid patron ID is required'),
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
    let conditions = '';
    let params = [];

    const filters = [];
    if (patron_id) {
      filters.push('r.patron_id = ?');
      params.push(patron_id);
    }
    if (status) {
      filters.push('r.status = ?');
      params.push(status);
    }
    if (library_item_id) {
      filters.push('r.library_item_id = ?');
      params.push(library_item_id);
    }

    if (filters.length > 0) {
      conditions = ' WHERE ' + filters.join(' AND ');
    }

    const query = `
      SELECT 
        r.*,
        p.first_name,
        p.last_name,
        p.email,
        ci.title,
        ci.item_type
      FROM RESERVATIONS r
      JOIN PATRONS p ON r.patron_id = p.id
      JOIN LIBRARY_ITEMS ci ON r.library_item_id = ci.id
      ${conditions}
      ORDER BY r.queue_position, r.reservation_date
    `;

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
        ci.title,
        ci.item_type,
        ci.description
      FROM RESERVATIONS r
      JOIN PATRONS p ON r.patron_id = p.id
      JOIN LIBRARY_ITEMS ci ON r.library_item_id = ci.id
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
      if (!patron || !patron.is_active) {
        return res.status(400).json({
          error: 'Patron not found or inactive',
        });
      }

      // Check if patron already has a reservation for this item
      const existing_reservation = await db.execute_query(
        'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND patron_id = ? AND status = "pending"',
        [library_item.id, patron_id]
      );

      if (existing_reservation.length > 0) {
        return res.status(400).json({
          error: 'Patron already has a pending reservation for this item',
        });
      }

      // Check if item is available
      const available_copies = await db.execute_query(
        'SELECT COUNT(*) as count FROM ITEM_COPIES WHERE library_item_id = ? AND status = "Available"',
        [library_item.id]
      );

      if (available_copies[0].count > 0) {
        return res.status(400).json({
          error: 'Item is currently available - no reservation needed',
        });
      }

      // Get next queue position
      const queue_position_result = await db.execute_query(
        'SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position FROM RESERVATIONS WHERE library_item_id = ? AND status = "pending"',
        [library_item.id]
      );

      const queue_position = queue_position_result[0].next_position;

      // Calculate expiry date (7 days from now)
      const expiry_date = new Date();
      expiry_date.setDate(expiry_date.getDate() + 7);

      const reservation_data = {
        library_item_id: library_item.id,
        patron_id,
        reservation_date: new Date(),
        expiry_date,
        status: 'pending',
        queue_position,
        created_at: new Date(),
        updated_at: new Date(),
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

    if (reservation.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending reservations can be fulfilled',
      });
    }

    // Check if item is available
    const available_copies = await db.execute_query(
      'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Available" LIMIT 1',
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
      notification_sent: new Date(),
      updated_at: new Date(),
    });

    // Reserve the item copy
    await db.update_record('ITEM_COPIES', available_copies[0].id, {
      status: 'Reserved',
      updated_at: new Date(),
    });

    // Update queue positions for remaining reservations
    await db.execute_query(
      'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE library_item_id = ? AND queue_position > ? AND status = "pending"',
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

    if (reservation.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending reservations can be cancelled',
      });
    }

    // Update reservation status to cancelled
    await db.update_record('RESERVATIONS', req.params.id, {
      status: 'cancelled',
      updated_at: new Date(),
    });

    // Update queue positions for remaining reservations
    await db.execute_query(
      'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE library_item_id = ? AND queue_position > ? AND status = "pending"',
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

export default router;
