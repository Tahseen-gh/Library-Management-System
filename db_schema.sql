-- =====================================================
-- LIBRARY MANAGEMENT SYSTEM - COMPLETE SCHEMA REPLACEMENT
-- =====================================================
-- This script completely replaces the old schema with the new structure
-- WARNING: This will delete ALL existing data!
-- =====================================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- =====================================================
-- STEP 1: DROP ALL OLD TABLES (in reverse dependency order)
-- =====================================================

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS item_copies;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS patrons;
DROP TABLE IF EXISTS catalog_items;
DROP TABLE IF EXISTS branches;

-- =====================================================
-- STEP 2: CREATE NEW TABLES (in dependency order)
-- =====================================================

-- BRANCHES table (no dependencies)
CREATE TABLE BRANCHES (
    id VARCHAR(255) PRIMARY KEY,
    branch_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    is_main BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PATRONS table (no dependencies)
CREATE TABLE PATRONS (
    id VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    birthday DATE,
    card_expiration DATE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LIBRARY_ITEMS table (parent/superclass)
CREATE TABLE LIBRARY_ITEMS (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'BOOK', 'VIDEO', 'NEW_VIDEO'
    description TEXT,
    publication_year INT,
    cost DECIMAL(10, 2),
    library_of_congress_code VARCHAR(100),
    available BOOLEAN DEFAULT TRUE,
    location VARCHAR(255),
    condition VARCHAR(100),
    date_acquired DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- BOOKS table (subclass of LIBRARY_ITEMS)
CREATE TABLE BOOKS (
    id VARCHAR(255) PRIMARY KEY,
    author VARCHAR(255),
    publisher VARCHAR(255),
    genre VARCHAR(100),
    cover_image_url VARCHAR(500),
    number_of_pages INT,
    isbn VARCHAR(20),
    library_item_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
);

-- VIDEOS table (subclass of LIBRARY_ITEMS)
CREATE TABLE VIDEOS (
    id VARCHAR(255) PRIMARY KEY,
    director VARCHAR(255),
    studio VARCHAR(255),
    genre VARCHAR(100),
    cover_image_url VARCHAR(500),
    duration_minutes INT,
    format VARCHAR(50), -- 'DVD', 'Blu-ray', etc.
    rating VARCHAR(10),
    isbn VARCHAR(20),
    library_item_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
);

-- NEW_VIDEOS table (subclass of LIBRARY_ITEMS) - New movie releases with 3-day loan period
CREATE TABLE NEW_VIDEOS (
    id VARCHAR(255) PRIMARY KEY,
    director VARCHAR(255),
    studio VARCHAR(255),
    genre VARCHAR(100),
    cover_image_url VARCHAR(500),
    duration_minutes INT,
    format VARCHAR(50), -- 'DVD', 'Blu-ray', '4K', etc.
    rating VARCHAR(10),
    isbn VARCHAR(20),
    library_item_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
);

-- LIBRARY_ITEM_COPIES table
CREATE TABLE LIBRARY_ITEM_COPIES (
    id VARCHAR(255) PRIMARY KEY,
    library_item_id VARCHAR(255) NOT NULL,
    branch_id VARCHAR(255) NOT NULL,
    condition VARCHAR(100),
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'borrowed', 'reserved', 'maintenance'
    cost DECIMAL(10, 2),
    location VARCHAR(255),
    notes TEXT,
    date_acquired DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES BRANCHES(id) ON DELETE CASCADE
);

-- TRANSACTIONS table
CREATE TABLE TRANSACTIONS (
    id TEXT PRIMARY KEY,
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
);

-- RESERVATIONS table
CREATE TABLE RESERVATIONS (
    id TEXT PRIMARY KEY,
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
);

-- FINES table
CREATE TABLE FINES (
    id VARCHAR(255) PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL,
    patron_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_date DATE,
    payment_method VARCHAR(100),
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(id) ON DELETE CASCADE,
    FOREIGN KEY (patron_id) REFERENCES PATRONS(id) ON DELETE CASCADE
);

-- =====================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE (Optional but recommended)
-- =====================================================

CREATE INDEX idx_library_items_type ON LIBRARY_ITEMS(item_type);
CREATE INDEX idx_library_items_year ON LIBRARY_ITEMS(publication_year);
CREATE INDEX idx_library_item_copies_status ON LIBRARY_ITEM_COPIES(status);
CREATE INDEX idx_library_item_copies_branch ON LIBRARY_ITEM_COPIES(branch_id);
CREATE INDEX idx_patrons_email ON PATRONS(email);
CREATE INDEX idx_patrons_name ON PATRONS(last_name, first_name);
CREATE INDEX idx_transactions_status ON TRANSACTIONS(status);
CREATE INDEX idx_reservations_status ON RESERVATIONS(status);
CREATE INDEX idx_fines_patron ON FINES(patron_id);
CREATE INDEX idx_fines_paid ON FINES(is_paid);

COMMIT;

-- =====================================================
-- Schema replacement complete!
-- =====================================================