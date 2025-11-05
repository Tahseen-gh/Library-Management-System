import express from 'express';
import * as db from '../config/database.js';

var router = express.Router();

// GET /api/v1/reports/checkouts - Generate checkout report (LOW PRIORITY REQUIREMENT)
router.get('/checkouts', async function (req, res) {
  try {
    var start_date = req.query.start_date;
    var end_date = req.query.end_date;
    var branch_id = req.query.branch_id;
    var item_type = req.query.item_type;

    var query = `
      SELECT 
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
      JOIN BRANCHES b ON lic.branch_id = b.id
      WHERE t.transaction_type = 'checkout'
    `;
    var params = [];

    if (start_date) {
      query += ' AND t.checkout_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND t.checkout_date <= ?';
      params.push(end_date);
    }

    if (branch_id) {
      query += ' AND lic.branch_id = ?';
      params.push(branch_id);
    }

    if (item_type) {
      query += ' AND li.item_type = ?';
      params.push(item_type);
    }

    query += ' ORDER BY t.checkout_date DESC';

    var results = await db.execute_query(query, params);

    // Calculate statistics
    var total_checkouts = results.length;
    var active_checkouts = results.filter(function (r) {
      return r.status === 'active';
    }).length;
    var returned_checkouts = results.filter(function (r) {
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
        total_checkouts,
        active_checkouts,
        returned_checkouts,
      },
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate checkout report',
      message: error.message,
    });
  }
});

// GET /api/v1/reports/returns - Generate returns report (LOW PRIORITY REQUIREMENT)
router.get('/returns', async function (req, res) {
  try {
    var start_date = req.query.start_date;
    var end_date = req.query.end_date;
    var branch_id = req.query.branch_id;

    var query = `
      SELECT 
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
      JOIN BRANCHES b ON lic.branch_id = b.id
      WHERE t.status = 'Returned' AND t.return_date IS NOT NULL
    `;
    var params = [];

    if (start_date) {
      query += ' AND t.return_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND t.return_date <= ?';
      params.push(end_date);
    }

    if (branch_id) {
      query += ' AND lic.branch_id = ?';
      params.push(branch_id);
    }

    query += ' ORDER BY t.return_date DESC';

    var results = await db.execute_query(query, params);

    // Calculate statistics
    var total_returns = results.length;
    var late_returns = results.filter(function (r) {
      return r.fine_amount > 0;
    }).length;
    var on_time_returns = total_returns - late_returns;
    var total_fines = results.reduce(function (sum, r) {
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
        total_returns,
        on_time_returns,
        late_returns,
        total_fines: total_fines.toFixed(2),
      },
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate returns report',
      message: error.message,
    });
  }
});

// GET /api/v1/reports/fines - Generate fines report (LOW PRIORITY REQUIREMENT)
router.get('/fines', async function (req, res) {
  try {
    var start_date = req.query.start_date;
    var end_date = req.query.end_date;
    var paid_status = req.query.paid_status;

    var query = `
      SELECT 
        f.id as fine_id,
        f.amount,
        f.reason,
        f.is_paid,
        f.paid_date,
        f.payment_method,
        f.createdAt as fine_date,
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
      WHERE 1=1
    `;
    var params = [];

    if (start_date) {
      query += ' AND f.createdAt >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND f.createdAt <= ?';
      params.push(end_date);
    }

    if (paid_status === 'paid') {
      query += ' AND f.is_paid = 1';
    } else if (paid_status === 'unpaid') {
      query += ' AND f.is_paid = 0';
    }

    query += ' ORDER BY f.createdAt DESC';

    var results = await db.execute_query(query, params);

    // Calculate statistics
    var total_fines_count = results.length;
    var paid_fines = results.filter(function (r) {
      return r.is_paid;
    }).length;
    var unpaid_fines = total_fines_count - paid_fines;
    var total_amount = results.reduce(function (sum, r) {
      return sum + (r.amount || 0);
    }, 0);
    var paid_amount = results
      .filter(function (r) {
        return r.is_paid;
      })
      .reduce(function (sum, r) {
        return sum + (r.amount || 0);
      }, 0);
    var unpaid_amount = total_amount - paid_amount;

    res.json({
      success: true,
      report_type: 'fines',
      period: {
        start_date: start_date || 'all',
        end_date: end_date || 'all',
      },
      statistics: {
        total_fines_count,
        paid_fines,
        unpaid_fines,
        total_amount: total_amount.toFixed(2),
        paid_amount: paid_amount.toFixed(2),
        unpaid_amount: unpaid_amount.toFixed(2),
      },
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate fines report',
      message: error.message,
    });
  }
});

// GET /api/v1/reports/overview - Generate overall library statistics (LOW PRIORITY REQUIREMENT)
router.get('/overview', async function (req, res) {
  try {
    // Get total items
    var total_items = await db.execute_query(`
      SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES
    `);

    // Get available items
    var available_items = await db.execute_query(`
      SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES 
      WHERE status = "Available"
    `);

    // Get borrowed items
    var borrowed_items = await db.execute_query(`
      SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES 
      WHERE status = "Borrowed"
    `);

    // Get damaged items
    var damaged_items = await db.execute_query(`
      SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES 
      WHERE status = "Damaged"
    `);

    // Get total patrons
    var total_patrons = await db.execute_query(`
      SELECT COUNT(*) as count FROM PATRONS 
      WHERE is_active = 1
    `);

    // Get active checkouts
    var active_checkouts = await db.execute_query(`
      SELECT COUNT(*) as count FROM TRANSACTIONS 
      WHERE status = "Active"
    `);

    // Get total outstanding fines
    var outstanding_fines = await db.execute_query(`
      SELECT SUM(balance) as total FROM PATRONS 
      WHERE balance > 0
    `);

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
        total_outstanding_fines: (outstanding_fines[0].total || 0).toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate overview report',
      message: error.message,
    });
  }
});

export default router;
