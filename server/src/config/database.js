import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import pico from 'picocolors';

dotenv.config();

const sqliteVerbose = sqlite3.verbose();
const db_path = './library.db';

console.log('Using database path: ' + db_path);

let db = null;

/**
 * Initialize database connection
 */
async function init_database() {
  try {
    db = await open({
      filename: db_path,
      driver: sqliteVerbose.Database,
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');

    // Create tables if they don't exist
    await create_tables();

    console.log(pico.bgGreen(pico.bold('🔌 SQLite DB Connected ')));
    return db;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Database connection failed:', errorMessage);
    throw error;
  }
}

/**
 * Create database tables
 */
async function create_tables() {
  if (!db) {
    throw new Error(pico.bgRed(pico.bold('<< DB initialization failed >>')));
  }

  try {
    // Create BRANCHES table first (referenced by other tables)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS BRANCHES (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_name TEXT NOT NULL DEFAULT 'Default Branch Name',
        address TEXT,
        phone TEXT,
        is_main BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create library_items table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS LIBRARY_ITEMS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        item_type TEXT NOT NULL,
        description TEXT,
        publication_year INTEGER,
        congress_code TEXT DEFAULT '0000-0000',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create patrons table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS PATRONS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        address TEXT,
        balance REAL NOT NULL DEFAULT 0.00,
        birthday DATE,
        card_expiration DATE NOT NULL DEFAULT CURRENT_DATE,
        is_active BOOLEAN NOT NULL DEFAULT 1
      )
    `);

    // Create BOOKS table (extends LIBRARY_ITEMS)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS BOOKS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        library_item_id INTEGER NOT NULL,
        publisher TEXT,
        author TEXT NOT NULL DEFAULT '',
        genre TEXT,
        cover_image_url TEXT,
        number_of_pages INTEGER,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
      )
    `);

    // Create VIDEOS table (subclass of LIBRARY_ITEMS)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS VIDEOS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        director TEXT,
        studio TEXT,
        genre TEXT,
        cover_image_url TEXT,
        duration_minutes INTEGER,
        format TEXT,
        rating TEXT,
        isbn TEXT,
        library_item_id INTEGER NOT NULL,
        is_new_release BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
      )
    `);

    // Create VINYL_ALBUMS table (subclass of LIBRARY_ITEMS)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS VINYL_ALBUMS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        genre TEXT,
        artist TEXT,
        cover_image_url TEXT,
        number_of_tracks INTEGER,
        duration_seconds INTEGER,
        isbn TEXT,
        color TEXT,
        library_item_id INTEGER NOT NULL,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
      );
    `);

    // Create Audiobooks table (subclass of LIBRARY_ITEMS)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS AUDIOBOOKS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        duration_in_seconds INTEGER,
        narrator TEXT,
        publisher TEXT,
        genre TEXT,
        cover_img_url TEXT,
        format TEXT,
        rating TEXT,
        isbn TEXT,
        library_item_id INTEGER NOT NULL,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
      );
    `);

    // Create Magazines table (subclass of LIBRARY_ITEMS)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS MAGAZINES (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscription_cost REAL,
        publisher TEXT,
        issue_number TEXT,
        publication_month TEXT,
        publication_year INTEGER,
        library_item_id INTEGER NOT NULL,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
      );
    `);

    // Create CDs table (subclass of LIBRARY_ITEMS)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS CDS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cover_image_url TEXT,
        artist TEXT,
        genre TEXT,
        record_label TEXT,
        number_of_tracks INTEGER,
        duration_seconds INTEGER,
        library_item_id INTEGER NOT NULL,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
      );`);

    // Create Periodicals table (subclass of LIBRARY_ITEMS)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS PERIODICALS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pages INTEGER,
        issue_number TEXT,
        publication_date DATE,
        library_item_id INTEGER NOT NULL,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
      );`);

    // Create library_item_copies table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS LIBRARY_ITEM_COPIES (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        library_item_id INTEGER NOT NULL,
        owning_branch_id INTEGER NOT NULL DEFAULT 1,
        return_to_branch_id INTEGER NOT NULL DEFAULT 1,
        condition TEXT DEFAULT 'Good',
        status TEXT DEFAULT 'Available',
        cost REAL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_acquired DATE,
        due_date DATE,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE,
        FOREIGN KEY (owning_branch_id) REFERENCES BRANCHES(id) ON DELETE SET NULL,
        FOREIGN KEY (return_to_branch_id) REFERENCES BRANCHES(id) ON DELETE SET NULL
      );
    `);

    // Create reservations table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS RESERVATIONS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        library_item_id INTEGER NOT NULL,
        patron_id INTEGER,
        reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiry_date DATE,
        status TEXT DEFAULT 'pending',
        queue_position INTEGER,
        notification_sent DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE,
        FOREIGN KEY (patron_id) REFERENCES PATRONS(id) ON DELETE CASCADE
      )
    `);

    // Create transactions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS TRANSACTIONS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        copy_id INTEGER,
        patron_id INTEGER,
        location_id INTEGER,
        transaction_type TEXT NOT NULL,
        checkout_date DATE,
        due_date DATE,
        return_date DATE,
        fine_amount REAL DEFAULT 0.00,
        status TEXT DEFAULT 'Active',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (copy_id) REFERENCES LIBRARY_ITEM_COPIES(id) ON DELETE CASCADE,
        FOREIGN KEY (patron_id) REFERENCES PATRONS(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES BRANCHES(id) ON DELETE SET NULL
      )
    `);

    // Create FINES table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS FINES (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        patron_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        reason TEXT,
        is_paid BOOLEAN DEFAULT 0,
        paid_date DATE,
        payment_method TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(id) ON DELETE CASCADE,
        FOREIGN KEY (patron_id) REFERENCES PATRONS(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_library_items_type ON LIBRARY_ITEMS(item_type);
      CREATE INDEX IF NOT EXISTS idx_library_items_year ON LIBRARY_ITEMS(publication_year);
      CREATE INDEX IF NOT EXISTS idx_library_item_copies_status ON LIBRARY_ITEM_COPIES(status);
      CREATE INDEX IF NOT EXISTS idx_library_item_copies_branch ON LIBRARY_ITEM_COPIES(owning_branch_id);
      CREATE INDEX IF NOT EXISTS idx_patrons_name ON PATRONS(last_name, first_name);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON TRANSACTIONS(status);
      CREATE INDEX IF NOT EXISTS idx_reservations_status ON RESERVATIONS(status);
      CREATE INDEX IF NOT EXISTS idx_fines_patron ON FINES(patron_id);
      CREATE INDEX IF NOT EXISTS idx_fines_paid ON FINES(is_paid);
    `);

    // Insert default branch if none exists
    await db.exec(`
      INSERT OR IGNORE INTO BRANCHES (id, branch_name, is_main) 
      VALUES (1, 'Main Library', 1)
    `);

    // Create update triggers
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_library_items_timestamp 
      AFTER UPDATE ON LIBRARY_ITEMS 
      BEGIN 
        UPDATE LIBRARY_ITEMS SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
      END;

      CREATE TRIGGER IF NOT EXISTS update_library_item_copies_timestamp 
      AFTER UPDATE ON LIBRARY_ITEM_COPIES 
      BEGIN 
        UPDATE LIBRARY_ITEM_COPIES SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
      END;

      CREATE TRIGGER IF NOT EXISTS update_reservations_timestamp 
      AFTER UPDATE ON RESERVATIONS 
      BEGIN 
        UPDATE RESERVATIONS SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
      END;

      CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp 
      AFTER UPDATE ON TRANSACTIONS 
      BEGIN 
        UPDATE TRANSACTIONS SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
      END;
    `);

    console.log(pico.bgGreen(pico.bold('🔨 DB Tables Created Successfully')));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(
      pico.bgRed(pico.bold('Error Creating DB Tables: ')) + errorMessage
    );
    throw error;
  }
}

/**
 * Get DB instance
 */
async function get_database() {
  if (!db) {
    return await init_database();
  }
  if (!db) {
    throw new Error('Failed to initialize database');
  }
  return db;
}

// Initialize database connection
init_database();

/**
 * Generic query function with error handling
 * @param {string} query - The SQL query to execute
 * @param {Array} params - Parameters for the SQL query
 * @returns {Promise<Array|Object>} Query result
 */
async function execute_query(query, params) {
  try {
    const database = await get_database();
    // Check if it's a SELECT query
    if (query.trim().toLowerCase().startsWith('select')) {
      return await database.all(query, params);
    } else {
      // For INSERT, UPDATE, DELETE queries
      return await database.run(query, params);
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Generic function to get all records from a table
 * @param {string} table_name - Name of the database table
 * @param {string} conditions - Additional SQL conditions (WHERE, ORDER BY, etc.)
 * @param {Array} params - Parameters for the conditions
 * @returns {Promise<Array>} Array of records
 */
async function get_all(table_name, conditions = '', params = []) {
  const query = `SELECT * FROM ${table_name} ${conditions}`;
  const result = await execute_query(query, params);
  return Array.isArray(result) ? result : [];
}

/**
 * Generic function to get a record by ID
 * @param {string} table_name - Name of the database table
 * @param {string|number} id - The ID of the record to retrieve
 * @returns {Promise<Object|null>} The record object or null if not found
 */
async function get_by_id(table_name, id) {
  const query = `SELECT * FROM ${table_name} WHERE id = ?`;
  const results = await execute_query(query, [id]);
  if (Array.isArray(results) && results.length > 0) {
    return results[0];
  }
  return null;
}

/**
 * Generic function to create a new record
 * @param {string} table_name - Name of the database table
 * @param {Object} data - Object containing the record data
 * @returns {Promise<number|undefined>} The last inserted ID or undefined
 */
async function create_record(table_name, data) {
  const fields = Object.keys(data).join(', ');
  const placeholders = Object.keys(data)
    .map(() => '?')
    .join(', ');
  const values = Object.values(data);

  const query = `INSERT INTO ${table_name} (${fields}) VALUES (${placeholders})`;
  const result = await execute_query(query, values);
  return !Array.isArray(result) ? result.lastID : undefined;
}

/**
 * Generic function to update a record
 * @param {string} table_name - Name of the database table
 * @param {string|number} id - The ID of the record to update
 * @param {Object} data - Object containing the updated data
 * @returns {Promise<boolean>} True if the record was updated, false otherwise
 */
async function update_record(table_name, id, data) {
  const fields = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(', ');
  const values = Object.values(data).concat([id]);

  const query = `UPDATE ${table_name} SET ${fields} WHERE id = ?`;
  const result = await execute_query(query, values);
  return !Array.isArray(result) ? (result.changes || 0) > 0 : false;
}

/**
 * Generic function to delete a record
 * @param {string} table_name - Name of the database table
 * @param {string|number} id - The ID of the record to delete
 * @returns {Promise<boolean>} True if the record was deleted, false otherwise
 */
async function delete_record(table_name, id) {
  const query = `DELETE FROM ${table_name} WHERE id = ?`;
  const result = await execute_query(query, [id]);
  return !Array.isArray(result) ? (result.changes || 0) > 0 : false;
}

export {
  get_database as db,
  execute_query,
  get_all,
  get_by_id,
  create_record,
  update_record,
  delete_record,
};
