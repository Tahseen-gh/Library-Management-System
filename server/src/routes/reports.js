import express from 'express';
import * as db from '../config/database.js';

const router = express.Router();

/**
 * GET /api/v1/reports/checkouts - Generate checkout report (LOW PRIORITY REQUIREMENT)
 */
router.get('/checkouts', function (req, res) {
  const start_date = req.query.start_date;
  const end_date = req.query.end_date;
  const branch_id = req.query.owning_branch_id;
  const item_type = req.query.item_type;

  const query = `SELECT 
                 t.id as transaction_id,
                 t.checkout_date,
                 t.due_date,
                 t.status,
                 p.first_name,
                 p.last_name,
                 p.id as patron_id,
                 li.title,
                 li.item_type,
                 b.branch_name,
                 lic.id as copy_id
               FROM TRANSACTIONS t
               JOIN PATRONS p ON t.patron_id = p.id
               JOIN LIBRARY_ITEM_COPIES lic ON t.copy_id = lic.id
               JOIN LIBRARY_ITEMS li ON lic.library_item_id = li.id
               JOIN BRANCHES b ON lic.owning_branch_id = b.id
               WHERE t.transaction_type = 'checkout'`;
  const params = [];

  if (start_date) {
    query += ' AND t.checkout_date >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND t.checkout_date <= ?';
    params.push(end_date);
  }

  if (branch_id) {
    query += ' AND lic.owning_branch_id = ?';
    params.push(branch_id);
  }

  if (item_type) {
    query += ' AND li.item_type = ?';
    params.push(item_type);
  }

  query += ' ORDER BY t.checkout_date DESC';

  db.execute_query(query, params)
    .then(function (results) {
      // Calculate statistics
      const total_checkouts = results.length;
      const active_checkouts = results.filter(function (r) {
        return r.status === 'active';
      }).length;
      const returned_checkouts = results.filter(function (r) {
        return r.status === 'returned';
      }).length;

      res.json({
        success: true,
        report_type: 'checkouts',
        period: {
          start_date: start_date || 'all',
          end_date: end_date || 'all',
        },
        statistics: {
          total_checkouts: total_checkouts,
          active_checkouts: active_checkouts,
          returned_checkouts: returned_checkouts,
        },
        data: results,
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to generate checkout report',
        message: error.message,
      });
    });
});

/**
 * GET /api/v1/reports/returns - Generate returns report (LOW PRIORITY REQUIREMENT)
 */
router.get('/returns', function (req, res) {
  const start_date = req.query.start_date;
  const end_date = req.query.end_date;
  const branch_id = req.query.owning_branch_id;

  const query = `SELECT 
                 t.id as transaction_id,
                 t.checkout_date,
                 t.due_date,
                 t.return_date,
                 t.fine_amount,
                 p.first_name,
                 p.last_name,
                 p.id as patron_id,
                 li.title,
                 li.item_type,
                 b.branch_name,
                 lic.id as copy_id,
                 lic.condition
               FROM TRANSACTIONS t
               JOIN PATRONS p ON t.patron_id = p.id
               JOIN LIBRARY_ITEM_COPIES lic ON t.copy_id = lic.id
               JOIN LIBRARY_ITEMS li ON lic.library_item_id = li.id
               JOIN BRANCHES b ON lic.owning_branch_id = b.id
               WHERE t.status = 'Returned' AND t.return_date IS NOT NULL`;
  const params = [];

  if (start_date) {
    query += ' AND t.return_date >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND t.return_date <= ?';
    params.push(end_date);
  }

  if (branch_id) {
    query += ' AND lic.owning_branch_id = ?';
    params.push(branch_id);
  }

  query += ' ORDER BY t.return_date DESC';

  db.execute_query(query, params)
    .then(function (results) {
      // Calculate statistics
      const total_returns = results.length;
      const late_returns = results.filter(function (r) {
        return r.fine_amount > 0;
      }).length;
      const on_time_returns = total_returns - late_returns;
      const total_fines = results.reduce(function (sum, r) {
        return sum + (r.fine_amount || 0);
      }, 0);

      res.json({
        success: true,
        report_type: 'returns',
        period: {
          start_date: start_date || 'all',
          end_date: end_date || 'all',
        },
        statistics: {
          total_returns: total_returns,
          on_time_returns: on_time_returns,
          late_returns: late_returns,
          total_fines: total_fines.toFixed(2),
        },
        data: results,
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to generate returns report',
        message: error.message,
      });
    });
});

/**
 * GET /api/v1/reports/fines - Generate fines report (LOW PRIORITY REQUIREMENT)
 */
router.get('/fines', function (req, res) {
  const start_date = req.query.start_date;
  const end_date = req.query.end_date;
  const paid_status = req.query.paid_status;

  const query = `SELECT 
                 f.id as fine_id,
                 f.amount,
                 f.reason,
                 f.is_paid,
                 f.paid_date,
                 f.payment_method,
                 f.created_at as fine_date,
                 p.first_name,
                 p.last_name,
                 p.id as patron_id,
                 p.balance as patron_balance,
                 t.id as transaction_id,
                 li.title,
                 li.item_type
               FROM FINES f
               JOIN PATRONS p ON f.patron_id = p.id
               JOIN TRANSACTIONS t ON f.transaction_id = t.id
               JOIN LIBRARY_ITEM_COPIES lic ON t.copy_id = lic.id
               JOIN LIBRARY_ITEMS li ON lic.library_item_id = li.id
               WHERE 1=1`;
  const params = [];

  if (start_date) {
    query += ' AND f.created_at >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND f.created_at <= ?';
    params.push(end_date);
  }

  if (paid_status === 'paid') {
    query += ' AND f.is_paid = 1';
  } else if (paid_status === 'unpaid') {
    query += ' AND f.is_paid = 0';
  }

  query += ' ORDER BY f.created_at DESC';

  db.execute_query(query, params)
    .then(function (results) {
      // Calculate statistics
      const total_fines_count = results.length;
      const paid_fines = results.filter(function (r) {
        return r.is_paid;
      }).length;
      const unpaid_fines = total_fines_count - paid_fines;
      const total_amount = results.reduce(function (sum, r) {
        return sum + (r.amount || 0);
      }, 0);
      const paid_amount = results
        .filter(function (r) {
          return r.is_paid;
        })
        .reduce(function (sum, r) {
          return sum + (r.amount || 0);
        }, 0);
      const unpaid_amount = total_amount - paid_amount;

      res.json({
        success: true,
        report_type: 'fines',
        period: {
          start_date: start_date || 'all',
          end_date: end_date || 'all',
        },
        statistics: {
          total_fines_count: total_fines_count,
          paid_fines: paid_fines,
          unpaid_fines: unpaid_fines,
          total_amount: total_amount.toFixed(2),
          paid_amount: paid_amount.toFixed(2),
          unpaid_amount: unpaid_amount.toFixed(2),
        },
        data: results,
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to generate fines report',
        message: error.message,
      });
    });
});

/**
 * GET /api/v1/reports/overview - Generate overall library statistics (LOW PRIORITY REQUIREMENT)
 */
router.get('/overview', function (req, res) {
  // Get total items
  db.execute_query('SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES')
    .then(function (total_items) {
      // Get available items
      return db
        .execute_query(
          'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE status = "Available"'
        )
        .then(function (available_items) {
          // Get borrowed items
          return db
            .execute_query(
              'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE status = "Borrowed"'
            )
            .then(function (borrowed_items) {
              // Get damaged items
              return db
                .execute_query(
                  'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE status = "Damaged"'
                )
                .then(function (damaged_items) {
                  // Get total patrons
                  return db
                    .execute_query(
                      'SELECT COUNT(*) as count FROM PATRONS WHERE is_active = 1'
                    )
                    .then(function (total_patrons) {
                      // Get active checkouts
                      return db
                        .execute_query(
                          'SELECT COUNT(*) as count FROM TRANSACTIONS WHERE status = "Active"'
                        )
                        .then(function (active_checkouts) {
                          // Get total outstanding fines
                          return db
                            .execute_query(
                              'SELECT SUM(balance) as total FROM PATRONS WHERE balance > 0'
                            )
                            .then(function (outstanding_fines) {
                              res.json({
                                success: true,
                                report_type: 'overview',
                                statistics: {
                                  total_items: total_items[0].count,
                                  available_items: available_items[0].count,
                                  borrowed_items: borrowed_items[0].count,
                                  damaged_items: damaged_items[0].count,
                                  total_active_patrons: total_patrons[0].count,
                                  active_checkouts: active_checkouts[0].count,
                                  total_outstanding_fines: (
                                    outstanding_fines[0].total || 0
                                  ).toFixed(2),
                                },
                              });
                            });
                        });
                    });
                });
            });
        });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to generate overview report',
        message: error.message,
      });
    });
});

export default router;
