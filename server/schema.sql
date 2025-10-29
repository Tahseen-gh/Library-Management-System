-- SQLite Schema for Library Management System
-- This file can be used to initialize the SQLite database

PRAGMA foreign_keys = ON;

-- Create branches table first (referenced by other tables)
CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  branch_name TEXT NOT NULL DEFAULT 'Default Branch Name',
  address TEXT,
  phone TEXT,
  is_main BOOLEAN NOT NULL DEFAULT 0
);

-- Create catalog_items table
CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  title TEXT NOT NULL,
  item_type TEXT NOT NULL,
  description TEXT,
  publication_year INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  congress_code TEXT DEFAULT '0000-0000'
);

-- Create patrons table
CREATE TABLE IF NOT EXISTS patrons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  balance REAL NOT NULL DEFAULT 0.00,
  birthday DATE,
  card_expiration_date DATE NOT NULL DEFAULT (date('now')),
  is_active BOOLEAN NOT NULL DEFAULT 1,
  image_url TEXT
);

-- Create books table (extends catalog_items)
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  publisher TEXT,
  author TEXT NOT NULL DEFAULT '',
  genre TEXT, -- JSON string for multiple genres
  cover_img_url TEXT,
  catalog_id TEXT NOT NULL,
  number_of_pages INTEGER,
  isbn TEXT,
  FOREIGN KEY (catalog_id) REFERENCES catalog_items(id) ON DELETE CASCADE
);

-- Create item_copies table
CREATE TABLE IF NOT EXISTS item_copies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  catalog_item_id TEXT,
  branch_id INTEGER,
  condition TEXT DEFAULT 'Good',
  status TEXT DEFAULT 'Available',
  cost REAL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  location INTEGER NOT NULL DEFAULT 1,
  checked_out_by INTEGER,
  due_date DATE,
  FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (location) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (checked_out_by) REFERENCES patrons(id) ON DELETE SET NULL
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  catalog_item_id TEXT,
  patron_id INTEGER,
  reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATETIME,
  status TEXT DEFAULT 'pending',
  queue_position INTEGER,
  notification_sent DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id) ON DELETE CASCADE,
  FOREIGN KEY (patron_id) REFERENCES patrons(id) ON DELETE CASCADE
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  copy_id TEXT,
  patron_id INTEGER,
  location_id INTEGER,
  transaction_type TEXT NOT NULL,
  checkout_date DATETIME,
  due_date DATETIME,
  return_date DATETIME,
  fine_amount REAL DEFAULT 0.00,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (copy_id) REFERENCES item_copies(id) ON DELETE CASCADE,
  FOREIGN KEY (patron_id) REFERENCES patrons(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_catalog_items_type ON catalog_items(item_type);
CREATE INDEX IF NOT EXISTS idx_catalog_items_year ON catalog_items(publication_year);
CREATE INDEX IF NOT EXISTS idx_item_copies_status ON item_copies(status);
CREATE INDEX IF NOT EXISTS idx_item_copies_branch ON item_copies(branch_id);
CREATE INDEX IF NOT EXISTS idx_patrons_name ON patrons(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- Insert default branch if none exists
INSERT OR IGNORE INTO branches (id, branch_name, is_main) 
VALUES (1, 'Main Library', 1);

-- Update trigger for catalog_items
CREATE TRIGGER IF NOT EXISTS update_catalog_items_timestamp 
    AFTER UPDATE ON catalog_items
BEGIN
    UPDATE catalog_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update trigger for item_copies
CREATE TRIGGER IF NOT EXISTS update_item_copies_timestamp 
    AFTER UPDATE ON item_copies
BEGIN
    UPDATE item_copies SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update trigger for reservations
CREATE TRIGGER IF NOT EXISTS update_reservations_timestamp 
    AFTER UPDATE ON reservations
BEGIN
    UPDATE reservations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update trigger for transactions
CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp 
    AFTER UPDATE ON transactions
BEGIN
    UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;