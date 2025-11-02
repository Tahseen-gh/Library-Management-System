const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

// Database configuration
const db_path = process.env.DB_PATH || './library.db';

let db = null;

// Initialize database connection
const init_database = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');

    // Create tables if they don't exist
    await create_tables();

    console.log('SQLite database connected successfully');
    return db;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

// Create database tables
const create_tables = async () => {
  try {
    // Create BRANCHES table first (referenced by other tables)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS BRANCHES (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
        branch_name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        is_main BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create PATRONS table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS PATRONS (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        birthday DATE,
        balance REAL DEFAULT 0.00,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create LIBRARY_ITEMS table (parent/superclass)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS LIBRARY_ITEMS (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
        title TEXT NOT NULL,
        item_type TEXT NOT NULL,
        description TEXT,
        publication_year INTEGER,
        cost REAL,
        library_of_congress_code TEXT,
        available BOOLEAN DEFAULT 1,
        location TEXT,
        condition TEXT,
        date_acquired DATE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create BOOKS table (subclass of LIBRARY_ITEMS)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS BOOKS (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
        author TEXT,
        publisher TEXT,
        genre TEXT,
        cover_image_url TEXT,
        number_of_pages INTEGER,
        isbn TEXT,
        library_item_id TEXT NOT NULL,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
      )
    `);

    // Create VIDEOS table (subclass of LIBRARY_ITEMS)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS VIDEOS (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
        director TEXT,
        studio TEXT,
        genre TEXT,
        cover_image_url TEXT,
        duration_minutes INTEGER,
        format TEXT,
        rating TEXT,
        isbn TEXT,
        library_item_id TEXT NOT NULL,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
      )
    `);

    // Create AUDIOBOOKS table (subclass of LIBRARY_ITEMS)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS AUDIOBOOKS (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
        narrator TEXT,
        publisher TEXT,
        genre TEXT,
        cover_image_url TEXT,
        duration_minutes INTEGER,
        format TEXT,
        isbn TEXT,
        library_item_id TEXT NOT NULL,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
      )
    `);

    // Create LIBRARY_ITEM_COPIES table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS LIBRARY_ITEM_COPIES (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
        library_item_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        condition TEXT,
        status TEXT DEFAULT 'available',
        cost REAL,
        location TEXT,
        notes TEXT,
        date_acquired DATE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES BRANCHES(id) ON DELETE CASCADE
      )
    `);

    // Create TRANSACTIONS table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS TRANSACTIONS (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
        copy_id TEXT,
        patron_id TEXT,
        transaction_type TEXT,
        checkout_date TEXT,
        due_date TEXT,
        return_date TEXT,
        fine_amount REAL,
        status TEXT,
        notes TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT,
        FOREIGN KEY(copy_id) REFERENCES LIBRARY_ITEM_COPIES(id) ON DELETE SET NULL,
        FOREIGN KEY(patron_id) REFERENCES PATRONS(id) ON DELETE SET NULL
      )
    `);

    // Create RESERVATIONS table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS RESERVATIONS (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
        library_item_id TEXT,
        patron_id TEXT,
        reservation_date TEXT,
        expiry_date TEXT,
        status TEXT,
        queue_position INTEGER,
        notification_sent TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT,
        FOREIGN KEY(library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE SET NULL,
        FOREIGN KEY(patron_id) REFERENCES PATRONS(id) ON DELETE SET NULL
      )
    `);

    // Create FINES table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS FINES (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
        transaction_id TEXT NOT NULL,
        patron_id TEXT NOT NULL,
        amount REAL NOT NULL,
        reason TEXT,
        is_paid BOOLEAN DEFAULT 0,
        paid_date DATE,
        payment_method TEXT,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(id) ON DELETE CASCADE,
        FOREIGN KEY (patron_id) REFERENCES PATRONS(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_library_items_type ON LIBRARY_ITEMS(item_type);
      CREATE INDEX IF NOT EXISTS idx_library_items_year ON LIBRARY_ITEMS(publication_year);
      CREATE INDEX IF NOT EXISTS idx_library_item_copies_status ON LIBRARY_ITEM_COPIES(status);
      CREATE INDEX IF NOT EXISTS idx_library_item_copies_branch ON LIBRARY_ITEM_COPIES(branch_id);
      CREATE INDEX IF NOT EXISTS idx_patrons_email ON PATRONS(email);
      CREATE INDEX IF NOT EXISTS idx_patrons_name ON PATRONS(last_name, first_name);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON TRANSACTIONS(status);
      CREATE INDEX IF NOT EXISTS idx_reservations_status ON RESERVATIONS(status);
      CREATE INDEX IF NOT EXISTS idx_fines_patron ON FINES(patron_id);
      CREATE INDEX IF NOT EXISTS idx_fines_paid ON FINES(is_paid);
    `);

    // Insert default branch if none exists
    await db.run(`
      INSERT OR IGNORE INTO BRANCHES (id, branch_name, is_main) 
      SELECT '1', 'Main Library', 1
      WHERE NOT EXISTS (SELECT 1 FROM BRANCHES WHERE is_main = 1)
    `);

    // Create update triggers
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_library_items_timestamp 
          AFTER UPDATE ON LIBRARY_ITEMS
      BEGIN
          UPDATE LIBRARY_ITEMS SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_library_item_copies_timestamp 
          AFTER UPDATE ON LIBRARY_ITEM_COPIES
      BEGIN
          UPDATE LIBRARY_ITEM_COPIES SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_reservations_timestamp 
          AFTER UPDATE ON RESERVATIONS
      BEGIN
          UPDATE RESERVATIONS SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp 
          AFTER UPDATE ON TRANSACTIONS
      BEGIN
          UPDATE TRANSACTIONS SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error.message);
    throw error;
  }
};

// Get database instance
const get_database = async () => {
  if (!db) {
    await init_database();
  }
  return db;
};

// Initialize database connection
init_database();

// Generic query function with error handling
const execute_query = async (query, params = []) => {
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
};

// Generic function to get all records from a table
const get_all = async (table_name, conditions = '') => {
  const query = `SELECT * FROM ${table_name} ${conditions}`;
  return await execute_query(query);
};

// Generic function to get a record by ID
const get_by_id = async (table_name, id) => {
  const query = `SELECT * FROM ${table_name} WHERE id = ?`;
  const results = await execute_query(query, [id]);
  return results[0] || null;
};

// Generic function to create a new record
const create_record = async (table_name, data) => {
  const fields = Object.keys(data).join(', ');
  const placeholders = Object.keys(data)
    .map(() => '?')
    .join(', ');
  const values = Object.values(data);

  const query = `INSERT INTO ${table_name} (${fields}) VALUES (${placeholders})`;
  const result = await execute_query(query, values);
  return result.lastID;
};

// Generic function to update a record
const update_record = async (table_name, id, data) => {
  const fields = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(', ');
  const values = [...Object.values(data), id];

  const query = `UPDATE ${table_name} SET ${fields} WHERE id = ?`;
  const result = await execute_query(query, values);
  return result.changes > 0;
};

// Generic function to delete a record
const delete_record = async (table_name, id) => {
  const query = `DELETE FROM ${table_name} WHERE id = ?`;
  const result = await execute_query(query, [id]);
  return result.changes > 0;
};

module.exports = {
  db: get_database,
  execute_query,
  get_all,
  get_by_id,
  create_record,
  update_record,
  delete_record,
};