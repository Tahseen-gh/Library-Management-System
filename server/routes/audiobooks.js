const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const router = express.Router();

// Validation middleware
const validate_new_video = [
  body('library_item_id').notEmpty().withMessage('Library item ID is required'),
  body('director').optional().isString().withMessage('Director must be a string'),
  body('studio').optional().isString().withMessage('Studio must be a string'),
  body('duration_minutes').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
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

// GET /api/v1/new-videos - Get all new videos
router.get('/', async (req, res) => {
  try {
    const new_videos = await db.execute_query(
      `SELECT nv.*, li.title, li.description, li.publication_year, li.available
       FROM NEW_VIDEOS nv
       JOIN LIBRARY_ITEMS li ON nv.library_item_id = li.id
       ORDER BY li.title ASC`
    );

    res.json({
      success: true,
      count: new_videos.length,
      data: new_videos,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch new videos',
      message: error.message,
    });
  }
});

// GET /api/v1/new-videos/:id - Get single new video
router.get('/:id', async (req, res) => {
  try {
    const new_video = await db.execute_query(
      `SELECT nv.*, li.title, li.description, li.publication_year, li.available
       FROM NEW_VIDEOS nv
       JOIN LIBRARY_ITEMS li ON nv.library_item_id = li.id
       WHERE nv.id = ?`,
      [req.params.id]
    );

    if (!new_video || new_video.length === 0) {
      return res.status(404).json({
        error: 'New video not found',
      });
    }

    res.json({
      success: true,
      data: new_video[0],
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch new video',
      message: error.message,
    });
  }
});

// POST /api/v1/new-videos - Create new video
router.post(
  '/',
  validate_new_video,
  handle_validation_errors,
  async (req, res) => {
    try {
      const library_item = await db.get_by_id('LIBRARY_ITEMS', req.body.library_item_id);

      if (!library_item) {
        return res.status(404).json({
          error: 'Library item not found',
        });
      }

      if (library_item.item_type !== 'NEW_VIDEO') {
        return res.status(400).json({
          error: 'Library item must be of type NEW_VIDEO',
        });
      }

      const new_video_data = {
        id: uuidv4(),
        director: req.body.director || null,
        studio: req.body.studio || null,
        genre: req.body.genre || null,
        cover_image_url: req.body.cover_image_url || null,
        duration_minutes: req.body.duration_minutes || null,
        format: req.body.format || null,
        rating: req.body.rating || null,
        isbn: req.body.isbn || null,
        library_item_id: req.body.library_item_id,
      };

      await db.create_record('NEW_VIDEOS', new_video_data);

      res.status(201).json({
        success: true,
        message: 'New video created successfully',
        data: new_video_data,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create new video',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/new-videos/:id - Update new video
router.put(
  '/:id',
  validate_new_video,
  handle_validation_errors,
  async (req, res) => {
    try {
      const existing_new_video = await db.get_by_id('NEW_VIDEOS', req.params.id);

      if (!existing_new_video) {
        return res.status(404).json({
          error: 'New video not found',
        });
      }

      const updated = await db.update_record('NEW_VIDEOS', req.params.id, req.body);

      if (updated) {
        res.json({
          success: true,
          message: 'New video updated successfully',
        });
      } else {
        res.status(500).json({
          error: 'Failed to update new video',
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update new video',
        message: error.message,
      });
    }
  }
);

// DELETE /api/v1/new-videos/:id - Delete new video
router.delete('/:id', async (req, res) => {
  try {
    const existing_new_video = await db.get_by_id('NEW_VIDEOS', req.params.id);

    if (!existing_new_video) {
      return res.status(404).json({
        error: 'New video not found',
      });
    }

    const deleted = await db.delete_record('NEW_VIDEOS', req.params.id);

    if (deleted) {
      res.json({
        success: true,
        message: 'New video deleted successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete new video',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete new video',
      message: error.message,
    });
  }
});

module.exports = router;