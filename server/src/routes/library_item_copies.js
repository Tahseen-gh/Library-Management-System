import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

// Validation middleware for creating new item copies
const validate_item_copy = [
  body('library_item_id')
    .isInt({ min: 1 })
    .withMessage('Valid library item ID is required'),
  body('owning_branch_id').isInt({ min: 1 }).withMessage('Valid branch ID is required'),
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
      'returned',
    ])
    .withMessage('Invalid status'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
];

// Validation middleware for updating item copies (all fields optional)
const validate_item_copy_update = [
  body('library_item_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid library item ID is required'),
  body('owning_branch_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid branch ID is required'),
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
      'returned',
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
      ORDER BY ci.title, lic.id
    `;

    const item_copies = await db.execute_query(query, params);

    // Add copy labels to each copy
    const copies_with_labels = await Promise.all(
      item_copies.map(async (copy) => {
        const all_copies = await db.execute_query(
          'SELECT id FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? ORDER BY id',
          [copy.library_item_id]
        );

        const copy_index = all_copies.findIndex((c) => c.id === copy.id);
        const copy_number = copy_index + 1;
        const total_copies = all_copies.length;
        const copy_label = `Copy ${copy_number} of ${total_copies}`;

        return {
          ...copy,
          copy_label,
          copy_number,
          total_copies,
        };
      })
    );

    res.json({
      success: true,
      count: copies_with_labels.length,
      data: copies_with_labels,
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

    // Get all copies to calculate copy label
    const all_copies = await db.execute_query(
      'SELECT id FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? ORDER BY id',
      [item_copy.library_item_id]
    );

    const copy_index = all_copies.findIndex((c) => c.id === item_copy.id);
    const copy_number = copy_index + 1;
    const total_copies = all_copies.length;
    const copy_label = `Copy ${copy_number} of ${total_copies}`;

    res.json({
      success: true,
      data: {
        ...item_copy,
        copy_label,
        copy_number,
        total_copies,
      },
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
      ORDER BY ic.id
    `;

    const item_copies = await db.execute_query(query, [
      req.params.library_item_id,
    ]);

    // Add copy labels to each copy
    const total_copies = item_copies.length;
    const copies_with_labels = item_copies.map((copy, index) => ({
      ...copy,
      copy_label: `Copy ${index + 1} of ${total_copies}`,
      copy_number: index + 1,
      total_copies,
    }));

    res.json({
      success: true,
      count: copies_with_labels.length,
      data: copies_with_labels,
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
        condition: 'Good',
        status: 'Available',
        current_branch_id: req.body.owning_branch_id, // Default location to branch
        return_to_branch_id: req.body.owning_branch_id, // Default return branch
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
  validate_item_copy_update,
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
