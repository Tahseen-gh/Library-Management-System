import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

// Validation middleware
const validate_book = [
  body('library_item_id').notEmpty().withMessage('Library item ID is required'),
  body('author').optional().isString().withMessage('Author must be a string'),
  body('publisher')
    .optional()
    .isString()
    .withMessage('Publisher must be a string'),
  body('isbn').optional().isString().withMessage('ISBN must be a string'),
  body('number_of_pages')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Number of pages must be a positive integer'),
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
 * GET /api/v1/books - Get all books with library item details
 */
router.get('/', function (req, res) {
  const query = `SELECT b.*, li.title, li.description, li.publication_year, li.available
               FROM BOOKS b
               JOIN LIBRARY_ITEMS li ON b.library_item_id = li.id
               ORDER BY li.title`;

  db.execute_query(query)
    .then(function (books) {
      res.json({
        success: true,
        count: books.length,
        data: books,
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to fetch books',
        message: error.message,
      });
    });
});

/**
 * GET /api/v1/books/:id - Get single book
 */
router.get('/:id', function (req, res) {
  const query = `SELECT b.*, li.title, li.description, li.publication_year, li.available, li.cost, li.condition
               FROM BOOKS b
               JOIN LIBRARY_ITEMS li ON b.library_item_id = li.id
               WHERE b.id = ?`;

  db.execute_query(query, [req.params.id])
    .then(function (book) {
      if (!book || book.length === 0) {
        return res.status(404).json({
          error: 'Book not found',
        });
      }

      res.json({
        success: true,
        data: book[0],
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to fetch book',
        message: error.message,
      });
    });
});

/**
 * POST /api/v1/books - Create new book
 */
router.post('/', validate_book, handle_validation_errors, function (req, res) {
  // Verify library item exists and is a BOOK type
  db.get_by_id('LIBRARY_ITEMS', req.body.library_item_id)
    .then(function (library_item) {
      if (!library_item) {
        return res.status(404).json({
          error: 'Library item not found',
        });
      }

      if (library_item.item_type !== 'BOOK') {
        return res.status(400).json({
          error: 'Library item must be of type BOOK',
        });
      }

      const book_data = {
        author: req.body.author || null,
        publisher: req.body.publisher || null,
        genre: req.body.genre || null,
        cover_image_url: req.body.cover_image_url || null,
        number_of_pages: req.body.number_of_pages || null,
        isbn: req.body.isbn || null,
        library_item_id: req.body.library_item_id,
      };

      return db.create_record('BOOKS', book_data).then(function () {
        res.status(201).json({
          success: true,
          message: 'Book created successfully',
          data: book_data,
        });
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to create book',
        message: error.message,
      });
    });
});

/**
 * PUT /api/v1/books/:id - Update book
 */
router.put(
  '/:id',
  validate_book,
  handle_validation_errors,
  function (req, res) {
    db.get_by_id('BOOKS', req.params.id)
      .then(function (existing_book) {
        if (!existing_book) {
          return res.status(404).json({
            error: 'Book not found',
          });
        }

        return db
          .update_record('BOOKS', req.params.id, req.body)
          .then(function (updated) {
            if (updated) {
              res.json({
                success: true,
                message: 'Book updated successfully',
              });
            } else {
              res.status(500).json({
                error: 'Failed to update book',
              });
            }
          });
      })
      .catch(function (error) {
        res.status(500).json({
          error: 'Failed to update book',
          message: error.message,
        });
      });
  }
);

/**
 * DELETE /api/v1/books/:id - Delete book
 */
router.delete('/:id', function (req, res) {
  db.get_by_id('BOOKS', req.params.id)
    .then(function (existing_book) {
      if (!existing_book) {
        return res.status(404).json({
          error: 'Book not found',
        });
      }

      return db.delete_record('BOOKS', req.params.id).then(function (deleted) {
        if (deleted) {
          res.json({
            success: true,
            message: 'Book deleted successfully',
          });
        } else {
          res.status(500).json({
            error: 'Failed to delete book',
          });
        }
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to delete book',
        message: error.message,
      });
    });
});

export default router;
