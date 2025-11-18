import { db, execute_query } from './src/config/database.js';

async function test_three_reservations() {
  try {
    console.log('🧪 Testing 3 reservations for the same item...\n');

    // Wait for database to initialize
    const database = await db();

    // Find a library item with only 1 copy available
    // Let's use "The Silent Patient" which has 2 copies (IDs 7 and 8)
    // But first 20 copies are checked out, so we need to find a book after that

    // Get a library item that has available copies
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

    // Patrons to use: 1 (John Doe), 3 (Robert Johnson - expired but still active), 5 (Michael Brown)
    // Actually, let's use patrons 1, 5, and 2 (Jane Smith)
    const patron_ids = [1, 5, 2];
    const patron_names = ['John Doe', 'Michael Brown', 'Jane Smith'];

    console.log('Creating 3 reservations...\n');

    for (let i = 0; i < patron_ids.length; i++) {
      const patron_id = patron_ids[i];
      const patron_name = patron_names[i];

      // Simulate the reservation creation logic from routes/reservations.js

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

      // Determine if reservation is allowed
      const reservation_allowed = available_copies.length > 0 ||
                                  existing_reservations[0].count < total_copies[0].count;

      // Get next queue position
      const queue_position_result = await execute_query(
        'SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position FROM RESERVATIONS WHERE library_item_id = ? AND status IN ("waiting", "ready")',
        [test_item.id]
      );

      const queue_position = queue_position_result[0].next_position;

      // Determine status: ready if available copies exist, waiting otherwise
      const reservation_status = (reservation_allowed && available_copies.length > 0) ? 'ready' : 'waiting';

      console.log(`Reservation ${i + 1}: ${patron_name} (Patron ID: ${patron_id})`);
      console.log(`   Available copies: ${available_copies.length}`);
      console.log(`   Existing reservations: ${existing_reservations[0].count}`);
      console.log(`   Queue position: ${queue_position}`);
      console.log(`   Status: ${reservation_status}`);
      console.log(`   Reservation allowed: ${reservation_allowed}\n`);

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

      // Update copy status if ready
      if (reservation_status === 'ready' && available_copies.length > 0) {
        await execute_query(
          'UPDATE LIBRARY_ITEM_COPIES SET status = ?, updated_at = ? WHERE id = ?',
          ['Reserved', new Date().toISOString(), available_copies[0].id]
        );
      }

      console.log(`   ✓ Reservation created (ID: ${result.lastID})\n`);
    }

    // Now check all reservations for this item
    console.log('═══════════════════════════════════════════════════');
    console.log('FINAL RESERVATION QUEUE');
    console.log('═══════════════════════════════════════════════════\n');

    const all_reservations = await execute_query(
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
      console.log(`${idx + 1}. ${res.patron_name} (Queue #${res.queue_position})`);
      console.log(`   Status: ${res.status}`);
      console.log(`   Reservation ID: ${res.id}\n`);
    });

    // Check for the bug
    const first_reservation = all_reservations[0];
    if (first_reservation.status === 'waiting') {
      console.log('❌ BUG DETECTED: Position #1 has "waiting" status instead of "ready"!');
    } else if (first_reservation.status === 'ready') {
      console.log('✅ CORRECT: Position #1 has "ready" status');
    }

    console.log('\n═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test_three_reservations();
