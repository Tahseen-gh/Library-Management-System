const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const router = express.Router();

// Validation middleware
const validate_library_item_copy = [
  body('library_item_id')
    .notEmpty()
    .withMessage('Valid library item ID is required'),
  body('branch_id').notEmpty().withMessage('Valid branch ID is required'),
  body('condition')
    .optional()
    .isIn(['New', 'Excellent', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition'),
  body('status')
    .optional()
    .isIn([
      'available',
      'borrowed',
      'reserved',
      'maintenance',
      'damaged',
      'lost',
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

// GET /api/v1/library-item-copies - Get all library item copies
router.get('/', async (req, res) => {
  try {
    const { library_item_id, branch_id, status, condition } = req.query;
    let query = `
      SELECT 
        lic.*,
        li.title,
        li.item_type,
        b.branch_name
      FROM LIBRARY_ITEM_COPIES lic
      JOIN LIBRARY_ITEMS li ON lic.library_item_id = li.id
      JOIN BRANCHES b ON lic.branch_id = b.id
    `;
    let params = [];
    let conditions = [];

    if (library_item_id) {
      conditions.push('lic.library_item_id = ?');
      params.push(library_item_id);
    }
    if (branch_id) {
      conditions.push('lic.branch_id = ?');
      params.push(branch_id);
    }
    if (status) {
      conditions.push('lic.status = ?');
      params.push(status);
    }
    if (condition) {
      conditions.push('lic.condition = ?');
      params.push(condition);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY li.title, lic.createdAt';

    const library_item_copies = await db.execute_query(query, params);

    res.json({
      success: true,
      count: library_item_copies.length,
      data: library_item_copies,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch library item copies',
      message: error.message,
    });
  }
});

// GET /api/v1/library-item-copies/:id - Get single library item copy
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
      JOIN BRANCHES b ON lic.branch_id = b.id
      WHERE lic.id = ?
    `;

    const results = await db.execute_query(query, [req.params.id]);
    const library_item_copy = results[0];

    if (!library_item_copy) {
      return res.status(404).json({
        error: 'Library item copy not found',
      });
    }

    res.json({
      success: true,
      data: library_item_copy,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch library item copy',
      message: error.message,
    });
  }
});

// GET /api/v1/library-item-copies/item/:library_item_id - Get all copies of a library item
router.get('/item/:library_item_id', async (req, res) => {
  try {
    const query = `
      SELECT 
        lic.*,
        b.branch_name
      FROM LIBRARY_ITEM_COPIES lic
      JOIN BRANCHES b ON lic.branch_id = b.id
      WHERE lic.library_item_id = ?
      ORDER BY b.branch_name, lic.status
    `;

    const library_item_copies = await db.execute_query(query, [
      req.params.library_item_id,
    ]);

    res.json({
      success: true,
      count: library_item_copies.length,
      data: library_item_copies,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch library item copies',
      message: error.message,
    });
  }
});

// POST /api/v1/library-item-copies - Create new library item copy
router.post(
  '/',
  validate_library_item_copy,
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
      const branch = await db.get_by_id('BRANCHES', req.body.branch_id);
      if (!branch) {
        return res.status(400).json({
          error: 'Branch not found',
        });
      }

      const library_item_copy_data = {
        id: uuidv4(),
        library_item_id: req.body.library_item_id,
        branch_id: req.body.branch_id,
        condition: req.body.condition || 'Good',
        status: req.body.status || 'available',
        cost: req.body.cost || null,
        location: req.body.location || null,
        notes: req.body.notes || null,
        date_acquired: req.body.date_acquired || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.create_record('LIBRARY_ITEM_COPIES', library_item_copy_data);

      res.status(201).json({
        success: true,
        message: 'Library item copy created successfully',
        data: library_item_copy_data,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create library item copy',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/library-item-copies/:id - Update library item copy
router.put('/:id', async (req, res) => {
  try {
    const existing_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', parseInt(req.params.id));

    if (!existing_copy) {
      return res.status(404).json({
        error: 'Library item copy not found',
      });
    }

    const update_data = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    const updated = await db.update_record(
      'LIBRARY_ITEM_COPIES',
      parseInt(req.params.id),
      update_data
    );

    if (updated) {
      res.json({
        success: true,
        message: 'Library item copy updated successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to update library item copy',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update library item copy',
      message: error.message,
    });
  }
});

// DELETE /api/v1/library-item-copies/:id - Delete library item copy
router.delete('/:id', async (req, res) => {
  try {
    const existing_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', req.params.id);

    if (!existing_copy) {
      return res.status(404).json({
        error: 'Library item copy not found',
      });
    }

    // Check if copy is currently borrowed
    if (existing_copy.status === 'borrowed') {
      return res.status(400).json({
        error: 'Cannot delete library item copy that is currently borrowed',
      });
    }

    const deleted = await db.delete_record('LIBRARY_ITEM_COPIES', req.params.id);

    if (deleted) {
      res.json({
        success: true,
        message: 'Library item copy deleted successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete library item copy',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete library item copy',
      message: error.message,
    });
  }
});

// GET /api/v1/item-copies/:id/label - Generate item label (MEDIUM PRIORITY REQUIREMENT)
router.get('/:id/label', async (req, res) => {
  try {
    const copy = await db.get_by_id('LIBRARY_ITEM_COPIES', req.params.id);

    if (!copy) {
      return res.status(404).json({
        error: 'Library item copy not found',
      });
    }

    // Get library item details
    const library_item = await db.get_by_id('LIBRARY_ITEMS', copy.library_item_id);

    if (!library_item) {
      return res.status(404).json({
        error: 'Library item not found',
      });
    }

    // Get branch details
    const branch = await db.get_by_id('BRANCHES', copy.branch_id);

    // Generate label data
    const label_data = {
      copy_id: copy.id,
      title: library_item.title,
      item_type: library_item.item_type,
      library_of_congress_code: library_item.library_of_congress_code || 'N/A',
      branch_name: branch ? branch.branch_name : 'Unknown',
      branch_location: branch ? branch.address : 'Unknown',
      condition: copy.condition || 'Good',
      date_acquired: copy.date_acquired || new Date().toISOString().split('T')[0],
      barcode: `BC-${copy.id.substring(0, 8).toUpperCase()}`,
    };

    res.json({
      success: true,
      data: label_data,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate label',
      message: error.message,
    });
  }
});

// POST /api/v1/item-copies/:id/mark-damaged - Mark item as damaged (LOW PRIORITY REQUIREMENT)
router.post('/:id/mark-damaged', async (req, res) => {
  try {
    const copy = await db.get_by_id('LIBRARY_ITEM_COPIES', req.params.id);

    if (!copy) {
      return res.status(404).json({
        error: 'Library item copy not found',
      });
    }

    const damage_notes = req.body.damage_notes || 'Item marked as damaged';
    const damage_date = new Date().toISOString();

    // Update item status to damaged
    await db.update_record('LIBRARY_ITEM_COPIES', req.params.id, {
      status: 'damaged',
      notes: damage_notes,
      updatedAt: damage_date,
    });

    res.json({
      success: true,
      message: 'Item marked as damaged',
      data: {
        copy_id: req.params.id,
        status: 'damaged',
        damage_notes,
        damaged_at: damage_date,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to mark item as damaged',
      message: error.message,
    });
  }
});

// POST /api/v1/item-copies/:id/mark-maintenance - Mark item for maintenance (LOW PRIORITY REQUIREMENT)
router.post('/:id/mark-maintenance', async (req, res) => {
  try {
    const copy = await db.get_by_id('LIBRARY_ITEM_COPIES', req.params.id);

    if (!copy) {
      return res.status(404).json({
        error: 'Library item copy not found',
      });
    }

    const maintenance_notes = req.body.maintenance_notes || 'Item sent for maintenance';
    const maintenance_date = new Date().toISOString();

    // Update item status to maintenance
    await db.update_record('LIBRARY_ITEM_COPIES', req.params.id, {
      status: 'maintenance',
      notes: maintenance_notes,
      updatedAt: maintenance_date,
    });

    res.json({
      success: true,
      message: 'Item marked for maintenance',
      data: {
        copy_id: req.params.id,
        status: 'maintenance',
        maintenance_notes,
        maintenance_at: maintenance_date,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to mark item for maintenance',
      message: error.message,
    });
  }
});

module.exports = router;