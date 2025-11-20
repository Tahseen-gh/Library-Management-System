import { db, execute_query, create_record } from './src/config/database.js';

/**
 * Test that patrons can reserve items when ALL copies are checked out
 * (should be added to waitlist)
 */
async function test_reserve_all_checked_out() {
  try {
    console.log('🧪 Testing reservation when ALL copies are checked out...\n');

    // Wait for database to initialize
    const database = await db();

    // Get test item with all its copies
    const test_item_id = 1;
    const item = await execute_query('SELECT * FROM LIBRARY_ITEMS WHERE id = ?', [test_item_id]);
    const copies = await execute_query('SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ?', [test_item_id]);

    if (copies.length < 2) {
      console.log('❌ Need at least 2 copies for this test');
      process.exit(1);
    }

    console.log(`📚 Test Item: ${item[0].title} (ID: ${test_item_id})`);
    console.log(`   Total copies: ${copies.length}\n`);

    // Ensure we have enough patrons (copies.length + 1 for the one who will reserve)
    const needed_patrons = copies.length + 1;
    let patrons = await execute_query(`SELECT * FROM PATRONS ORDER BY id LIMIT ${needed_patrons}`);

    // Create additional patrons if needed
    while (patrons.length < needed_patrons) {
      const patron_num = patrons.length + 1;
      const patron_id = await create_record('PATRONS', {
        first_name: `Patron${patron_num}`,
        last_name: 'Test',
        email: `patron${patron_num}@example.com`,
        phone: `555-${1000 + patron_num}`,
        address: `${patron_num} Test St`,
        balance: 0.00,
        birthday: '1990-01-01',
        card_expiration_date: '2025-12-31',
        is_active: 1,
        created_at: new Date().toISOString()
      });
      console.log(`Created Patron ${patron_num} (ID: ${patron_id})`);
      patrons.push((await execute_query('SELECT * FROM PATRONS WHERE id = ?', [patron_id]))[0]);
    }
    console.log();

    // Display patrons
    patrons.forEach((p, idx) => {
      console.log(`👤 Patron ${idx + 1}: ${p.first_name} ${p.last_name} (ID: ${p.id})`);
    });
    console.log();

    // Clean up
    await execute_query('DELETE FROM RESERVATIONS WHERE library_item_id = ?', [test_item_id]);
    await execute_query('DELETE FROM TRANSACTIONS WHERE copy_id IN (SELECT id FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ?)', [test_item_id]);
    await execute_query('UPDATE LIBRARY_ITEM_COPIES SET status = "Available", checked_out_by = NULL, due_date = NULL WHERE library_item_id = ?', [test_item_id]);
    console.log('🧹 Cleaned up existing test data\n');

    // Checkout ALL copies to different patrons
    console.log(`Checking out ALL ${copies.length} copies...\n`);
    for (let i = 0; i < copies.length; i++) {
      const copy = copies[i];
      const patron = patrons[i];
      console.log(`Step ${i + 1}: ${patron.first_name} ${patron.last_name} checks out Copy ${copy.id}...`);
      await checkout_copy(copy.id, patron.id);
      console.log(`✅ Copy ${copy.id} checked out\n`);
    }

    // Check current copy statuses
    const updated_copies = await execute_query(
      'SELECT id, status, checked_out_by FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? ORDER BY id',
      [test_item_id]
    );

    console.log('Current copy statuses:');
    updated_copies.forEach(copy => {
      console.log(`  Copy ${copy.id}: ${copy.status} ${copy.checked_out_by ? `(checked out by Patron ${copy.checked_out_by})` : ''}`);
    });

    const available_count = updated_copies.filter(c => c.status === 'Available').length;
    console.log(`\n📊 Available copies: ${available_count}/${copies.length}\n`);

    // Last patron attempts to reserve the item (should be added to waitlist)
    const reserving_patron = patrons[patrons.length - 1];
    console.log(`Final Step: ${reserving_patron.first_name} ${reserving_patron.last_name} attempts to reserve the item...`);
    console.log(`  All ${copies.length} copies are checked out, so this patron should be added to the WAITLIST\n`);

    try {
      const reservation = await create_reservation(test_item_id, reserving_patron.id);

      console.log('═══════════════════════════════════════════════════');
      console.log('✅ SUCCESS: Reservation created!');
      console.log('═══════════════════════════════════════════════════');
      console.log(`   Reservation ID: ${reservation.id}`);
      console.log(`   Status: ${reservation.status}`);
      console.log(`   Queue Position: ${reservation.queue_position}`);
      console.log('═══════════════════════════════════════════════════\n');

      // Verify the reservation status
      if (reservation.status === 'waiting') {
        console.log('✅ TEST PASSED: Patron was added to WAITLIST when all copies are checked out\n');
      } else {
        console.log(`⚠️  UNEXPECTED: Reservation status is "${reservation.status}" instead of "waiting"\n`);
      }

    } catch (error) {
      console.log('═══════════════════════════════════════════════════');
      console.log('❌ FAILED: Cannot create reservation');
      console.log('═══════════════════════════════════════════════════');
      console.log(`   Error: ${error.message}`);
      console.log('═══════════════════════════════════════════════════\n');
      console.log('This indicates the system is preventing reservations when all copies are checked out.\n');
    }

    // Clean up
    console.log('🧹 Cleaning up test data...');
    await execute_query('DELETE FROM RESERVATIONS WHERE library_item_id = ?', [test_item_id]);
    await execute_query('DELETE FROM TRANSACTIONS WHERE copy_id IN (SELECT id FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ?)', [test_item_id]);
    await execute_query('UPDATE LIBRARY_ITEM_COPIES SET status = "Available", checked_out_by = NULL, due_date = NULL WHERE library_item_id = ?', [test_item_id]);
    console.log('✅ Cleanup complete\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Helper function to checkout a copy
 */
async function checkout_copy(copy_id, patron_id) {
  const checkout_date = new Date();
  const due_date = new Date(checkout_date);
  due_date.setDate(due_date.getDate() + 14);

  await create_record('TRANSACTIONS', {
    copy_id,
    patron_id,
    location_id: 1,
    transaction_type: 'Checkout',
    checkout_date: checkout_date.toISOString(),
    due_date: due_date.toISOString(),
    status: 'Active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  await execute_query(
    'UPDATE LIBRARY_ITEM_COPIES SET status = ?, checked_out_by = ?, due_date = ? WHERE id = ?',
    ['Checked Out', patron_id, due_date.toISOString(), copy_id]
  );
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

  // Check if patron already has a copy of this item checked out
  const patron_active_checkouts = await execute_query(
    `SELECT t.* FROM TRANSACTIONS t
     JOIN LIBRARY_ITEM_COPIES c ON t.copy_id = c.id
     WHERE c.library_item_id = ? AND t.patron_id = ? AND t.status = 'Active'`,
    [library_item_id, patron_id]
  );

  if (patron_active_checkouts.length > 0) {
    throw new Error('Patron already has a copy of this item checked out');
  }

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

  // Log transaction
  await create_record('TRANSACTIONS', {
    copy_id: available_copies.length > 0 ? available_copies[0].id : null,
    patron_id,
    location_id: 1,
    transaction_type: 'Reservation',
    status: reservation_status === 'ready' ? 'Active' : 'Waiting',
    notes: reservation_status === 'ready'
      ? 'Item ready for pickup - on reserved shelf'
      : 'Patron waiting in queue for item',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return {
    id: result.lastID,
    library_item_id,
    patron_id,
    status: reservation_status,
    queue_position
  };
}

test_reserve_all_checked_out();
