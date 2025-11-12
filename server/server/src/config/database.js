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

    // Performance optimization PRAGMAs
    await db.exec(`
      PRAGMA journal_mode = WAL;          -- Write-Ahead Logging for better concurrency
      PRAGMA synchronous = NORMAL;        -- Balance between safety and performance
      PRAGMA cache_size = 10000;          -- 10MB cache (10000 * 1KB pages)
      PRAGMA temp_store = MEMORY;         -- Store temporary tables in memory
      PRAGMA mmap_size = 268435456;       -- 256MB memory-mapped I/O
      PRAGMA optimize;                    -- Analyze and optimize query planner
    `);

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
        card_expiration_date DATE NOT NULL DEFAULT CURRENT_DATE,
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
        current_branch_id INTEGER DEFAULT 1,
        condition TEXT DEFAULT 'Good',
        status TEXT DEFAULT 'Available',
        cost REAL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_acquired DATE,
        due_date DATE,
        checked_out_by INTEGER,
        FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE,
        FOREIGN KEY (owning_branch_id) REFERENCES BRANCHES(id) ON DELETE SET NULL,
        FOREIGN KEY (return_to_branch_id) REFERENCES BRANCHES(id) ON DELETE SET NULL,
        FOREIGN KEY (current_branch_id) REFERENCES BRANCHES(id) ON DELETE SET NULL,
        FOREIGN KEY (checked_out_by) REFERENCES PATRONS(id) ON DELETE SET NULL
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

    // Migration: Add missing columns to existing LIBRARY_ITEM_COPIES table
    // Check if columns exist and add them if they don't
    try {
      const tableInfo = await db.all('PRAGMA table_info(LIBRARY_ITEM_COPIES)');
      const columnNames = tableInfo.map(col => col.name);

      if (!columnNames.includes('checked_out_by')) {
        await db.exec('ALTER TABLE LIBRARY_ITEM_COPIES ADD COLUMN checked_out_by INTEGER REFERENCES PATRONS(id) ON DELETE SET NULL');
        console.log(pico.bgYellow(pico.bold('✓ Added checked_out_by column to LIBRARY_ITEM_COPIES')));
      }

      if (!columnNames.includes('current_branch_id')) {
        await db.exec('ALTER TABLE LIBRARY_ITEM_COPIES ADD COLUMN current_branch_id INTEGER DEFAULT 1 REFERENCES BRANCHES(id) ON DELETE SET NULL');
        console.log(pico.bgYellow(pico.bold('✓ Added current_branch_id column to LIBRARY_ITEM_COPIES')));
      }
    } catch (migrationError) {
      console.error(pico.bgYellow(pico.bold('Migration warning: ')), migrationError.message);
    }

    // Create optimized indexes for better performance
    await db.exec(`
      -- Core entity indexes
      CREATE INDEX IF NOT EXISTS idx_library_items_type ON LIBRARY_ITEMS(item_type);
      CREATE INDEX IF NOT EXISTS idx_library_items_year ON LIBRARY_ITEMS(publication_year);
      CREATE INDEX IF NOT EXISTS idx_library_items_title ON LIBRARY_ITEMS(title COLLATE NOCASE);
      
      -- Library item copies - critical for inventory management
      CREATE INDEX IF NOT EXISTS idx_library_item_copies_status ON LIBRARY_ITEM_COPIES(status);
      CREATE INDEX IF NOT EXISTS idx_library_item_copies_branch ON LIBRARY_ITEM_COPIES(owning_branch_id);
      CREATE INDEX IF NOT EXISTS idx_library_item_copies_item_id ON LIBRARY_ITEM_COPIES(library_item_id);
      CREATE INDEX IF NOT EXISTS idx_library_item_copies_composite ON LIBRARY_ITEM_COPIES(library_item_id, status, owning_branch_id);
      CREATE INDEX IF NOT EXISTS idx_library_item_copies_dates ON LIBRARY_ITEM_COPIES(date_acquired, due_date);
      CREATE INDEX IF NOT EXISTS idx_library_item_copies_checked_out_by ON LIBRARY_ITEM_COPIES(checked_out_by);
      CREATE INDEX IF NOT EXISTS idx_library_item_copies_current_branch ON LIBRARY_ITEM_COPIES(current_branch_id);
      
      -- Patron indexes for search and active status
      CREATE INDEX IF NOT EXISTS idx_patrons_name ON PATRONS(last_name, first_name);
      CREATE INDEX IF NOT EXISTS idx_patrons_email ON PATRONS(email);
      CREATE INDEX IF NOT EXISTS idx_patrons_active_balance ON PATRONS(is_active, balance);
      CREATE INDEX IF NOT EXISTS idx_patrons_card_expiry ON PATRONS(card_expiration_date) WHERE is_active = 1;
      
      -- Transaction indexes - critical for reports and active checkouts
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON TRANSACTIONS(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_patron ON TRANSACTIONS(patron_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_copy ON TRANSACTIONS(copy_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_dates ON TRANSACTIONS(checkout_date, due_date, return_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_overdue ON TRANSACTIONS(status, due_date) WHERE status = 'Active';
      CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON TRANSACTIONS(transaction_type, status);
      
      -- Reservation indexes for queue management
      CREATE INDEX IF NOT EXISTS idx_reservations_status ON RESERVATIONS(status);
      CREATE INDEX IF NOT EXISTS idx_reservations_item_queue ON RESERVATIONS(library_item_id, queue_position, status);
      CREATE INDEX IF NOT EXISTS idx_reservations_patron ON RESERVATIONS(patron_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_dates ON RESERVATIONS(reservation_date, expiry_date);
      CREATE INDEX IF NOT EXISTS idx_reservations_active ON RESERVATIONS(status, expiry_date) WHERE status IN ('pending', 'ready');
      
      -- Fine indexes for patron balance management
      CREATE INDEX IF NOT EXISTS idx_fines_patron ON FINES(patron_id);
      CREATE INDEX IF NOT EXISTS idx_fines_paid ON FINES(is_paid);
      CREATE INDEX IF NOT EXISTS idx_fines_transaction ON FINES(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_fines_unpaid_patron ON FINES(patron_id, is_paid, amount) WHERE is_paid = 0;
      
      -- Foreign key relationship indexes for better JOIN performance
      CREATE INDEX IF NOT EXISTS idx_books_library_item ON BOOKS(library_item_id);
      CREATE INDEX IF NOT EXISTS idx_videos_library_item ON VIDEOS(library_item_id);
      CREATE INDEX IF NOT EXISTS idx_audiobooks_library_item ON AUDIOBOOKS(library_item_id);
      CREATE INDEX IF NOT EXISTS idx_magazines_library_item ON MAGAZINES(library_item_id);
      CREATE INDEX IF NOT EXISTS idx_cds_library_item ON CDS(library_item_id);
      CREATE INDEX IF NOT EXISTS idx_periodicals_library_item ON PERIODICALS(library_item_id);
      CREATE INDEX IF NOT EXISTS idx_vinyl_albums_library_item ON VINYL_ALBUMS(library_item_id);
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
 * Optimized generic query function with error handling and query type detection
 * @param {string} query - The SQL query to execute
 * @param {Array} params - Parameters for the SQL query
 * @param {Object} options - Query options like timeout, prepare statements
 * @returns {Promise<Array|Object>} Query result
 */
async function execute_query(query, params = [], options = {}) {
  try {
    const database = await get_database();
    const trimmedQuery = query.trim().toLowerCase();

    // Performance: Use prepared statements for repeated queries
    if (options.prepare) {
      const stmt = await database.prepare(query);
      try {
        if (trimmedQuery.startsWith('select')) {
          return await stmt.all(params);
        } else {
          return await stmt.run(params);
        }
      } finally {
        await stmt.finalize();
      }
    }

    // Optimize based on query type
    if (trimmedQuery.startsWith('select')) {
      // For SELECT queries that might return large results
      if (options.limit && !query.toLowerCase().includes('limit')) {
        query += ` LIMIT ${options.limit}`;
      }
      return await database.all(query, params);
    } else if (trimmedQuery.startsWith('insert') && options.batch) {
      // Batch insert optimization
      return await database.exec(query);
    } else if (trimmedQuery.startsWith('with')) {
      // CTE queries (Common Table Expressions)
      return await database.all(query, params);
    } else {
      // For INSERT, UPDATE, DELETE queries
      const result = await database.run(query, params);

      // Add performance metrics for monitoring
      if (options.includeMetrics) {
        return {
          ...result,
          performance: {
            changes: result.changes,
            lastID: result.lastID,
            queryType: trimmedQuery.split(' ')[0].toUpperCase(),
          },
        };
      }

      return result;
    }
  } catch (error) {
    console.error('Database query error:', {
      query: query.substring(0, 200) + '...',
      params: params,
      error: error.message,
    });
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

/**
 * Optimized batch operations for better performance
 * @param {Array} operations - Array of {type, table, data, id} objects
 * @returns {Promise<Object>} Batch operation results
 */
async function execute_batch(operations) {
  const database = await get_database();

  try {
    await database.exec('BEGIN TRANSACTION');

    const results = [];
    let totalChanges = 0;

    for (const op of operations) {
      let result;

      switch (op.type) {
        case 'insert':
          result = await create_record(op.table, op.data);
          results.push({ type: 'insert', id: result, table: op.table });
          totalChanges++;
          break;

        case 'update':
          result = await update_record(op.table, op.id, op.data);
          results.push({
            type: 'update',
            success: result,
            table: op.table,
            id: op.id,
          });
          if (result) totalChanges++;
          break;

        case 'delete':
          result = await delete_record(op.table, op.id);
          results.push({
            type: 'delete',
            success: result,
            table: op.table,
            id: op.id,
          });
          if (result) totalChanges++;
          break;
      }
    }

    await database.exec('COMMIT');

    return {
      success: true,
      totalOperations: operations.length,
      totalChanges,
      results,
    };
  } catch (error) {
    await database.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Optimized search function with full-text search capabilities
 * @param {string} table_name - Name of the database table
 * @param {string} search_term - Term to search for
 * @param {Array} search_fields - Fields to search in
 * @param {Object} options - Search options (limit, offset, etc.)
 * @returns {Promise<Array>} Search results
 */
async function search_records(
  table_name,
  search_term,
  search_fields = [],
  options = {}
) {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  if (!search_fields.length) {
    // Fallback to basic search if no fields specified
    return get_all(table_name, `LIMIT ${limit} OFFSET ${offset}`);
  }

  // Build LIKE conditions for each field
  const conditions = search_fields
    .map((field) => `${field} LIKE ?`)
    .join(' OR ');
  const params = search_fields.map(() => `%${search_term}%`);

  const query = `
    SELECT * FROM ${table_name} 
    WHERE ${conditions}
    ORDER BY 
      CASE 
        ${search_fields.map((field) => `WHEN ${field} LIKE '${search_term}%' THEN 1`).join(' ')}
        ELSE 2 
      END,
      id
    LIMIT ${limit} OFFSET ${offset}
  `;

  return execute_query(query, params);
}

/**
 * Get database statistics for performance monitoring
 * @returns {Promise<Object>} Database statistics
 */
async function get_database_stats() {
  const database = await get_database();

  const stats = await Promise.all([
    database.get('PRAGMA database_list'),
    database.get('PRAGMA cache_size'),
    database.get('PRAGMA page_count'),
    database.get('PRAGMA page_size'),
    database.get('PRAGMA journal_mode'),
    database.all('SELECT name, sql FROM sqlite_master WHERE type="index"'),
  ]);

  return {
    database_info: stats[0],
    cache_size: stats[1],
    page_count: stats[2],
    page_size: stats[3],
    journal_mode: stats[4],
    indexes: stats[5],
    estimated_size_mb:
      (stats[2]['page_count'] * stats[3]['page_size']) / (1024 * 1024),
  };
}

export {
  get_database as db,
  execute_query,
  get_all,
  get_by_id,
  create_record,
  update_record,
  delete_record,
  execute_batch,
  search_records,
  get_database_stats,
};
