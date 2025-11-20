import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

const validate_checkout = [
  body('patron_id').isInt({ min: 1 }).withMessage('Valid patron ID is required'),
  body('copy_id').isInt({ min: 1 }).withMessage('Valid copy ID is required'),
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
        ic.library_item_id,
        b.branch_name
      FROM TRANSACTIONS t
      JOIN PATRONS p ON t.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES ic ON t.copy_id = ic.id
      JOIN LIBRARY_ITEMS ci ON ic.library_item_id = ci.id
      JOIN BRANCHES b ON ic.owning_branch_id = b.id
      ${conditions}
      ORDER BY t.created_at DESC
    `;

    const transactions = await db.execute_query(query, params);

    // Add copy labels to transactions
    const transactions_with_labels = await Promise.all(
      transactions.map(async (transaction) => {
        const all_copies = await db.execute_query(
          'SELECT id FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? ORDER BY id',
          [transaction.library_item_id]
        );

        const copy_index = all_copies.findIndex(
          (c) => c.id === transaction.copy_id
        );
        const copy_number = copy_index + 1;
        const total_copies = all_copies.length;
        const copy_label = `Copy ${copy_number} of ${total_copies}`;

        return {
          ...transaction,
          copy_label,
          copy_number,
          total_copies,
        };
      })
    );

    res.json({
      success: true,
      count: transactions_with_labels.length,
      data: transactions_with_labels,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message,
    });
  }
});

// GET /api/v1/transactions/checkin-lookup/:item_id - Get checked-out copies by Item ID
router.get('/checkin-lookup/:item_id', async (req, res) => {
  try {
    const item_id = parseInt(req.params.item_id);

    if (isNaN(item_id)) {
      return res.status(400).json({
        error: 'Invalid Item ID',
      });
    }

    // Get library item details
    const library_item = await db.get_by_id('LIBRARY_ITEMS', item_id);
    if (!library_item) {
      return res.status(404).json({
        error: 'Item not found',
      });
    }

    // Get all copies of this item
    const all_copies = await db.execute_query(
      'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? ORDER BY id',
      [item_id]
    );

    if (all_copies.length === 0) {
      return res.status(404).json({
        error: 'No copies found for this item',
      });
    }

    // Get all checked-out copies with transaction and patron info
    const checked_out_copies = await db.execute_query(
      `SELECT
        ic.id as copy_id,
        ic.status,
        ic.condition,
        t.id as transaction_id,
        t.patron_id,
        t.due_date,
        p.first_name,
        p.last_name
      FROM LIBRARY_ITEM_COPIES ic
      LEFT JOIN TRANSACTIONS t ON ic.id = t.copy_id AND t.status = 'Active'
      LEFT JOIN PATRONS p ON t.patron_id = p.id
      WHERE ic.library_item_id = ? AND ic.status = 'Checked Out'
      ORDER BY ic.id`,
      [item_id]
    );

    if (checked_out_copies.length === 0) {
      return res.status(404).json({
        error: 'No checked-out copies found for this item',
      });
    }

    // Calculate copy numbers (Copy X of Y)
    const total_copies = all_copies.length;
    const copies_with_numbers = checked_out_copies.map(copy => {
      // Find the index of this copy in all copies to determine its copy number
      const copy_index = all_copies.findIndex(c => c.id === copy.copy_id);
      const copy_number = copy_index + 1;

      // Calculate if overdue
      const due_date = new Date(copy.due_date);
      const today = new Date();
      const is_overdue = today > due_date;
      const days_overdue = is_overdue
        ? Math.ceil((today.getTime() - due_date.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const fine_amount = days_overdue * 0.5; // $0.50 per day

      return {
        copy_id: copy.copy_id,
        copy_label: `Copy ${copy_number} of ${total_copies}`,
        copy_number,
        total_copies,
        status: copy.status,
        condition: copy.condition,
        patron_name: `${copy.first_name} ${copy.last_name}`,
        patron_id: copy.patron_id,
        due_date: copy.due_date,
        is_overdue,
        days_overdue,
        fine_amount,
      };
    });

    // Get item type-specific info
    let item_type_info = {};
    if (library_item.item_type === 'BOOK' || library_item.item_type === 'book') {
      const books = await db.execute_query(
        'SELECT * FROM BOOKS WHERE library_item_id = ?',
        [item_id]
      );
      item_type_info = books[0] || {};
    } else if (library_item.item_type === 'VIDEO' || library_item.item_type === 'video') {
      const videos = await db.execute_query(
        'SELECT * FROM VIDEOS WHERE library_item_id = ?',
        [item_id]
      );
      item_type_info = videos[0] || {};
    }

    res.json({
      success: true,
      data: {
        item: {
          id: library_item.id,
          title: library_item.title,
          item_type: library_item.item_type,
          ...item_type_info,
        },
        checked_out_copies: copies_with_numbers,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to lookup item',
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
      FROM TRANSACTIONS t
      JOIN PATRONS p ON t.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES ic ON t.copy_id = ic.id
      JOIN LIBRARY_ITEMS ci ON ic.library_item_id = ci.id
      JOIN BRANCHES b ON ic.owning_branch_id = b.id
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

      // Process expired reservations before checkout
      // Import process_expired_reservations function from reservations route
      // For now, we'll inline the expiry check
      const expired_reservations = await db.execute_query(
        'SELECT * FROM RESERVATIONS WHERE status = "ready" AND expiry_date < ?',
        [new Date().toISOString()]
      );

      for (const reservation of expired_reservations) {
        await db.update_record('RESERVATIONS', reservation.id, {
          status: 'expired',
          updated_at: new Date().toISOString(),
        });

        const copies = await db.execute_query(
          'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Reserved" LIMIT 1',
          [reservation.library_item_id]
        );

        if (copies.length > 0) {
          await db.update_record('LIBRARY_ITEM_COPIES', copies[0].id, {
            status: 'Returned',
            updated_at: new Date().toISOString(),
          });

          const next_in_queue = await db.execute_query(
            'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND status = "waiting" ORDER BY queue_position LIMIT 1',
            [reservation.library_item_id]
          );

          if (next_in_queue.length > 0) {
            const new_expiry = new Date();
            new_expiry.setDate(new_expiry.getDate() + 5);

            await db.update_record('RESERVATIONS', next_in_queue[0].id, {
              status: 'ready',
              expiry_date: new_expiry.toISOString(),
              updated_at: new Date().toISOString(),
            });

            await db.update_record('LIBRARY_ITEM_COPIES', copies[0].id, {
              status: 'Reserved',
              updated_at: new Date().toISOString(),
            });
          }
        }
      }

      // Verify item copy exists and is available
      const item_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', copy_id);
      if (!item_copy) {
        return res.status(400).json({
          error: 'Item copy not found',
        });
      }

      // Check if item is available or reserved
      if (item_copy.status !== 'Available' && item_copy.status !== 'Reserved') {
        return res.status(400).json({
          error: 'Item is not available for checkout',
          current_status: item_copy.status,
        });
      }

      // Check if there are any waiting/ready reservations for this library item by other patrons
      // Only block if another patron has a BETTER queue position (lower number)
      // This allows multiple patrons to check out different copies of the same item

      // First, check if THIS patron has a reservation
      const patron_reservation = await db.execute_query(
        'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND patron_id = ? AND status IN ("waiting", "ready") ORDER BY queue_position LIMIT 1',
        [item_copy.library_item_id, patron_id]
      );

      // If patron has no reservation, check if there are ANY other active reservations
      // If patron HAS a reservation, only block if someone else has a BETTER queue position
      let other_patron_reservations = [];

      if (patron_reservation.length === 0) {
        // Patron has no reservation - block if there are ANY other reservations
        other_patron_reservations = await db.execute_query(
          'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND status IN ("waiting", "ready") ORDER BY queue_position LIMIT 1',
          [item_copy.library_item_id]
        );
      } else {
        // Patron has a reservation - only block if someone else has a better queue position
        const patron_queue_pos = patron_reservation[0].queue_position;
        other_patron_reservations = await db.execute_query(
          'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND patron_id != ? AND status IN ("waiting", "ready") AND queue_position < ? ORDER BY queue_position LIMIT 1',
          [item_copy.library_item_id, patron_id, patron_queue_pos]
        );
      }

      if (other_patron_reservations.length > 0) {
        return res.status(400).json({
          error: 'Item is reserved for another patron',
          message: 'This item has reservations that must be fulfilled first',
        });
      }

      // If item is reserved, verify the patron has a reservation for it
      let reservation_to_fulfill = null;
      if (item_copy.status === 'Reserved') {
        const reservations = await db.execute_query(
          'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND patron_id = ? AND status IN ("waiting", "ready") ORDER BY queue_position LIMIT 1',
          [item_copy.library_item_id, patron_id]
        );

        if (reservations.length === 0) {
          return res.status(400).json({
            error: 'Item is reserved for another patron',
            message: 'This item is reserved and you do not have an active reservation for it',
          });
        }

        reservation_to_fulfill = reservations[0];
      }

      // Verify patron exists and is active
      const patron = await db.get_by_id('PATRONS', patron_id);
      if (!patron || !patron.is_active) {
        return res.status(400).json({
          error: 'Patron not found or inactive',
        });
      }

      // Check for outstanding fines
      if (patron.balance > 0) {
        return res.status(400).json({
          success: false,
          error: 'Patron has outstanding fines',
          error_type: 'has_fines',
          balance: patron.balance,
          message: `Patron owes $${patron.balance.toFixed(2)} in fines. Fines must be paid before checkout.`,
        });
      }

      // Check if patron card is expired
      const card_expiration = new Date(patron.card_expiration_date);
      const today = new Date();
      if (card_expiration < today) {
        return res.status(400).json({
          success: false,
          error: 'Patron card has expired',
          error_type: 'card_expired',
          card_expiration_date: patron.card_expiration_date,
          message: `Patron card expired on ${card_expiration.toISOString().split('T')[0]}. Card must be renewed before checkout.`,
        });
      }

      // Calculate due date if not provided (default 14 days)
      const checkout_date = new Date();
      const calculated_due_date = due_date
        ? new Date(due_date)
        : new Date(checkout_date.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Create transaction
      const transaction_data = {
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

      await db.create_record('TRANSACTIONS', transaction_data);

      // Update item copy status and checkout info
      await db.update_record('LIBRARY_ITEM_COPIES', copy_id, {
        status: 'Checked Out',
        checked_out_by: patron_id,
        due_date: calculated_due_date,
        updated_at: new Date(),
      });

      // If this checkout fulfills a reservation, update the reservation status
      if (reservation_to_fulfill) {
        await db.update_record('RESERVATIONS', reservation_to_fulfill.id, {
          status: 'fulfilled',
          fulfillment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Log fulfillment transaction
        await db.create_record('TRANSACTIONS', {
          copy_id,
          patron_id,
          location_id: 1,
          transaction_type: 'Reservation Fulfilled',
          status: 'Completed',
          notes: `Reservation #${reservation_to_fulfill.id} fulfilled via checkout`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Fetch enriched data for receipt
      const query = `
        SELECT
          t.*,
          p.first_name,
          p.last_name,
          li.title,
          li.item_type,
          li.publication_year,
          b.author,
          b.publisher,
          v.director,
          v.studio,
          v.is_new_release
        FROM TRANSACTIONS t
        JOIN PATRONS p ON t.patron_id = p.id
        JOIN LIBRARY_ITEM_COPIES ic ON t.copy_id = ic.id
        JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
        LEFT JOIN BOOKS b ON li.id = b.library_item_id
        LEFT JOIN VIDEOS v ON li.id = v.library_item_id
        WHERE t.copy_id = ? AND t.patron_id = ? AND t.status = 'Active'
        ORDER BY t.created_at DESC
        LIMIT 1
      `;

      const results = await db.execute_query(query, [copy_id, patron_id]);
      const enriched_transaction = results[0];

      res.status(201).json({
        success: true,
        message: 'Item checked out successfully',
        data: enriched_transaction,
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
    body('copy_id').isNumeric().withMessage('Valid copy ID is required'),
  ],
  handle_validation_errors,
  async (req, res) => {
    try {
      const { copy_id, new_condition, new_location_id, notes } = req.body;

      // Find active transaction for this copy
      const active_transactions = await db.execute_query(
        'SELECT * FROM TRANSACTIONS WHERE copy_id = ? AND status = "Active" ORDER BY created_at DESC LIMIT 1',
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

      // Get item copy details
      const item_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', copy_id);
      if (!item_copy) {
        return res.status(400).json({
          error: 'Item copy not found',
        });
      }

      // Calculate fine if overdue
      let fine_amount = 0;
      if (return_date > due_date) {
        const days_overdue = Math.ceil(
          (return_date - due_date) / (1000 * 60 * 60 * 24)
        );
        fine_amount = days_overdue * 1.00; // $1.00 per day
        // Cap fine at book cost
        if (item_copy.cost && fine_amount > item_copy.cost) {
          fine_amount = item_copy.cost;
        }
      }

      // Update transaction
      await db.update_record('TRANSACTIONS', transaction.id, {
        return_date,
        fine_amount,
        status: 'Completed',
        notes: notes || null,
        updated_at: new Date(),
      });

      // Update item copy - always set to 'Returned' after check-in
      // Reservations will be promoted during the manual reshelving process
      const update_data = {
        status: 'Returned',
        checked_out_by: null,
        due_date: null,
        current_branch_id: new_location_id || item_copy.owning_branch_id,
        condition: new_condition || item_copy.condition,
        updated_at: new Date(),
      };

      await db.update_record('LIBRARY_ITEM_COPIES', copy_id, update_data);

      // Update patron balance if there's a fine
      if (fine_amount > 0) {
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
    const transaction = await db.get_by_id('TRANSACTIONS', req.params.id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    if (transaction.status !== 'Active') {
      return res.status(400).json({
        error: 'Only active transactions can be renewed',
      });
    }

    // Check renewal status - prevent if already renewed twice
    if (transaction.renewal_status === 'Renewed Twice') {
      return res.status(400).json({
        error: 'Item has already been renewed twice',
      });
    }

    // Get item copy
    const item_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', transaction.copy_id);
    if (!item_copy) {
      return res.status(400).json({
        error: 'Item copy not found',
      });
    }

    // Check if item is reserved
    const reservations = await db.execute_query(
      'SELECT COUNT(*) as count FROM RESERVATIONS WHERE library_item_id = ? AND status IN ("waiting", "ready")',
      [item_copy.library_item_id]
    );

    if (reservations[0].count > 0) {
      return res.status(400).json({
        error: 'Item is reserved',
      });
    }

    // Get patron information
    const patron = await db.get_by_id('PATRONS', transaction.patron_id);
    if (!patron) {
      return res.status(400).json({
        error: 'Patron not found',
      });
    }

    // Check if patron's card is expired
    const current_date = new Date().toISOString().split('T')[0];
    if (patron.card_expiration_date < current_date) {
      return res.status(400).json({
        error: "Patron's card is expired",
      });
    }

    // Check if patron has fines
    if (patron.balance > 0) {
      return res.status(400).json({
        error: 'Patron has fines',
      });
    }

    // Check if patron has too many books checked out
    const active_checkout_count = await db.execute_query(
      'SELECT COUNT(*) as count FROM TRANSACTIONS WHERE patron_id = ? AND status = "Active"',
      [transaction.patron_id]
    );

    if (active_checkout_count[0].count >= 20) {
      return res.status(400).json({
        error: 'Patron has too many books checked out',
      });
    }

    // Get item details for calculating due date
    const library_item = await db.execute_query(
      'SELECT li.*, v.is_new_release FROM LIBRARY_ITEMS li LEFT JOIN VIDEOS v ON li.id = v.library_item_id WHERE li.id = ?',
      [item_copy.library_item_id]
    );

    // Calculate new due date based on current date (not adding leftover time)
    const current_date_obj = new Date();
    let days_to_add = 14; // Default for books

    if (library_item[0]) {
      if (library_item[0].item_type === 'VIDEO' || library_item[0].item_type === 'video') {
        if (library_item[0].is_new_release === 1) {
          days_to_add = 3; // New release videos: 3 days
        } else {
          days_to_add = 7; // Regular videos: 7 days
        }
      } else if (library_item[0].item_type === 'BOOK' || library_item[0].item_type === 'book') {
        days_to_add = 28; // Books: 4 weeks
      }
    }

    const new_due_date = new Date(current_date_obj.getTime() + days_to_add * 24 * 60 * 60 * 1000);

    // Update renewal status
    let new_renewal_status = 'Renewed Once';
    if (transaction.renewal_status === 'Renewed Once') {
      new_renewal_status = 'Renewed Twice';
    }

    // Update transaction
    await db.update_record('TRANSACTIONS', req.params.id, {
      due_date: new_due_date,
      renewal_status: new_renewal_status,
      updated_at: new Date(),
    });

    // Update item copy
    await db.update_record('LIBRARY_ITEM_COPIES', transaction.copy_id, {
      due_date: new_due_date,
      updated_at: new Date(),
    });

    res.json({
      success: true,
      message: 'Transaction renewed successfully',
      data: {
        transaction_id: req.params.id,
        new_due_date,
        renewal_status: new_renewal_status,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to renew transaction',
      message: error.message,
    });
  }
});

// GET /api/v1/transactions/by-copy/:copy_id - Get transaction info by copy ID
router.get('/by-copy/:copy_id', async (req, res) => {
  try {
    const copy_id = req.params.copy_id;

    // Get the active transaction for this copy
    const transactions = await db.execute_query(
      'SELECT * FROM TRANSACTIONS WHERE copy_id = ? AND status = "Active" ORDER BY created_at DESC LIMIT 1',
      [copy_id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({
        error: 'No active transaction found for this item',
      });
    }

    const transaction = transactions[0];

    // Get item copy information
    const item_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', copy_id);
    if (!item_copy) {
      return res.status(404).json({
        error: 'Item copy not found',
      });
    }

    // Get library item information
    const library_item = await db.get_by_id('LIBRARY_ITEMS', item_copy.library_item_id);
    if (!library_item) {
      return res.status(404).json({
        error: 'Library item not found',
      });
    }

    // Get item type-specific information
    let item_details = {};
    if (library_item.item_type === 'BOOK' || library_item.item_type === 'book') {
      const books = await db.execute_query(
        'SELECT * FROM BOOKS WHERE library_item_id = ?',
        [library_item.id]
      );
      item_details = books[0] || {};
    } else if (library_item.item_type === 'VIDEO' || library_item.item_type === 'video') {
      const videos = await db.execute_query(
        'SELECT * FROM VIDEOS WHERE library_item_id = ?',
        [library_item.id]
      );
      item_details = videos[0] || {};
    }

    // Get patron information
    const patron = await db.get_by_id('PATRONS', transaction.patron_id);
    if (!patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    // Get active checkout count for patron
    const active_checkout_count = await db.execute_query(
      'SELECT COUNT(*) as count FROM TRANSACTIONS WHERE patron_id = ? AND status = "Active"',
      [patron.id]
    );

    // Check for reservations
    const reservations = await db.execute_query(
      'SELECT COUNT(*) as count FROM RESERVATIONS WHERE library_item_id = ? AND status IN ("waiting", "ready")',
      [library_item.id]
    );

    res.json({
      success: true,
      data: {
        transaction: {
          ...transaction,
          item_copy,
          library_item: {
            ...library_item,
            ...item_details,
          },
          patron: {
            ...patron,
            active_checkouts: active_checkout_count[0].count,
          },
          has_reservations: reservations[0].count > 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch transaction information',
      message: error.message,
    });
  }
});

// POST /api/v1/transactions/reshelve - Mark item as available (reshelve process)
router.post(
  '/reshelve',
  [body('copy_id').isNumeric().withMessage('Valid copy ID is required')],
  handle_validation_errors,
  async (req, res) => {
    try {
      const { copy_id, branch_id } = req.body;

      // Get item copy
      const item_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', copy_id);
      if (!item_copy) {
        return res.status(400).json({
          error: 'Item copy not found',
        });
      }

      // Check if there are "waiting" reservations for this specific copy or for the item
      // Priority: copy-specific reservations first, then item-level reservations
      const copy_specific_reservations = await db.execute_query(
        'SELECT * FROM RESERVATIONS WHERE copy_id = ? AND status = "waiting" ORDER BY queue_position LIMIT 1',
        [copy_id]
      );

      const item_level_reservations = await db.execute_query(
        'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND copy_id IS NULL AND status = "waiting" ORDER BY queue_position LIMIT 1',
        [item_copy.library_item_id]
      );

      let final_status = 'Available';
      let promotion_message = '';

      // Prioritize copy-specific reservations
      const waiting_reservations = copy_specific_reservations.length > 0
        ? copy_specific_reservations
        : item_level_reservations;

      if (waiting_reservations.length > 0) {
        // Promote first waiting reservation to "ready"
        const next_reservation = waiting_reservations[0];
        const new_expiry = new Date();
        new_expiry.setDate(new_expiry.getDate() + 5);

        await db.update_record('RESERVATIONS', next_reservation.id, {
          status: 'ready',
          expiry_date: new_expiry.toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Set copy to Reserved for the patron
        final_status = 'Reserved';
        promotion_message = ' and reservation promoted to ready for pickup';
      }

      // Update item copy status
      await db.update_record('LIBRARY_ITEM_COPIES', copy_id, {
        status: final_status,
        current_branch_id: branch_id || item_copy.owning_branch_id,
        checked_out_by: null,
        due_date: null,
        updated_at: new Date(),
      });

      res.json({
        success: true,
        message: `Item marked as ${final_status.toLowerCase()} successfully${promotion_message}`,
        data: {
          copy_id,
          status: final_status,
          branch_id: branch_id || item_copy.owning_branch_id,
          reservation_promoted: waiting_reservations.length > 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to mark item as available',
        message: error.message,
      });
    }
  }
);

export default router;
