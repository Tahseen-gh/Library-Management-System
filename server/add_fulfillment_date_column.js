import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const sqliteVerbose = sqlite3.verbose();

async function addFulfillmentDateColumn() {
  const db = await open({
    filename: './library.db',
    driver: sqliteVerbose.Database,
  });

  try {
    // Add fulfillment_date column to RESERVATIONS table
    await db.exec('ALTER TABLE RESERVATIONS ADD COLUMN fulfillment_date DATETIME');
    console.log('✅ Successfully added fulfillment_date column to RESERVATIONS table');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️  Column fulfillment_date already exists');
    } else {
      console.error('❌ Error adding column:', error.message);
      throw error;
    }
  }

  await db.close();
}

addFulfillmentDateColumn().catch(console.error);
