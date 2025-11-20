import { db, execute_query, create_record } from './src/config/database.js';

/**
 * Test that patrons can reserve items that are currently checked out by other patrons
 */
async function test_reserve_checked_out_item() {
  try {
    console.log('🧪 Testing reservation of checked-out items...\n');

    // Wait for database to initialize
    const database = await db();

    // Setup: Get or create test item with 2 copies
    let test_item_id = 1;
    const existing_item = await execute_query('SELECT * FROM LIBRARY_ITEMS WHERE id = ?', [test_item_id]);

    if (existing_item.length === 0) {
      console.log('Creating test item...');
      test_item_id = await create_record('LIBRARY_ITEMS', {
        title: 'Test Book for Checkout Reservation',
        item_type: 'Book',
        description: 'Test book',
        publication_year: 2024,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await create_record('BOOKS', {
        library_item_id: test_item_id,
        author: 'Test Author',
        publisher: 'Test Publisher',
        genre: 'Fiction',
        created_at: new Date().toISOString()
      });

      // Create 2 copies
      for (let i = 1; i <= 2; i++) {
        await create_record('LIBRARY_ITEM_COPIES', {
          library_item_id: test_item_id,
          owning_branch_id: 1,
          return_to_branch_id: 1,
          current_branch_id: 1,
          condition: 'Good',
          status: 'Available',
          cost: 19.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          date_acquired: new Date().toISOString()
        });
      }
      console.log('✅ Test item created\n');
    }

    // Get item details
    const item = await execute_query('SELECT * FROM LIBRARY_ITEMS WHERE id = ?', [test_item_id]);
    const copies = await execute_query('SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ?', [test_item_id]);

    console.log(`📚 Test Item: ${item[0].title} (ID: ${test_item_id})`);
    console.log(`   Total copies: ${copies.length}\n`);

    // Ensure we have at least 2 patrons
    const patrons = await execute_query('SELECT * FROM PATRONS ORDER BY id LIMIT 2');
    if (patrons.length < 2) {
      console.log('❌ Need at least 2 patrons for this test');
      process.exit(1);
    }

    const patron1 = patrons[0];
    const patron2 = patrons[1];

    console.log(`👤 Patron 1: ${patron1.first_name} ${patron1.last_name} (ID: ${patron1.id})`);
    console.log(`👤 Patron 2: ${patron2.first_name} ${patron2.last_name} (ID: ${patron2.id})\n`);

    // Clean up: Remove any existing reservations and transactions
    await execute_query('DELETE FROM RESERVATIONS WHERE library_item_id = ?', [test_item_id]);
    await execute_query('DELETE FROM TRANSACTIONS WHERE copy_id IN (SELECT id FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ?)', [test_item_id]);
    await execute_query('UPDATE LIBRARY_ITEM_COPIES SET status = "Available", checked_out_by = NULL WHERE library_item_id = ?', [test_item_id]);
    console.log('🧹 Cleaned up existing test data\n');

    // Step 1: Patron 1 checks out Copy 1
    console.log('Step 1: Patron 1 checks out Copy 1...');
    const copy1 = copies[0];

    const checkout_date = new Date();
    const due_date = new Date(checkout_date);
    due_date.setDate(due_date.getDate() + 14);

    const transaction_id = await create_record('TRANSACTIONS', {
      copy_id: copy1.id,
      patron_id: patron1.id,
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
      ['Checked Out', patron1.id, due_date.toISOString(), copy1.id]
    );

    console.log(`✅ Patron 1 checked out Copy ${copy1.id}`);
    console.log(`   Transaction ID: ${transaction_id}`);
    console.log(`   Due date: ${due_date.toISOString().split('T')[0]}\n`);

    // Step 2: Check current copy statuses
    const updated_copies = await execute_query(
      'SELECT id, status, checked_out_by FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? ORDER BY id',
      [test_item_id]
    );

    console.log('Current copy statuses:');
    updated_copies.forEach(copy => {
      console.log(`  Copy ${copy.id}: ${copy.status} ${copy.checked_out_by ? `(checked out by Patron ${copy.checked_out_by})` : ''}`);
    });
    console.log();

    // Step 3: Patron 2 attempts to reserve the item
    console.log('Step 2: Patron 2 attempts to reserve the item...\n');

    try {
      const reservation = await create_reservation(test_item_id, patron2.id);

      console.log('═══════════════════════════════════════════════════');
      console.log('✅ SUCCESS: Reservation created!');
      console.log('═══════════════════════════════════════════════════');
      console.log(`   Reservation ID: ${reservation.id}`);
      console.log(`   Status: ${reservation.status}`);
      console.log(`   Queue Position: ${reservation.queue_position}`);
      console.log(`   Expected behavior: ${reservation.status === 'ready' ? 'Item is ready for pickup (available copy exists)' : 'Waiting in queue (all copies checked out/reserved)'}`);
      console.log('═══════════════════════════════════════════════════\n');

      // Verify the reservation exists
      const created_reservation = await execute_query(
        'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND patron_id = ?',
        [test_item_id, patron2.id]
      );

      if (created_reservation.length > 0) {
        console.log('✅ TEST PASSED: Patron can reserve an item that is checked out by another patron\n');
      } else {
        console.log('❌ TEST FAILED: Reservation was not created in database\n');
      }

    } catch (error) {
      console.log('═══════════════════════════════════════════════════');
      console.log('❌ FAILED: Cannot create reservation');
      console.log('═══════════════════════════════════════════════════');
      console.log(`   Error: ${error.message}`);
      console.log('═══════════════════════════════════════════════════\n');
      console.log('This indicates the system is preventing reservations for checked-out items.\n');
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

test_reserve_checked_out_item();
