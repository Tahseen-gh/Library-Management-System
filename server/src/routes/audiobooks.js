import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

// Validation middleware
const validate_audiobook = [
  body('library_item_id').notEmpty().withMessage('Library Item ID is required'),
  body('narrator')
    .optional()
    .isString()
    .withMessage('Narrator must be a string'),
  body('publisher')
    .optional()
    .isString()
    .withMessage('Publisher must be a string'),
  body('duration_minutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
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

// GET /api/v1/audiobooks - Get all audiobooks
router.get('/', async (req, res) => {
  try {
    const audiobooks = await db.execute_query(
      `SELECT ab.*, ci.title, ci.description, ci.publication_year
       FROM audiobooks ab
       JOIN LIBRARY_ITEMS ci ON ab.library_item_id = ci.id
       ORDER BY ci.title`
    );

    res.json({
      success: true,
      count: audiobooks.length,
      data: audiobooks,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch audiobooks',
      message: error.message,
    });
  }
});

// GET /api/v1/audiobooks/:id - Get single audiobook
router.get('/:id', async (req, res) => {
  try {
    const audiobook = await db.execute_query(
      `SELECT ab.*, ci.title, ci.description, ci.publication_year
       FROM audiobooks ab
       JOIN LIBRARY_ITEMS ci ON ab.library_item_id = ci.id
       WHERE ab.id = ?`,
      [req.params.id]
    );

    if (!audiobook || audiobook.length === 0) {
      return res.status(404).json({
        error: 'Audiobook not found',
      });
    }

    res.json({
      success: true,
      data: audiobook[0],
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch audiobook',
      message: error.message,
    });
  }
});

// POST /api/v1/audiobooks - Create audiobook
router.post(
  '/',
  validate_audiobook,
  handle_validation_errors,
  async (req, res) => {
    try {
      const library_item = await db.get_by_id(
        'LIBRARY_ITEMS',
        req.body.library_item_id
      );

      if (!library_item) {
        return res.status(404).json({
          error: 'Library item not found',
        });
      }

      if (library_item.item_type !== 'audiobook') {
        return res.status(400).json({
          error: 'Library item must be of type audiobook',
        });
      }

      const audiobook_data = {
        narrator: req.body.narrator || null,
        publisher: req.body.publisher || null,
        genre: req.body.genre || null,
        cover_img_url: req.body.cover_img_url || null,
        duration_minutes: req.body.duration_minutes || null,
        format: req.body.format || null,
        rating: req.body.rating || null,
        isbn: req.body.isbn || null,
        library_item_id: req.body.library_item_id,
      };

      await db.create_record('audiobooks', audiobook_data);

      res.status(201).json({
        success: true,
        message: 'Audiobook created successfully',
        data: audiobook_data,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create audiobook',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/audiobooks/:id - Update audiobook
router.put(
  '/:id',
  validate_audiobook,
  handle_validation_errors,
  async (req, res) => {
    try {
      const existing_audiobook = await db.get_by_id(
        'audiobooks',
        req.params.id
      );

      if (!existing_audiobook) {
        return res.status(404).json({
          error: 'Audiobook not found',
        });
      }

      const updated = await db.update_record(
        'audiobooks',
        req.params.id,
        req.body
      );

      if (updated) {
        res.json({
          success: true,
          message: 'Audiobook updated successfully',
        });
      } else {
        res.status(500).json({
          error: 'Failed to update audiobook',
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update audiobook',
        message: error.message,
      });
    }
  }
);

// DELETE /api/v1/audiobooks/:id - Delete audiobook
router.delete('/:id', async (req, res) => {
  try {
    const existing_audiobook = await db.get_by_id('audiobooks', req.params.id);

    if (!existing_audiobook) {
      return res.status(404).json({
        error: 'Audiobook not found',
      });
    }

    const deleted = await db.delete_record('audiobooks', req.params.id);

    if (deleted) {
      res.json({
        success: true,
        message: 'Audiobook deleted successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete audiobook',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete audiobook',
      message: error.message,
    });
  }
});

export default router;
