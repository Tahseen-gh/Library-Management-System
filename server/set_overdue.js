import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const sqliteVerbose = sqlite3.verbose();

async function setOverdueDueDate() {
  const db = await open({
    filename: './library.db',
    driver: sqliteVerbose.Database,
  });

  // Set copy_id 7 (Atomic Habits) to be 10 days overdue
  const past_due_date = new Date();
  past_due_date.setDate(past_due_date.getDate() - 10); // 10 days ago
  const past_due_timestamp = past_due_date.getTime();

  await db.run(
    'UPDATE LIBRARY_ITEM_COPIES SET due_date = ? WHERE id = ?',
    past_due_timestamp,
    7
  );

  // Also update the transaction due date
  await db.run(
    'UPDATE TRANSACTIONS SET due_date = ? WHERE copy_id = ? AND status = "Active"',
    past_due_date.toISOString(),
    7
  );

  console.log(`✅ Updated copy_id 7 to be overdue by 10 days`);
  console.log(`   Due date set to: ${past_due_date.toISOString()}`);

  await db.close();
}

setOverdueDueDate().catch(console.error);
