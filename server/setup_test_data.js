import { db, execute_query, create_record } from './src/config/database.js';

async function setup_test_data() {
  try {
    console.log('🔧 Setting up test data...\n');

    // Wait for database to initialize
    const database = await db();

    // Check if we have items with multiple copies
    const items_with_copies = await execute_query(`
      SELECT
        li.id,
        li.title,
        COUNT(lic.id) as total_copies,
        SUM(CASE WHEN lic.status = 'Available' THEN 1 ELSE 0 END) as available_copies
      FROM LIBRARY_ITEMS li
      JOIN LIBRARY_ITEM_COPIES lic ON li.id = lic.library_item_id
      GROUP BY li.id
      ORDER BY total_copies DESC
      LIMIT 5
    `);

    console.log('Current items with copies:');
    items_with_copies.forEach(item => {
      console.log(`  ${item.title}: ${item.total_copies} total, ${item.available_copies} available`);
    });

    // Find item with at least 2 available copies
    const suitable_items = items_with_copies.filter(item => item.available_copies >= 2);

    if (suitable_items.length > 0) {
      console.log('\n✅ Found items with at least 2 available copies - test data is ready');
      process.exit(0);
    }

    console.log('\n📝 Creating test data...');

    // Create a test book
    const book_data = {
      title: 'Test Book for Multiple Reservations',
      item_type: 'Book',
      description: 'This is a test book',
      publication_year: 2024,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const library_item_id = await create_record('LIBRARY_ITEMS', book_data);
    console.log(`Created library item (ID: ${library_item_id})`);

    // Create book details
    await create_record('BOOKS', {
      library_item_id,
      author: 'Test Author',
      publisher: 'Test Publisher',
      genre: 'Fiction',
      created_at: new Date().toISOString()
    });

    // Create 3 copies
    for (let i = 1; i <= 3; i++) {
      const copy_id = await create_record('LIBRARY_ITEM_COPIES', {
        library_item_id,
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
      console.log(`Created copy ${i} (ID: ${copy_id})`);
    }

    console.log('\n✅ Test data created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setup_test_data();
