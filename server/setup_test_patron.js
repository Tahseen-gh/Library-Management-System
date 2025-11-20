import { db, execute_query, create_record } from './src/config/database.js';

async function setup_test_patron() {
  try {
    console.log('🔧 Setting up test patron...\n');

    // Wait for database to initialize
    const database = await db();

    // Check if patron 1 exists
    const patron = await execute_query('SELECT * FROM PATRONS WHERE id = 1');

    if (patron.length > 0) {
      console.log('✅ Test patron already exists:');
      console.log(`   ID: ${patron[0].id}`);
      console.log(`   Name: ${patron[0].first_name} ${patron[0].last_name}`);
      console.log(`   Email: ${patron[0].email}`);
      console.log(`   Active: ${patron[0].is_active ? 'Yes' : 'No'}`);
      process.exit(0);
    }

    console.log('📝 Creating test patron...');

    // Create a test patron
    const patron_id = await create_record('PATRONS', {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-1234',
      address: '123 Main St',
      balance: 0.00,
      birthday: '1990-01-01',
      card_expiration_date: '2025-12-31',
      is_active: 1,
      created_at: new Date().toISOString()
    });

    console.log(`✅ Test patron created (ID: ${patron_id})`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setup_test_patron();
