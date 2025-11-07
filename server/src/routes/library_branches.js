import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

// Validation middleware
const validate_branch = [
  body('branch_name').notEmpty().withMessage('Branch name is required'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
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

// GET /api/v1/branches - Get all branches
router.get('/', async (req, res) => {
  try {
    const branches = await db.get_all(
      'BRANCHES',
      'ORDER BY is_main DESC, branch_name'
    );
    res.json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch branches',
      message: error.message,
    });
  }
});

// GET /api/v1/branches/:id - Get single branch
router.get('/:id', async (req, res) => {
  try {
    const branch = await db.get_by_id('BRANCHES', req.params.id);

    if (!branch) {
      return res.status(404).json({
        error: 'Branch not found',
      });
    }

    res.json({
      success: true,
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch branch',
      message: error.message,
    });
  }
});

// GET /api/v1/branches/:id/inventory - Get branch inventory
router.get('/:id/inventory', async (req, res) => {
  try {
    const branch = await db.get_by_id('BRANCHES', req.params.id);

    if (!branch) {
      return res.status(404).json({
        error: 'Branch not found',
      });
    }

    const inventory = await db.execute_query(
      `SELECT 
        ci.id as library_item_id,
        ci.title,
        ci.item_type,
        COUNT(ic.id) as total_copies,
        SUM(CASE WHEN ic.status = 'Available' THEN 1 ELSE 0 END) as available_copies,
        SUM(CASE WHEN ic.status = 'Checked Out' THEN 1 ELSE 0 END) as checked_out_copies
       FROM LIBRARY_ITEMS ci
       JOIN LIBRARY_ITEM_COPIES ic ON ci.id = ic.library_item_id
       WHERE ic.owning_branch_id = ?
       GROUP BY ci.id, ci.title, ci.item_type
       ORDER BY ci.title`,
      [req.params.id]
    );

    res.json({
      success: true,
      branch: branch.branch_name,
      count: inventory.length,
      data: inventory,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch branch inventory',
      message: error.message,
    });
  }
});

// POST /api/v1/branches - Create new branch
router.post(
  '/',
  validate_branch,
  handle_validation_errors,
  async (req, res) => {
    try {
      const branch_data = {
        ...req.body,
        is_main: req.body.is_main || false,
        created_at: new Date(),
      };

      const branch_id = await db.create_record('BRANCHES', branch_data);

      res.status(201).json({
        success: true,
        message: 'Branch created successfully',
        data: { id: branch_id, ...branch_data },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create branch',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/branches/:id - Update branch
router.put(
  '/:id',
  validate_branch,
  handle_validation_errors,
  async (req, res) => {
    try {
      const existing_branch = await db.get_by_id('BRANCHES', req.params.id);

      if (!existing_branch) {
        return res.status(404).json({
          error: 'Branch not found',
        });
      }

      const updated = await db.update_record(
        'BRANCHES',
        req.params.id,
        req.body
      );

      if (updated) {
        res.json({
          success: true,
          message: 'Branch updated successfully',
        });
      } else {
        res.status(500).json({
          error: 'Failed to update branch',
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update branch',
        message: error.message,
      });
    }
  }
);

// DELETE /api/v1/branches/:id - Delete branch
router.delete('/:id', async (req, res) => {
  try {
    const existing_branch = await db.get_by_id('BRANCHES', req.params.id);

    if (!existing_branch) {
      return res.status(404).json({
        error: 'Branch not found',
      });
    }

    // Check if branch has any item copies
    const item_copies = await db.execute_query(
      'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE branch_id = ?',
      [req.params.id]
    );

    if (item_copies[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete branch with existing item copies',
        message: 'Please relocate all items before deleting this branch',
      });
    }

    const deleted = await db.delete_record('BRANCHES', req.params.id);

    if (deleted) {
      res.json({
        success: true,
        message: 'Branch deleted successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete branch',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete branch',
      message: error.message,
    });
  }
});

export default router;
