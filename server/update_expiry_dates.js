import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const sqliteVerbose = sqlite3.verbose();

async function updateExpiryDates() {
  const db = await open({
    filename: './library.db',
    driver: sqliteVerbose.Database,
  });

  // Get all reservations with null expiry dates
  const reservations = await db.all('SELECT id, reservation_date FROM RESERVATIONS WHERE expiry_date IS NULL');

  console.log(`Found ${reservations.length} reservations to update`);

  // Update each reservation to have expiry_date = reservation_date + 5 days
  for (const reservation of reservations) {
    const reservation_date = new Date(reservation.reservation_date);
    const expiry_date = new Date(reservation_date);
    expiry_date.setDate(expiry_date.getDate() + 5);

    await db.run(
      'UPDATE RESERVATIONS SET expiry_date = ?, updated_at = ? WHERE id = ?',
      expiry_date.toISOString(),
      new Date().toISOString(),
      reservation.id
    );

    console.log(`Updated reservation ${reservation.id}: ${reservation.reservation_date} -> expiry: ${expiry_date.toISOString()}`);
  }

  console.log('All reservations updated!');
  await db.close();
}

updateExpiryDates().catch(console.error);
