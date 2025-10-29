const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const router = express.Router();

// Validation middleware
const validate_catalog_item = [
  body('title').notEmpty().withMessage('Title is required'),
  body('item_type')
    .isIn(['Book', 'Magazine', 'Periodical', 'Recording', 'Audiobook', 'Video'])
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

// GET /api/v1/catalog-items - Get all catalog items
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

    const catalog_items = await db.get_all('catalog_items', conditions, params);
    res.json({
      success: true,
      count: catalog_items.length,
      data: catalog_items,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch catalog items',
      message: error.message,
    });
  }
});

// GET /api/v1/catalog-items/:id - Get single catalog item
router.get('/:id', async (req, res) => {
  try {
    const catalog_item = await db.get_by_id('catalog_items', req.params.id);

    if (!catalog_item) {
      return res.status(404).json({
        error: 'Catalog item not found',
      });
    }

    res.json({
      success: true,
      data: catalog_item,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch catalog item',
      message: error.message,
    });
  }
});

// POST /api/v1/catalog-items - Create new catalog item
router.post(
  '/',
  validate_catalog_item,
  handle_validation_errors,
  async (req, res) => {
    try {
      const catalog_item_data = {
        id: uuidv4(),
        ...req.body,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await db.create_record('catalog_items', catalog_item_data);

      res.status(201).json({
        success: true,
        message: 'Catalog item created successfully',
        data: catalog_item_data,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create catalog item',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/catalog-items/:id - Update catalog item
router.put(
  '/:id',
  validate_catalog_item,
  handle_validation_errors,
  async (req, res) => {
    try {
      const existing_item = await db.get_by_id('catalog_items', req.params.id);

      if (!existing_item) {
        return res.status(404).json({
          error: 'Catalog item not found',
        });
      }

      const update_data = {
        ...req.body,
        updated_at: new Date(),
      };

      const updated = await db.update_record(
        'catalog_items',
        req.params.id,
        update_data
      );

      if (updated) {
        res.json({
          success: true,
          message: 'Catalog item updated successfully',
        });
      } else {
        res.status(500).json({
          error: 'Failed to update catalog item',
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update catalog item',
        message: error.message,
      });
    }
  }
);

// DELETE /api/v1/catalog-items/:id - Delete catalog item
router.delete('/:id', async (req, res) => {
  try {
    const existing_item = await db.get_by_id('catalog_items', req.params.id);

    if (!existing_item) {
      return res.status(404).json({
        error: 'Catalog item not found',
      });
    }

    const deleted = await db.delete_record('catalog_items', req.params.id);

    if (deleted) {
      res.json({
        success: true,
        message: 'Catalog item deleted successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete catalog item',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete catalog item',
      message: error.message,
    });
  }
});

module.exports = router;
