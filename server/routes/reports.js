const express = require('express');
const db = require('../config/database');

const router = express.Router();

// GET /api/v1/reports/checkouts - Generate checkout report (LOW PRIORITY REQUIREMENT)
router.get('/checkouts', async (req, res) => {
  try {
    const { start_date, end_date, branch_id, item_type } = req.query;

    let query = `
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
    let params = [];

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

    const results = await db.execute_query(query, params);

    // Calculate statistics
    const total_checkouts = results.length;
    const active_checkouts = results.filter(r => r.status === 'active').length;
    const returned_checkouts = results.filter(r => r.status === 'returned').length;

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
router.get('/returns', async (req, res) => {
  try {
    const { start_date, end_date, branch_id } = req.query;

    let query = `
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
      WHERE t.status = 'returned' AND t.return_date IS NOT NULL
    `;
    let params = [];

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

    const results = await db.execute_query(query, params);

    // Calculate statistics
    const total_returns = results.length;
    const late_returns = results.filter(r => r.fine_amount > 0).length;
    const on_time_returns = total_returns - late_returns;
    const total_fines = results.reduce((sum, r) => sum + (r.fine_amount || 0), 0);

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
router.get('/fines', async (req, res) => {
  try {
    const { start_date, end_date, paid_status } = req.query;

    let query = `
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
    let params = [];

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

    const results = await db.execute_query(query, params);

    // Calculate statistics
    const total_fines_count = results.length;
    const paid_fines = results.filter(r => r.is_paid).length;
    const unpaid_fines = total_fines_count - paid_fines;
    const total_amount = results.reduce((sum, r) => sum + (r.amount || 0), 0);
    const paid_amount = results.filter(r => r.is_paid).reduce((sum, r) => sum + (r.amount || 0), 0);
    const unpaid_amount = total_amount - paid_amount;

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
router.get('/overview', async (req, res) => {
  try {
    // Get total items
    const total_items = await db.execute_query(
      'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES'
    );

    // Get available items
    const available_items = await db.execute_query(
      'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE status = "available"'
    );

    // Get borrowed items
    const borrowed_items = await db.execute_query(
      'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE status = "borrowed"'
    );

    // Get damaged items
    const damaged_items = await db.execute_query(
      'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE status = "damaged"'
    );

    // Get total patrons
    const total_patrons = await db.execute_query(
      'SELECT COUNT(*) as count FROM PATRONS WHERE isActive = 1'
    );

    // Get active checkouts
    const active_checkouts = await db.execute_query(
      'SELECT COUNT(*) as count FROM TRANSACTIONS WHERE status = "active"'
    );

    // Get total outstanding fines
    const outstanding_fines = await db.execute_query(
      'SELECT SUM(balance) as total FROM PATRONS WHERE balance > 0'
    );

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

module.exports = router;
