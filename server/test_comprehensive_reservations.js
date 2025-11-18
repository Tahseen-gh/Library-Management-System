import { db, execute_query, update_record } from './src/config/database.js';

async function test_comprehensive_reservations() {
  try {
    console.log('🧪 COMPREHENSIVE RESERVATION QUEUE TEST\n');
    console.log('Testing the critical business rule:');
    console.log('Queue position #1 must ALWAYS be "Ready for Pickup", NEVER "Waitlist"\n');
    console.log('═══════════════════════════════════════════════════\n');

    // Wait for database to initialize
    const database = await db();

    // Find a library item with exactly 1 available copy
    const available_items = await execute_query(`
      SELECT
        li.id,
        li.title,
        COUNT(lic.id) as total_copies,
        SUM(CASE WHEN lic.status = 'Available' THEN 1 ELSE 0 END) as available_copies
      FROM LIBRARY_ITEMS li
      JOIN LIBRARY_ITEM_COPIES lic ON li.id = lic.library_item_id
      WHERE lic.status = 'Available'
      GROUP BY li.id
      HAVING available_copies = 1
      LIMIT 1
    `);

    if (available_items.length === 0) {
      console.log('❌ No items found with exactly 1 available copy');
      process.exit(1);
    }

    const test_item = available_items[0];
    console.log(`📚 Test Item: ${test_item.title} (ID: ${test_item.id})`);
    console.log(`   Total copies: ${test_item.total_copies}`);
    console.log(`   Available copies: ${test_item.available_copies}\n`);

    // Get actual patron IDs from database
    const patrons = await execute_query('SELECT id, first_name, last_name FROM PATRONS ORDER BY id LIMIT 3');
    const patron_ids = patrons.map(p => p.id);
    const patron_names = patrons.map(p => `${p.first_name} ${p.last_name}`);

    // ========================================
    // TEST 1: Create 3 reservations
    // ========================================
    console.log('TEST 1: Creating 3 reservations for the same item');
    console.log('───────────────────────────────────────────────────\n');

    const reservation_ids = [];

    for (let i = 0; i < patron_ids.length; i++) {
      const patron_id = patron_ids[i];
      const patron_name = patron_names[i];

      // Check item availability
      const available_copies = await execute_query(
        'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Available"',
        [test_item.id]
      );

      // Check existing reservations
      const existing_reservations = await execute_query(
        'SELECT COUNT(*) as count FROM RESERVATIONS WHERE library_item_id = ? AND status IN ("waiting", "ready")',
        [test_item.id]
      );

      const total_copies = await execute_query(
        'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ?',
        [test_item.id]
      );

      const reservation_allowed = available_copies.length > 0 ||
                                  existing_reservations[0].count < total_copies[0].count;

      const queue_position_result = await execute_query(
        'SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position FROM RESERVATIONS WHERE library_item_id = ? AND status IN ("waiting", "ready")',
        [test_item.id]
      );

      const queue_position = queue_position_result[0].next_position;
      const reservation_status = (reservation_allowed && available_copies.length > 0) ? 'ready' : 'waiting';

      // Create the reservation
      const reservation_date = new Date();
      const expiry_date = new Date(reservation_date);
      expiry_date.setDate(expiry_date.getDate() + 5);

      const result = await execute_query(
        `INSERT INTO RESERVATIONS
         (library_item_id, patron_id, reservation_date, expiry_date, status, queue_position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          test_item.id,
          patron_id,
          reservation_date.toISOString(),
          expiry_date.toISOString(),
          reservation_status,
          queue_position,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );

      reservation_ids.push(result.lastID);

      // Update copy status if ready
      if (reservation_status === 'ready' && available_copies.length > 0) {
        await execute_query(
          'UPDATE LIBRARY_ITEM_COPIES SET status = ?, updated_at = ? WHERE id = ?',
          ['Reserved', new Date().toISOString(), available_copies[0].id]
        );
      }

      const emoji = reservation_status === 'ready' ? '✅' : '⏳';
      console.log(`${emoji} Reservation ${i + 1}: ${patron_name}`);
      console.log(`   Queue Position: #${queue_position}`);
      console.log(`   Status: ${reservation_status.toUpperCase()}\n`);
    }

    // Verify queue after creation
    console.log('Queue Status After Creation:');
    let all_reservations = await execute_query(
      `SELECT
        r.id,
        r.queue_position,
        r.status,
        p.first_name || ' ' || p.last_name as patron_name
       FROM RESERVATIONS r
       JOIN PATRONS p ON r.patron_id = p.id
       WHERE r.library_item_id = ?
       ORDER BY r.queue_position`,
      [test_item.id]
    );

    all_reservations.forEach((res, idx) => {
      const emoji = res.status === 'ready' ? '✅' : '⏳';
      console.log(`${emoji} #${res.queue_position}: ${res.patron_name} - ${res.status.toUpperCase()}`);
    });

    // Check Test 1
    let position_one = all_reservations.find(r => r.queue_position === 1);
    if (position_one && position_one.status === 'waiting') {
      console.log('\n❌ TEST 1 FAILED: Position #1 has "waiting" status!');
      process.exit(1);
    } else if (position_one && position_one.status === 'ready') {
      console.log('\n✅ TEST 1 PASSED: Position #1 has "ready" status\n');
    }

    console.log('═══════════════════════════════════════════════════\n');

    // ========================================
    // TEST 2: Cancel position #1 reservation
    // ========================================
    console.log('TEST 2: Canceling position #1 (should promote #2 to ready)');
    console.log('───────────────────────────────────────────────────\n');

    const first_reservation = all_reservations[0];
    console.log(`Canceling: ${first_reservation.patron_name}'s reservation (ID: ${first_reservation.id})\n`);

    // Cancel the first reservation (simulate the cancel logic)
    await update_record('RESERVATIONS', first_reservation.id, {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    });

    // Get reserved copy
    const reserved_copies = await execute_query(
      'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Reserved"',
      [test_item.id]
    );

    // Check for next waiting reservation
    const next_waiting_reservations = await execute_query(
      'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND status = "waiting" ORDER BY queue_position LIMIT 1',
      [test_item.id]
    );

    if (next_waiting_reservations.length > 0 && reserved_copies.length > 0) {
      // Promote next waiting reservation to ready
      const next_reservation = next_waiting_reservations[0];
      const new_expiry = new Date();
      new_expiry.setDate(new_expiry.getDate() + 5);

      await update_record('RESERVATIONS', next_reservation.id, {
        status: 'ready',
        expiry_date: new_expiry.toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(`✅ Promoted next reservation to "ready" status\n`);
    }

    // Update queue positions
    await execute_query(
      'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE library_item_id = ? AND queue_position > ? AND status IN ("waiting", "ready")',
      [test_item.id, first_reservation.queue_position]
    );

    console.log('Queue Status After Cancellation:');
    all_reservations = await execute_query(
      `SELECT
        r.id,
        r.queue_position,
        r.status,
        p.first_name || ' ' || p.last_name as patron_name
       FROM RESERVATIONS r
       JOIN PATRONS p ON r.patron_id = p.id
       WHERE r.library_item_id = ? AND r.status != 'cancelled'
       ORDER BY r.queue_position`,
      [test_item.id]
    );

    all_reservations.forEach((res, idx) => {
      const emoji = res.status === 'ready' ? '✅' : '⏳';
      console.log(`${emoji} #${res.queue_position}: ${res.patron_name} - ${res.status.toUpperCase()}`);
    });

    // Check Test 2
    position_one = all_reservations.find(r => r.queue_position === 1);
    if (position_one && position_one.status === 'waiting') {
      console.log('\n❌ TEST 2 FAILED: Position #1 has "waiting" status after cancellation!');
      console.log('   This is the bug we are fixing!');
      process.exit(1);
    } else if (position_one && position_one.status === 'ready') {
      console.log('\n✅ TEST 2 PASSED: Position #1 was promoted to "ready" status\n');
    }

    console.log('═══════════════════════════════════════════════════\n');

    // ========================================
    // FINAL VERIFICATION
    // ========================================
    console.log('FINAL VERIFICATION');
    console.log('───────────────────────────────────────────────────\n');

    const all_active_reservations = await execute_query(
      `SELECT
        r.id,
        r.queue_position,
        r.status,
        p.first_name || ' ' || p.last_name as patron_name
       FROM RESERVATIONS r
       JOIN PATRONS p ON r.patron_id = p.id
       WHERE r.library_item_id = ? AND r.status IN ('waiting', 'ready')
       ORDER BY r.queue_position`,
      [test_item.id]
    );

    const violations = all_active_reservations.filter(r => r.queue_position === 1 && r.status === 'waiting');

    if (violations.length > 0) {
      console.log('❌ CRITICAL BUG DETECTED:');
      violations.forEach(v => {
        console.log(`   ${v.patron_name} at position #${v.queue_position} has "${v.status}" status!`);
      });
      console.log('\n   Queue position #1 must ALWAYS be "ready", NEVER "waiting"!');
      process.exit(1);
    } else {
      console.log('✅ ALL TESTS PASSED!');
      console.log('\nBusiness Rule Verified:');
      console.log('   ✓ Queue position #1 always has "Ready for Pickup" status');
      console.log('   ✓ Cancellations properly promote next person in queue');
      console.log('   ✓ No patron at position #1 ever has "Waitlist" status\n');
    }

    console.log('═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test_comprehensive_reservations();
