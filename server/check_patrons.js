import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db_path = './library.db';

async function check_patrons() {
  try {
    const db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    });

    const patrons = await db.all('SELECT id, first_name, last_name, card_expiration_date, is_active FROM PATRONS LIMIT 5');

    console.log('\n📋 Current Patrons in Database:\n');
    console.log('ID | Name                 | Card Expires   | Active');
    console.log('---|----------------------|----------------|-------');

    const today = new Date();

    patrons.forEach(p => {
      const expiry = new Date(p.card_expiration_date);
      const isExpired = expiry < today;
      const status = isExpired ? '⚠️  EXPIRED' : '✅ Valid';
      console.log(`${p.id}  | ${(p.first_name + ' ' + p.last_name).padEnd(20)} | ${p.card_expiration_date} | ${p.is_active ? status : '❌ Inactive'}`);
    });

    console.log(`\n📅 Today's date: ${today.toISOString().split('T')[0]}`);

    await db.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check_patrons();
