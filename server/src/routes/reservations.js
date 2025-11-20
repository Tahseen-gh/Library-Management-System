import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

// Helper function to check and process expired reservations
const process_expired_reservations = async () => {
  try {
    // Find all "ready" reservations that have expired (more than 5 days old)
    const expired_reservations = await db.execute_query(
      'SELECT * FROM RESERVATIONS WHERE status = "ready" AND expiry_date < ?',
      [new Date().toISOString()]
    );

    for (const reservation of expired_reservations) {
      // Mark reservation as expired
      await db.update_record('RESERVATIONS', reservation.id, {
        status: 'expired',
        updated_at: new Date().toISOString(),
      });

      // Set item back to "returned" status
      // For copy-specific reservations, get the specific copy
      // For item-level reservations, get any reserved copy for that item
      let copies;
      if (reservation.copy_id) {
        copies = await db.execute_query(
          'SELECT * FROM LIBRARY_ITEM_COPIES WHERE id = ? AND status = "Reserved" LIMIT 1',
          [reservation.copy_id]
        );
      } else {
        copies = await db.execute_query(
          'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Reserved" LIMIT 1',
          [reservation.library_item_id]
        );
      }

      if (copies.length > 0) {
        await db.update_record('LIBRARY_ITEM_COPIES', copies[0].id, {
          status: 'Returned',
          updated_at: new Date().toISOString(),
        });

        // Check for next person in queue
        // For copy-specific, get next waiting reservation for that specific copy
        // For item-level, get next waiting item-level reservation
        let next_in_queue;
        if (reservation.copy_id) {
          next_in_queue = await db.execute_query(
            'SELECT * FROM RESERVATIONS WHERE copy_id = ? AND status = "waiting" ORDER BY queue_position LIMIT 1',
            [reservation.copy_id]
          );
        } else {
          next_in_queue = await db.execute_query(
            'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND copy_id IS NULL AND status = "waiting" ORDER BY queue_position LIMIT 1',
            [reservation.library_item_id]
          );
        }

        if (next_in_queue.length > 0) {
          // Move next person to "ready" status
          const new_expiry = new Date();
          new_expiry.setDate(new_expiry.getDate() + 5);

          await db.update_record('RESERVATIONS', next_in_queue[0].id, {
            status: 'ready',
            expiry_date: new_expiry.toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Set item back to Reserved (ready for pickup)
          await db.update_record('LIBRARY_ITEM_COPIES', copies[0].id, {
            status: 'Reserved',
            updated_at: new Date().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing expired reservations:', error);
  }
};

// Validation middleware
const validate_reservation = [
  body('library_item_id')
    .isInt({ min: 1 })
    .withMessage('Valid library item ID is required'),
  body('patron_id').isInt({ min: 1 }).withMessage('Valid patron ID is required'),
  body('copy_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid copy ID is required'),
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
    // Process expired reservations before fetching
    await process_expired_reservations();

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
      const { library_item_id, patron_id, copy_id } = req.body;

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

      // Verify library item exists
      const library_item = await db.get_by_id('LIBRARY_ITEMS', library_item_id);
      if (!library_item) {
        return res.status(400).json({
          error: 'Library item not found',
        });
      }

      // Step 8: Check item availability
      let available_copies = [];
      if (copy_id) {
        // Check if the specific copy is available
        const specific_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', copy_id);
        if (!specific_copy) {
          return res.status(400).json({
            error: 'Copy not found',
          });
        }
        if (specific_copy.library_item_id !== library_item.id) {
          return res.status(400).json({
            error: 'Copy does not belong to this item',
          });
        }
        if (specific_copy.status === 'Available') {
          available_copies = [specific_copy];
        }
      } else {
        // Check any available copy
        available_copies = await db.execute_query(
          'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Available"',
          [library_item.id]
        );
      }

      // Step 11: Check existing reservations
      let existing_reservations;
      if (copy_id) {
        // For copy-specific reservations, check reservations for this specific copy
        existing_reservations = await db.execute_query(
          'SELECT COUNT(*) as count FROM RESERVATIONS WHERE copy_id = ? AND status IN ("waiting", "ready")',
          [copy_id]
        );
      } else {
        // Check item-level reservations (where copy_id IS NULL)
        existing_reservations = await db.execute_query(
          'SELECT COUNT(*) as count FROM RESERVATIONS WHERE library_item_id = ? AND copy_id IS NULL AND status IN ("waiting", "ready")',
          [library_item.id]
        );
      }

      const total_copies = await db.execute_query(
        'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ?',
        [library_item.id]
      );

      // Step 12: Reservation allowed?
      // For copy-specific: always allowed (can queue for a specific copy)
      // For item-level: If all copies are reserved or checked out, add to waitlist
      const reservation_allowed = copy_id ||
                                  available_copies.length > 0 ||
                                  existing_reservations[0].count < total_copies[0].count;

      // Get next queue position
      // For copy-specific reservations, queue position is based on that copy only
      // For item-level reservations, queue position is based on all item-level reservations
      let queue_position_result;
      if (copy_id) {
        queue_position_result = await db.execute_query(
          'SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position FROM RESERVATIONS WHERE copy_id = ? AND status IN ("waiting", "ready")',
          [copy_id]
        );
      } else {
        queue_position_result = await db.execute_query(
          'SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position FROM RESERVATIONS WHERE library_item_id = ? AND copy_id IS NULL AND status IN ("waiting", "ready")',
          [library_item.id]
        );
      }

      const queue_position = queue_position_result[0].next_position;

      // Determine reservation status
      // For copy-specific reservations: only "ready" if that specific copy is available
      // For item-level reservations: "ready" if any copy is available
      // Otherwise: "waiting" (in queue)
      const reservation_status = (reservation_allowed && available_copies.length > 0) ? 'ready' : 'waiting';

      // Set expiry date to 5 days from now (only applies when status is "ready")
      const reservation_date = new Date();
      const expiry_date = new Date(reservation_date);
      expiry_date.setDate(expiry_date.getDate() + 5);

      const reservation_data = {
        library_item_id: library_item.id,
        patron_id,
        copy_id: copy_id || null,
        reservation_date: reservation_date.toISOString(),
        expiry_date: expiry_date.toISOString(),
        status: reservation_status,
        queue_position,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Step 13: Create reservation record
      const reservation_id = await db.create_record('RESERVATIONS', reservation_data);

      // Step 14: Update item status to Reserved (ready for pickup) if reservation is ready
      if (reservation_status === 'ready' && available_copies.length > 0) {
        // For copy-specific reservations, use the specific copy
        // For item-level reservations, use the first available copy
        const copy_to_reserve = copy_id ? available_copies[0] : available_copies[0];
        await db.update_record('LIBRARY_ITEM_COPIES', copy_to_reserve.id, {
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
        status: reservation_status === 'ready' ? 'Active' : 'Waiting',
        notes: reservation_status === 'ready'
          ? 'Item ready for pickup - on reserved shelf'
          : 'Patron waiting in queue for item',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.create_record('TRANSACTIONS', transaction_data);

      // Response varies based on reservation status
      res.status(201).json({
        success: true,
        message: reservation_status === 'ready'
          ? 'Reservation ready for pickup'
          : 'Added to waitlist',
        data: {
          ...reservation_data,
          id: reservation_id,
        },
        on_waitlist: reservation_status === 'waiting',
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

    if (reservation.status !== 'waiting' && reservation.status !== 'ready') {
      return res.status(400).json({
        error: 'Only waiting or ready reservations can be fulfilled',
      });
    }

    // Check if item is available
    // For copy-specific reservations, check only that specific copy
    // For item-level reservations, check any available copy
    let available_copies;
    if (reservation.copy_id) {
      available_copies = await db.execute_query(
        'SELECT * FROM LIBRARY_ITEM_COPIES WHERE id = ? AND status = "Available" LIMIT 1',
        [reservation.copy_id]
      );

      if (available_copies.length === 0) {
        return res.status(400).json({
          error: 'The specific copy for this reservation is not available',
        });
      }
    } else {
      available_copies = await db.execute_query(
        'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Available" LIMIT 1',
        [reservation.library_item_id]
      );

      if (available_copies.length === 0) {
        return res.status(400).json({
          error: 'No available copies to fulfill reservation',
        });
      }
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
    // For copy-specific reservations, only update queue for that specific copy
    // For item-level reservations, only update queue for item-level reservations
    if (reservation.copy_id) {
      await db.execute_query(
        'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE copy_id = ? AND queue_position > ? AND status = "waiting"',
        [reservation.copy_id, reservation.queue_position]
      );
    } else {
      await db.execute_query(
        'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE library_item_id = ? AND copy_id IS NULL AND queue_position > ? AND status = "waiting"',
        [reservation.library_item_id, reservation.queue_position]
      );
    }

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
      // For copy-specific reservations, get the specific copy
      // For item-level reservations, get any reserved copy for that item
      let reserved_copies;
      if (reservation.copy_id) {
        reserved_copies = await db.execute_query(
          'SELECT * FROM LIBRARY_ITEM_COPIES WHERE id = ? AND status = "Reserved" LIMIT 1',
          [reservation.copy_id]
        );
      } else {
        reserved_copies = await db.execute_query(
          'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Reserved" LIMIT 1',
          [reservation.library_item_id]
        );
      }

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

    if (reservation.status !== 'waiting' && reservation.status !== 'ready') {
      return res.status(400).json({
        error: 'Only waiting or ready reservations can be cancelled',
      });
    }

    // Update reservation status to cancelled
    await db.update_record('RESERVATIONS', req.params.id, {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    });

    // If there was a reserved copy, we need to handle it carefully
    if (reservation.status === 'ready') {
      // For copy-specific reservations, find the specific reserved copy
      // For item-level reservations, find any reserved copy
      let reserved_copies;
      if (reservation.copy_id) {
        reserved_copies = await db.execute_query(
          'SELECT * FROM LIBRARY_ITEM_COPIES WHERE id = ? AND status = "Reserved"',
          [reservation.copy_id]
        );
      } else {
        reserved_copies = await db.execute_query(
          'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Reserved"',
          [reservation.library_item_id]
        );
      }

      // Check if there are waiting reservations that should be promoted
      let next_waiting_reservations;
      if (reservation.copy_id) {
        // For copy-specific, get next waiting reservation for this specific copy
        next_waiting_reservations = await db.execute_query(
          'SELECT * FROM RESERVATIONS WHERE copy_id = ? AND status = "waiting" ORDER BY queue_position LIMIT 1',
          [reservation.copy_id]
        );
      } else {
        // For item-level, get next waiting item-level reservation
        next_waiting_reservations = await db.execute_query(
          'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND copy_id IS NULL AND status = "waiting" ORDER BY queue_position LIMIT 1',
          [reservation.library_item_id]
        );
      }

      if (next_waiting_reservations.length > 0 && reserved_copies.length > 0) {
        // CRITICAL: Promote the next waiting reservation to "ready" status
        // This ensures queue position #1 is always "ready", never "waiting"
        const next_reservation = next_waiting_reservations[0];
        const new_expiry = new Date();
        new_expiry.setDate(new_expiry.getDate() + 5);

        await db.update_record('RESERVATIONS', next_reservation.id, {
          status: 'ready',
          expiry_date: new_expiry.toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Keep the copy as "Reserved" for the promoted reservation
        // (no need to change copy status since it was already Reserved)
      } else if (reserved_copies.length > 0) {
        // No waiting reservations, so make the copy available
        await db.update_record('LIBRARY_ITEM_COPIES', reserved_copies[0].id, {
          status: 'Available',
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Update queue positions for remaining reservations
    // For copy-specific reservations, only update queue for that specific copy
    // For item-level reservations, only update queue for item-level reservations
    if (reservation.copy_id) {
      await db.execute_query(
        'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE copy_id = ? AND queue_position > ? AND status IN ("waiting", "ready")',
        [reservation.copy_id, reservation.queue_position]
      );
    } else {
      await db.execute_query(
        'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE library_item_id = ? AND copy_id IS NULL AND queue_position > ? AND status IN ("waiting", "ready")',
        [reservation.library_item_id, reservation.queue_position]
      );
    }

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
