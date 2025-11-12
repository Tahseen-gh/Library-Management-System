import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

// Validation middleware
const validate_video = [
  body('library_item_id').notEmpty().withMessage('Library item ID is required'),
  body('director')
    .optional()
    .isString()
    .withMessage('Director must be a string'),
  body('studio').optional().isString().withMessage('Studio must be a string'),
  body('duration_minutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
];

// Helper function to handle validation errors
function handle_validation_errors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
}

/**
 * GET /api/v1/videos - Get all videos
 */
router.get('/', function (req, res) {
  const query = `SELECT v.*, li.title, li.description, li.publication_year, li.available
               FROM VIDEOS v
               JOIN LIBRARY_ITEMS li ON v.library_item_id = li.id
               ORDER BY li.title ASC`;

  db.execute_query(query)
    .then(function (videos) {
      res.json({
        success: true,
        count: videos.length,
        data: videos,
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to fetch videos',
        message: error.message,
      });
    });
});

/**
 * GET /api/v1/videos/:id - Get single video
 */
router.get('/:id', function (req, res) {
  const query = `SELECT v.*, li.title, li.description, li.publication_year, li.available
               FROM VIDEOS v
               JOIN LIBRARY_ITEMS li ON v.library_item_id = li.id
               WHERE v.id = ?`;

  db.execute_query(query, [req.params.id])
    .then(function (video) {
      if (!video || video.length === 0) {
        return res.status(404).json({
          error: 'Video not found',
        });
      }

      res.json({
        success: true,
        data: video[0],
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to fetch video',
        message: error.message,
      });
    });
});

/**
 * POST /api/v1/videos - Create new video
 */
router.post('/', validate_video, handle_validation_errors, function (req, res) {
  db.get_by_id('LIBRARY_ITEMS', req.body.library_item_id)
    .then(function (library_item) {
      if (!library_item) {
        return res.status(404).json({
          error: 'Library item not found',
        });
      }

      if (library_item.item_type !== 'VIDEO') {
        return res.status(400).json({
          error: 'Library item must be of type VIDEO',
        });
      }

      const video_data = {
        director: req.body.director || null,
        studio: req.body.studio || null,
        genre: req.body.genre || null,
        cover_image_url: req.body.cover_image_url || null,
        duration_minutes: req.body.duration_minutes || null,
        format: req.body.format || null,
        rating: req.body.rating || null,
        isbn: req.body.isbn || null,
        library_item_id: req.body.library_item_id,
        is_new_release: req.body.is_new_release || 0,
      };

      return db.create_record('VIDEOS', video_data).then(function () {
        res.status(201).json({
          success: true,
          message: 'Video created successfully',
          data: video_data,
        });
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to create video',
        message: error.message,
      });
    });
});

/**
 * PUT /api/v1/videos/:id - Update video
 */
router.put(
  '/:id',
  validate_video,
  handle_validation_errors,
  function (req, res) {
    db.get_by_id('VIDEOS', req.params.id)
      .then(function (existing_video) {
        if (!existing_video) {
          return res.status(404).json({
            error: 'Video not found',
          });
        }

        return db
          .update_record('VIDEOS', req.params.id, req.body)
          .then(function (updated) {
            if (updated) {
              res.json({
                success: true,
                message: 'Video updated successfully',
              });
            } else {
              res.status(500).json({
                error: 'Failed to update video',
              });
            }
          });
      })
      .catch(function (error) {
        res.status(500).json({
          error: 'Failed to update video',
          message: error.message,
        });
      });
  }
);

/**
 * DELETE /api/v1/videos/:id - Delete video
 */
router.delete('/:id', function (req, res) {
  db.get_by_id('VIDEOS', req.params.id)
    .then(function (existing_video) {
      if (!existing_video) {
        return res.status(404).json({
          error: 'Video not found',
        });
      }

      return db.delete_record('VIDEOS', req.params.id).then(function (deleted) {
        if (deleted) {
          res.json({
            success: true,
            message: 'Video deleted successfully',
          });
        } else {
          res.status(500).json({
            error: 'Failed to delete video',
          });
        }
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to delete video',
        message: error.message,
      });
    });
});

export default router;
