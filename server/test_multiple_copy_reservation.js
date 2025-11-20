import { db, execute_query } from './src/config/database.js';

/**
 * Test that a single patron can reserve multiple copies of the same item
 */
async function test_patron_multiple_copy_reservation() {
  try {
    console.log('🧪 Testing that a patron can reserve multiple copies of the same item...\n');

    // Wait for database to initialize
    const database = await db();

    // Find a library item with at least 2 available copies
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
      HAVING available_copies >= 2
      LIMIT 1
    `);

    if (available_items.length === 0) {
      console.log('❌ No items found with at least 2 available copies');
      process.exit(1);
    }

    const test_item = available_items[0];
    console.log(`📚 Test Item: ${test_item.title} (ID: ${test_item.id})`);
    console.log(`   Total copies: ${test_item.total_copies}`);
    console.log(`   Available copies: ${test_item.available_copies}\n`);

    // Use patron 1 for testing
    const patron_id = 1;
    const patron = await execute_query('SELECT * FROM PATRONS WHERE id = ?', [patron_id]);

    if (patron.length === 0) {
      console.log('❌ Test patron not found');
      process.exit(1);
    }

    console.log(`👤 Test Patron: ${patron[0].first_name} ${patron[0].last_name} (ID: ${patron_id})\n`);

    // Clean up any existing reservations for this patron and item
    await execute_query(
      'DELETE FROM RESERVATIONS WHERE library_item_id = ? AND patron_id = ?',
      [test_item.id, patron_id]
    );
    console.log('🧹 Cleaned up existing test data\n');

    // Create first reservation
    console.log('Creating FIRST reservation...');
    const first_reservation = await create_reservation(test_item.id, patron_id);
    console.log(`✅ First reservation created (ID: ${first_reservation.id}, Status: ${first_reservation.status})\n`);

    // Create second reservation for the same item
    console.log('Creating SECOND reservation for the same item...');
    const second_reservation = await create_reservation(test_item.id, patron_id);
    console.log(`✅ Second reservation created (ID: ${second_reservation.id}, Status: ${second_reservation.status})\n`);

    // Verify both reservations exist
    const all_patron_reservations = await execute_query(
      `SELECT * FROM RESERVATIONS
       WHERE library_item_id = ? AND patron_id = ? AND status IN ("waiting", "ready")
       ORDER BY queue_position`,
      [test_item.id, patron_id]
    );

    console.log('═══════════════════════════════════════════════════');
    console.log('VERIFICATION');
    console.log('═══════════════════════════════════════════════════\n');

    if (all_patron_reservations.length === 2) {
      console.log('✅ SUCCESS: Patron has 2 reservations for the same item');
      all_patron_reservations.forEach((res, idx) => {
        console.log(`   ${idx + 1}. Reservation ID: ${res.id}, Status: ${res.status}, Queue: #${res.queue_position}`);
      });
    } else {
      console.log(`❌ FAILED: Expected 2 reservations, but found ${all_patron_reservations.length}`);
      process.exit(1);
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('TEST PASSED ✅');
    console.log('═══════════════════════════════════════════════════\n');

    // Clean up test data
    await execute_query(
      'DELETE FROM RESERVATIONS WHERE library_item_id = ? AND patron_id = ?',
      [test_item.id, patron_id]
    );

    // Reset copy statuses
    await execute_query(
      'UPDATE LIBRARY_ITEM_COPIES SET status = "Available" WHERE library_item_id = ?',
      [test_item.id]
    );

    console.log('🧹 Test data cleaned up\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Helper function to create a reservation (mirrors the API logic)
 */
async function create_reservation(library_item_id, patron_id) {
  // Check item availability
  const available_copies = await execute_query(
    'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Available"',
    [library_item_id]
  );

  // Check existing reservations
  const existing_reservations = await execute_query(
    'SELECT COUNT(*) as count FROM RESERVATIONS WHERE library_item_id = ? AND status IN ("waiting", "ready")',
    [library_item_id]
  );

  const total_copies = await execute_query(
    'SELECT COUNT(*) as count FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ?',
    [library_item_id]
  );

  // Determine if reservation is allowed
  const reservation_allowed = available_copies.length > 0 ||
                              existing_reservations[0].count < total_copies[0].count;

  if (!reservation_allowed) {
    throw new Error('No available copies and queue is full');
  }

  // Get next queue position
  const queue_position_result = await execute_query(
    'SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position FROM RESERVATIONS WHERE library_item_id = ? AND status IN ("waiting", "ready")',
    [library_item_id]
  );

  const queue_position = queue_position_result[0].next_position;

  // Determine status: ready if available copies exist, waiting otherwise
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
      library_item_id,
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

  return {
    id: result.lastID,
    library_item_id,
    patron_id,
    status: reservation_status,
    queue_position
  };
}

test_patron_multiple_copy_reservation();
