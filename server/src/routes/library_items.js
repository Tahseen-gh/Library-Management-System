import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

// Validation middleware
const validate_library_item = [
  body('title').notEmpty().withMessage('Title is required'),
  body('item_type')
    .isIn([
      'Book',
      'BOOK',
      'Magazine',
      'MAGAZINE',
      'Periodical',
      'PERIODICAL',
      'Recording',
      'RECORDING',
      'Audiobook',
      'AUDIOBOOK',
      'Video',
      'VIDEO',
      'cd',
      'CD',
      'Vinyl',
      'VINYL',
    ])
    .withMessage('Invalid item type'),
  body('publication_year')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Invalid publication year'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
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

// GET /api/v1/library-items - Get all library items
router.get('/', async (req, res) => {
  try {
    const { item_type, search } = req.query;
    let conditions = '';
    let params = [];

    if (item_type) {
      conditions += ' WHERE item_type = ?';
      params.push(item_type);
    }

    if (search) {
      conditions += item_type ? ' AND' : ' WHERE';
      conditions += ' (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const library_items = await db.get_all('LIBRARY_ITEMS', conditions, params);
    res.json({
      success: true,
      count: library_items.length,
      data: library_items,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch library items',
      message: error.message,
    });
  }
});

// GET /api/v1/library-items/:id - Get single library item
router.get('/:id', async (req, res) => {
  try {
    const library_item = await db.get_by_id('LIBRARY_ITEMS', req.params.id);

    if (!library_item) {
      return res.status(404).json({
        error: 'Library item not found',
      });
    }

    res.json({
      success: true,
      data: library_item,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch library item',
      message: error.message,
    });
  }
});

// POST /api/v1/library-items - Create new library item
router.post(
  '/',
  validate_library_item,
  handle_validation_errors,
  async (req, res) => {
    try {
      // Check for duplicate Item ID (congress_code) if provided
      if (req.body.congress_code) {
        const existing_items = await db.execute_query(
          'SELECT id, title FROM LIBRARY_ITEMS WHERE congress_code = ?',
          [req.body.congress_code]
        );

        if (existing_items && existing_items.length > 0) {
          return res.status(400).json({
            error: 'Duplicate Item ID',
            message: `Item ID "${req.body.congress_code}" already exists (used by: "${existing_items[0].title}")`,
          });
        }
      }

      const library_item_data = {
        ...req.body,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const created_id = await db.create_record('LIBRARY_ITEMS', library_item_data);

      res.status(201).json({
        success: true,
        message: 'Library item created successfully',
        data: {
          ...library_item_data,
          id: created_id,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create library item',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/library-items/:id - Update library item
router.put(
  '/:id',
  validate_library_item,
  handle_validation_errors,
  async (req, res) => {
    try {
      const existing_item = await db.get_by_id('LIBRARY_ITEMS', req.params.id);

      if (!existing_item) {
        return res.status(404).json({
          error: 'Library item not found',
        });
      }

      const update_data = {
        ...req.body,
        updated_at: new Date(),
      };

      const updated = await db.update_record(
        'LIBRARY_ITEMS',
        req.params.id,
        update_data
      );

      if (updated) {
        res.json({
          success: true,
          message: 'Library item updated successfully',
        });
      } else {
        res.status(500).json({
          error: 'Failed to update library item',
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update library item',
        message: error.message,
      });
    }
  }
);

// DELETE /api/v1/library-items/:id - Delete library item
router.delete('/:id', async (req, res) => {
  try {
    const existing_item = await db.get_by_id('LIBRARY_ITEMS', req.params.id);

    if (!existing_item) {
      return res.status(404).json({
        error: 'Library item not found',
      });
    }

    const deleted = await db.delete_record('LIBRARY_ITEMS', req.params.id);

    if (deleted) {
      res.json({
        success: true,
        message: 'Library item deleted successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete library item',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete library item',
      message: error.message,
    });
  }
});

export default router;
