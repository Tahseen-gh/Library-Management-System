const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const router = express.Router();

// Validation middleware
const validate_library_item = [
  body('title').notEmpty().withMessage('Title is required'),
  body('item_type')
    .isIn(['BOOK', 'VIDEO', 'AUDIOBOOK'])
    .withMessage('Invalid item type. Must be BOOK, VIDEO, or AUDIOBOOK'),
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
    let query = 'SELECT * FROM LIBRARY_ITEMS';
    let params = [];
    let conditions = [];

    if (item_type) {
      conditions.push('item_type = ?');
      params.push(item_type);
    }

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY title ASC';

    const library_items = await db.execute_query(query, params);
    
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

// GET /api/v1/library-items/:id/details - Get library item with type-specific details
router.get('/:id/details', async (req, res) => {
  try {
    const library_item = await db.get_by_id('LIBRARY_ITEMS', req.params.id);

    if (!library_item) {
      return res.status(404).json({
        error: 'Library item not found',
      });
    }

    let details = null;
    
    // Fetch type-specific details based on item_type
    if (library_item.item_type === 'BOOK') {
      const book_details = await db.execute_query(
        'SELECT * FROM BOOKS WHERE library_item_id = ?',
        [req.params.id]
      );
      details = book_details[0] || null;
    } else if (library_item.item_type === 'VIDEO') {
      const video_details = await db.execute_query(
        'SELECT * FROM VIDEOS WHERE library_item_id = ?',
        [req.params.id]
      );
      details = video_details[0] || null;
    } else if (library_item.item_type === 'AUDIOBOOK') {
      const audiobook_details = await db.execute_query(
        'SELECT * FROM AUDIOBOOKS WHERE library_item_id = ?',
        [req.params.id]
      );
      details = audiobook_details[0] || null;
    }

    res.json({
      success: true,
      data: {
        ...library_item,
        details: details,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch library item details',
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
      const library_item_data = {
        id: uuidv4(),
        title: req.body.title,
        item_type: req.body.item_type,
        description: req.body.description || null,
        publication_year: req.body.publication_year || null,
        cost: req.body.cost || null,
        library_of_congress_code: req.body.library_of_congress_code || null,
        available: req.body.available !== undefined ? req.body.available : true,
        location: req.body.location || null,
        condition: req.body.condition || null,
        date_acquired: req.body.date_acquired || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.create_record('LIBRARY_ITEMS', library_item_data);

      res.status(201).json({
        success: true,
        message: 'Library item created successfully',
        data: library_item_data,
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
        updatedAt: new Date().toISOString(),
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

module.exports = router;