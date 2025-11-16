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
// Follows exact flow from diagram
router.post(
  '/',
  validate_reservation,
  handle_validation_errors,
  async (req, res) => {
    try {
      const { library_item_id, patron_id } = req.body;

      // Step 4: Lookup patron record
      const patron = await db.get_by_id('PATRONS', patron_id);

      // Step 6-7: Validate patron account
      if (!patron) {
        return res.status(400).json({
          error: 'Return validation failure',
          message: 'Patron not found',
          validation_failed: true,
        });
      }

      if (!patron.is_active) {
        return res.status(400).json({
          error: 'Return validation failure',
          message: 'Patron account is not active',
          validation_failed: true,
        });
      }

      // Check for unpaid fines or expired card
      const card_expiration = new Date(patron.card_expiration_date);
      const today = new Date();
      if (card_expiration < today) {
        return res.status(400).json({
          error: 'Return validation failure',
          message: 'Patron card has expired',
          validation_failed: true,
        });
      }

      // Verify library item exists
      const library_item = await db.get_by_id('LIBRARY_ITEMS', library_item_id);
      if (!library_item) {
        return res.status(400).json({
          error: 'Library item not found',
        });
      }

      // Step 8: Check item availability
      const available_copies = await db.execute_query(
        'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Available"',
        [library_item.id]
      );

      // Step 9-10: Check if item is already reserved by this patron
      const existing_patron_reservation = await db.execute_query(
        'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND patron_id = ? AND status IN ("pending", "ready")',
        [library_item.id, patron_id]
      );

      if (existing_patron_reservation.length > 0) {
        return res.status(400).json({
          error: 'Item already reserved',
          message: 'Patron already has a reservation for this item',
          already_reserved: true,
        });
      }

      // Step 11: Check existing reservations
      const existing_reservations = await db.execute_query(
        'SELECT COUNT(*) as count FROM RESERVATIONS WHERE library_item_id = ? AND status = "pending"',
        [library_item.id]
      );

      const total_copies = await db.execute_query(
        'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ?',
        [library_item.id]
      );

      // Step 12: Reservation allowed?
      // If all copies are reserved or checked out, add to waitlist
      const reservation_allowed = available_copies.length > 0 ||
                                  existing_reservations[0].count < total_copies[0].count;

      // Get next queue position
      const queue_position_result = await db.execute_query(
        'SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position FROM RESERVATIONS WHERE library_item_id = ? AND status IN ("pending", "ready")',
        [library_item.id]
      );

      const queue_position = queue_position_result[0].next_position;

      // Expiry date will be set when item becomes available (5 days after return)
      // For now, set a far future date as placeholder
      const expiry_date = null;

      const reservation_data = {
        library_item_id: library_item.id,
        patron_id,
        reservation_date: new Date().toISOString(),
        expiry_date,
        status: reservation_allowed ? 'pending' : 'waitlist',
        queue_position,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Step 13: Create reservation record (or add to waitlist)
      const reservation_id = await db.create_record('RESERVATIONS', reservation_data);

      // Step 14: Update item status to Reserved (if reservation allowed and item available)
      if (reservation_allowed && available_copies.length > 0) {
        await db.update_record('LIBRARY_ITEM_COPIES', available_copies[0].id, {
          status: 'Reserved',
          updated_at: new Date().toISOString(),
        });
      }

      // Step 16: Log reservation transaction
      const transaction_data = {
        copy_id: available_copies.length > 0 ? available_copies[0].id : null,
        patron_id,
        location_id: 1, // Default branch
        transaction_type: 'Reservation',
        status: reservation_allowed ? 'Active' : 'Waitlist',
        notes: reservation_allowed
          ? 'Item reserved for patron'
          : 'Patron added to waitlist - reservation not immediately available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.create_record('TRANSACTIONS', transaction_data);

      // Response varies based on whether reservation was allowed or waitlisted
      res.status(201).json({
        success: true,
        message: reservation_allowed
          ? 'Reservation created successfully'
          : 'Added to waitlist - item fully reserved',
        data: {
          ...reservation_data,
          id: reservation_id,
        },
        on_waitlist: !reservation_allowed,
        patron_details: {
          first_name: patron.first_name,
          last_name: patron.last_name,
          email: patron.email,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create reservation',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/reservations/:id/fulfill - Fulfill reservation when item is returned
// Sets 5-day expiry from the fulfillment date
router.put('/:id/fulfill', async (req, res) => {
  try {
    const reservation = await db.get_by_id('RESERVATIONS', req.params.id);

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
      });
    }

    if (reservation.status !== 'pending' && reservation.status !== 'waitlist') {
      return res.status(400).json({
        error: 'Only pending or waitlist reservations can be fulfilled',
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

    // Calculate expiry date: 5 days from now (when item becomes available)
    const expiry_date = new Date();
    expiry_date.setDate(expiry_date.getDate() + 5);

    // Update reservation status to 'ready' and set expiry date
    await db.update_record('RESERVATIONS', req.params.id, {
      status: 'ready',
      expiry_date: expiry_date.toISOString(),
      notification_sent: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Reserve the item copy
    await db.update_record('LIBRARY_ITEM_COPIES', available_copies[0].id, {
      status: 'Reserved',
      updated_at: new Date().toISOString(),
    });

    // Log transaction for fulfillment
    await db.create_record('TRANSACTIONS', {
      copy_id: available_copies[0].id,
      patron_id: reservation.patron_id,
      location_id: 1,
      transaction_type: 'Reservation Fulfilled',
      status: 'Active',
      notes: `Reservation fulfilled - item available for pickup. Expires in 5 days.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Update queue positions for remaining reservations
    await db.execute_query(
      'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE library_item_id = ? AND queue_position > ? AND status IN ("pending", "waitlist")',
      [reservation.library_item_id, reservation.queue_position]
    );

    res.json({
      success: true,
      message: 'Reservation fulfilled successfully - patron has 5 days to collect',
      data: {
        reservation_id: req.params.id,
        copy_id: available_copies[0].id,
        expiry_date: expiry_date.toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fulfill reservation',
      message: error.message,
    });
  }
});

// GET /api/v1/reservations/validate-patron/:patron_id - Validate patron for reservation
// Used by UI to lookup and display patron details before creating reservation
router.get('/validate-patron/:patron_id', async (req, res) => {
  try {
    const patron = await db.get_by_id('PATRONS', req.params.patron_id);

    if (!patron) {
      return res.status(404).json({
        error: 'Patron not found',
        valid: false,
      });
    }

    // Check if patron is active
    if (!patron.is_active) {
      return res.status(400).json({
        error: 'Patron account is not active',
        valid: false,
        patron: {
          first_name: patron.first_name,
          last_name: patron.last_name,
          email: patron.email,
          is_active: patron.is_active,
        },
      });
    }

    // Check card expiration
    const card_expiration = new Date(patron.card_expiration_date);
    const today = new Date();
    if (card_expiration < today) {
      return res.status(400).json({
        error: 'Patron card has expired',
        valid: false,
        patron: {
          first_name: patron.first_name,
          last_name: patron.last_name,
          email: patron.email,
          card_expiration_date: patron.card_expiration_date,
          is_active: patron.is_active,
        },
      });
    }

    res.json({
      success: true,
      valid: true,
      patron: {
        id: patron.id,
        first_name: patron.first_name,
        last_name: patron.last_name,
        email: patron.email,
        phone: patron.phone,
        address: patron.address,
        card_expiration_date: patron.card_expiration_date,
        is_active: patron.is_active,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to validate patron',
      message: error.message,
    });
  }
});

// PUT /api/v1/reservations/expire-old - Expire reservations older than 5 days
// Should be called periodically (e.g., daily cron job)
router.put('/expire-old', async (req, res) => {
  try {
    const today = new Date().toISOString();

    // Find all ready reservations that have expired
    const expired_reservations = await db.execute_query(
      'SELECT * FROM RESERVATIONS WHERE status = "ready" AND expiry_date < ?',
      [today]
    );

    let expired_count = 0;

    for (const reservation of expired_reservations) {
      // Update reservation status to expired
      await db.update_record('RESERVATIONS', reservation.id, {
        status: 'expired',
        updated_at: new Date().toISOString(),
      });

      // Get the reserved copy and make it available again
      const reserved_copies = await db.execute_query(
        'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Reserved" LIMIT 1',
        [reservation.library_item_id]
      );

      if (reserved_copies.length > 0) {
        await db.update_record('LIBRARY_ITEM_COPIES', reserved_copies[0].id, {
          status: 'Available',
          updated_at: new Date().toISOString(),
        });
      }

      // Log transaction
      await db.create_record('TRANSACTIONS', {
        copy_id: reserved_copies.length > 0 ? reserved_copies[0].id : null,
        patron_id: reservation.patron_id,
        location_id: 1,
        transaction_type: 'Reservation Expired',
        status: 'Completed',
        notes: 'Reservation expired - patron did not collect within 5 days',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      expired_count++;
    }

    res.json({
      success: true,
      message: `${expired_count} reservation(s) expired`,
      expired_count,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to expire reservations',
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

    if (reservation.status !== 'pending' && reservation.status !== 'waitlist') {
      return res.status(400).json({
        error: 'Only pending or waitlist reservations can be cancelled',
      });
    }

    // Update reservation status to cancelled
    await db.update_record('RESERVATIONS', req.params.id, {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    });

    // If there was a reserved copy, make it available
    if (reservation.status === 'pending') {
      const reserved_copies = await db.execute_query(
        'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Reserved"',
        [reservation.library_item_id]
      );

      if (reserved_copies.length > 0) {
        await db.update_record('LIBRARY_ITEM_COPIES', reserved_copies[0].id, {
          status: 'Available',
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Update queue positions for remaining reservations
    await db.execute_query(
      'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE library_item_id = ? AND queue_position > ? AND status IN ("pending", "waitlist")',
      [reservation.library_item_id, reservation.queue_position]
    );

    // Log transaction
    await db.create_record('TRANSACTIONS', {
      copy_id: null,
      patron_id: reservation.patron_id,
      location_id: 1,
      transaction_type: 'Reservation Cancelled',
      status: 'Completed',
      notes: 'Reservation cancelled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

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
