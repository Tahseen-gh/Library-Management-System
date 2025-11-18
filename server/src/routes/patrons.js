import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

// Validation middleware
const validate_patron = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
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
      conditions += ' WHERE p.is_active = 1';
    }

    if (search) {
      conditions += active_only === 'true' ? ' AND' : ' WHERE';
      conditions += ' (p.first_name LIKE ? OR p.last_name LIKE ? OR p.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Include active checkout count for each patron
    const patrons = await db.execute_query(
      `SELECT
        p.*,
        COALESCE(COUNT(CASE WHEN t.status = 'Active' THEN 1 END), 0) as active_checkouts
      FROM PATRONS p
      LEFT JOIN TRANSACTIONS t ON p.id = t.patron_id
      ${conditions}
      GROUP BY p.id
      ORDER BY p.id`,
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

// GET /api/v1/patrons/search-for-renewal - Search patron by ID or name and get checked-out items
router.get('/search-for-renewal', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Search query is required',
      });
    }

    // Search for patron by ID or name
    let patron = null;

    // Try to parse as ID first
    const patron_id = parseInt(query);
    if (!isNaN(patron_id)) {
      patron = await db.get_by_id('PATRONS', patron_id);
    }

    // If not found by ID, search by name
    if (!patron) {
      const patrons = await db.execute_query(
        `SELECT * FROM PATRONS
         WHERE LOWER(first_name || ' ' || last_name) = LOWER(?)
         OR LOWER(first_name) = LOWER(?)
         OR LOWER(last_name) = LOWER(?)
         LIMIT 1`,
        [query, query, query]
      );

      if (patrons.length > 0) {
        patron = patrons[0];
      }
    }

    if (!patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    // Get all active checked-out items for this patron
    const checked_out_items = await db.execute_query(
      `SELECT
        t.id as transaction_id,
        t.copy_id,
        t.due_date,
        t.renewal_status,
        li.id as library_item_id,
        li.title,
        li.item_type,
        b.author,
        v.director,
        (SELECT COUNT(*) FROM RESERVATIONS r
         WHERE r.library_item_id = li.id
         AND r.status IN ('waiting', 'ready')) as has_reservations
       FROM TRANSACTIONS t
       JOIN LIBRARY_ITEM_COPIES ic ON t.copy_id = ic.id
       JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
       LEFT JOIN BOOKS b ON li.id = b.library_item_id
       LEFT JOIN VIDEOS v ON li.id = v.library_item_id
       WHERE t.patron_id = ? AND t.status = 'Active'
       ORDER BY t.due_date ASC`,
      [patron.id]
    );

    res.json({
      success: true,
      data: {
        patron: {
          id: patron.id,
          first_name: patron.first_name,
          last_name: patron.last_name,
          card_expiration_date: patron.card_expiration_date,
          balance: patron.balance,
        },
        checked_out_items: checked_out_items.map(item => ({
          transaction_id: item.transaction_id,
          copy_id: item.copy_id,
          library_item_id: item.library_item_id,
          title: item.title,
          item_type: item.item_type,
          author: item.author,
          director: item.director,
          due_date: item.due_date,
          renewal_status: item.renewal_status,
          has_reservations: item.has_reservations > 0,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to search patron',
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

    // Get active checkout count
    const active_checkout_count = await db.execute_query(
      'SELECT COUNT(*) as count FROM TRANSACTIONS WHERE patron_id = ? AND status = "Active"',
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...patron,
        active_checkouts: active_checkout_count[0].count,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch patron',
      message: error.message,
    });
  }
});

// GET /api/v1/patrons/:id/validate - Validate patron for checkout
router.get('/:id/validate', async (req, res) => {
  try {
    const patron = await db.get_by_id('PATRONS', req.params.id);

    if (!patron) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Patron not found',
        error_type: 'not_found',
      });
    }

    // Get active checkout count
    const active_checkout_count = await db.execute_query(
      'SELECT COUNT(*) as count FROM TRANSACTIONS WHERE patron_id = ? AND status = "Active"',
      [req.params.id]
    );

    const checkout_count = active_checkout_count[0].count;
    const current_date = new Date().toISOString().split('T')[0];
    const card_expiration = patron.card_expiration_date;

    // Check all validation rules
    const validations = {
      patron_exists: true,
      card_valid: card_expiration >= current_date,
      no_fines: patron.balance <= 0,
      under_limit: checkout_count < 20,
    };

    const is_valid = Object.values(validations).every(v => v === true);

    // Determine error type and message
    let error_type = null;
    let error_message = null;

    if (!validations.card_valid) {
      error_type = 'card_expired';
      error_message = 'Patron card has expired';
    } else if (!validations.no_fines) {
      error_type = 'has_fines';
      error_message = `Patron owes $${patron.balance.toFixed(2)} in fines`;
    } else if (!validations.under_limit) {
      error_type = 'too_many_books';
      error_message = 'Patron has reached the maximum checkout limit (20 books)';
    }

    res.json({
      success: true,
      valid: is_valid,
      patron: {
        id: patron.id,
        first_name: patron.first_name,
        last_name: patron.last_name,
        email: patron.email,
        balance: patron.balance,
        card_expiration_date: patron.card_expiration_date,
        active_checkouts: checkout_count,
        is_active: patron.is_active,
      },
      validations,
      error_type,
      error_message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Failed to validate patron',
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
      `SELECT t.*, ci.title, ci.item_type
       FROM TRANSACTIONS t
       JOIN LIBRARY_ITEM_COPIES ic ON t.copy_id = ic.id
       JOIN LIBRARY_ITEMS ci ON ic.library_item_id = ci.id
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

      const patron_id = await db.create_record('PATRONS', patron_data);

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

// DELETE /api/v1/patrons/:id - Delete patron (soft delete by setting is_active to false)
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
      'SELECT COUNT(*) as count FROM TRANSACTIONS WHERE patron_id = ? AND status = "Active"',
      [req.params.id]
    );

    if (active_transactions[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete patron with active transactions',
      });
    }

    const updated = await db.update_record('PATRONS', req.params.id, {
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

export default router;
