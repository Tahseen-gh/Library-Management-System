import express from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../config/database.js';

const router = express.Router();

// Validation middleware
const validate_item_copy = [
  body('library_item_id')
    .isUUID()
    .withMessage('Valid library item ID is required'),
  body('branch_id').isInt().withMessage('Valid branch ID is required'),
  body('condition')
    .optional()
    .isIn(['New', 'Excellent', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition'),
  body('status')
    .optional()
    .isIn([
      'Available',
      'Checked Out',
      'Reserved',
      'Processing',
      'Damaged',
      'Lost',
    ])
    .withMessage('Invalid status'),
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

// GET /api/v1/item-copies - Get all item copies
router.get('/', async (req, res) => {
  try {
    const { library_item_id, branch_id, status, condition } = req.query;
    let conditions = '';
    let params = [];

    const filters = [];
    if (library_item_id) {
      filters.push('lic.library_item_id = ?');
      params.push(library_item_id);
    }
    if (branch_id) {
      filters.push('lic.owning_branch_id = ?');
      params.push(branch_id);
    }
    if (status) {
      filters.push('lic.status = ?');
      params.push(status);
    }
    if (condition) {
      filters.push('lic.condition = ?');
      params.push(condition);
    }

    if (filters.length > 0) {
      conditions = ' WHERE ' + filters.join(' AND ');
    }

    const query = `
      SELECT 
        lic.*,
        ci.title,
        ci.item_type,
        ci.publication_year,
        ci.description,
        b.branch_name
      FROM LIBRARY_ITEM_COPIES lic
      JOIN LIBRARY_ITEMS ci ON lic.library_item_id = ci.id
      JOIN BRANCHES b ON lic.owning_branch_id = b.id
      ${conditions}
      ORDER BY ci.title, lic.created_at
    `;

    const item_copies = await db.execute_query(query, params);

    res.json({
      success: true,
      count: item_copies.length,
      data: item_copies,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch item copies',
      message: error.message,
    });
  }
});

// GET /api/v1/item-copies/:id - Get single item copy
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT 
        lic.*,
        li.title,
        li.item_type,
        b.branch_name
      FROM LIBRARY_ITEM_COPIES lic
      JOIN LIBRARY_ITEMS li ON lic.library_item_id = li.id
      JOIN BRANCHES b ON lic.owning_branch_id = b.id
      WHERE lic.id = ?
    `;

    const results = await db.execute_query(query, [req.params.id]);
    const item_copy = results[0];

    if (!item_copy) {
      return res.status(404).json({
        error: 'Item copy not found',
      });
    }

    res.json({
      success: true,
      data: item_copy,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch item copy',
      message: error.message,
    });
  }
});

// GET /api/v1/item-copies/item/:library_item_id - Get all copies of a library item
router.get('/item/:library_item_id', async (req, res) => {
  try {
    const query = `
      SELECT 
        ic.*,
        b.branch_name
      FROM LIBRARY_ITEM_COPIES ic
      JOIN BRANCHES b ON ic.owning_branch_id = b.id
      WHERE ic.library_item_id = ?
      ORDER BY b.branch_name, ic.status
    `;

    const item_copies = await db.execute_query(query, [
      req.params.library_item_id,
    ]);

    res.json({
      success: true,
      count: item_copies.length,
      data: item_copies,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch item copies',
      message: error.message,
    });
  }
});

// POST /api/v1/item-copies - Create new item copy
router.post(
  '/',
  validate_item_copy,
  handle_validation_errors,
  async (req, res) => {
    try {
      // Verify library item exists
      const library_item = await db.get_by_id(
        'LIBRARY_ITEMS',
        req.body.library_item_id
      );
      if (!library_item) {
        return res.status(400).json({
          error: 'Library item not found',
        });
      }

      // Verify branch exists
      const branch = await db.get_by_id('BRANCHES', req.body.owning_branch_id);
      if (!branch) {
        return res.status(400).json({
          error: 'Branch not found',
        });
      }

      const item_copy_data = {
        id: uuidv4(),
        condition: 'Good',
        status: 'Available',
        location: req.body.owning_branch_id, // Default location to branch
        ...req.body,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await db.create_record('LIBRARY_ITEM_COPIES', item_copy_data);

      res.status(201).json({
        success: true,
        message: 'Item copy created successfully',
        data: item_copy_data,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create item copy',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/item-copies/:id - Update item copy
router.put(
  '/:id',
  validate_item_copy,
  handle_validation_errors,
  async (req, res) => {
    try {
      const existing_copy = await db.get_by_id(
        'LIBRARY_ITEM_COPIES',
        req.params.id
      );

      if (!existing_copy) {
        return res.status(404).json({
          error: 'Item copy not found',
        });
      }

      const update_data = {
        ...req.body,
        updated_at: new Date(),
      };

      const updated = await db.update_record(
        'LIBRARY_ITEM_COPIES',
        req.params.id,
        update_data
      );

      if (updated) {
        res.json({
          success: true,
          message: 'Item copy updated successfully',
        });
      } else {
        res.status(500).json({
          error: 'Failed to update item copy',
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update item copy',
        message: error.message,
      });
    }
  }
);

// DELETE /api/v1/item-copies/:id - Delete item copy
router.delete('/:id', async (req, res) => {
  try {
    const existing_copy = await db.get_by_id(
      'LIBRARY_ITEM_COPIES',
      req.params.id
    );

    if (!existing_copy) {
      return res.status(404).json({
        error: 'Item copy not found',
      });
    }

    // Check if copy is currently checked out
    if (existing_copy.status === 'Checked Out') {
      return res.status(400).json({
        error: 'Cannot delete item copy that is currently checked out',
      });
    }

    const deleted = await db.delete_record(
      'LIBRARY_ITEM_COPIES',
      req.params.id
    );

    if (deleted) {
      res.json({
        success: true,
        message: 'Item copy deleted successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete item copy',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete item copy',
      message: error.message,
    });
  }
});

export default router;
