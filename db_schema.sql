-- Standard SQL Schema for Library Management System
-- Compatible with MySQL, SQL Server, and other standard SQL databases

-- Create tables in dependency order to avoid foreign key conflicts

CREATE TABLE branches
(
    id BIGINT
    AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  branch_name VARCHAR
    (255) NOT NULL DEFAULT 'Default Branch Name',
  is_main BOOLEAN NOT NULL DEFAULT FALSE
);

    CREATE TABLE catalog_items
    (
        id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        item_type VARCHAR(100) NOT NULL,
        description TEXT,
        publication_year INT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON
        UPDATE CURRENT_TIMESTAMP,
  congress_code VARCHAR(20)
        DEFAULT '0000-0000'
);

        CREATE TABLE patrons
        (
            id BIGINT
            AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  first_name VARCHAR
            (255) NOT NULL,
  last_name VARCHAR
            (255) NOT NULL,
  balance DECIMAL
            (10,2) NOT NULL DEFAULT 0.00,
  birthday DATE,
  card_expiration_date DATE NOT NULL DEFAULT
            (CURDATE
            ())
);

            CREATE TABLE books
            (
                id BIGINT
                AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  publisher TEXT,
  author TEXT NOT NULL DEFAULT '',
  genre JSON, -- Using JSON instead of ARRAY for better compatibility
  cover_img_url TEXT,
  catalog_id VARCHAR
                (36) NOT NULL,
  number_of_pages BIGINT,
  FOREIGN KEY
                (catalog_id) REFERENCES catalog_items
                (id) ON
                DELETE CASCADE
);

                CREATE TABLE item_copies
                (
                    id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
                    catalog_item_id VARCHAR(36),
                    branch_id BIGINT,
                    condition VARCHAR(50) DEFAULT 'Good',
                    status VARCHAR(50) DEFAULT 'Available',
                    cost DECIMAL(10,2),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON
                    UPDATE CURRENT_TIMESTAMP,
  location BIGINT
                    NOT NULL DEFAULT 1,
  checked_out_by BIGINT,
  due_date DATE,
  FOREIGN KEY
                    (catalog_item_id) REFERENCES catalog_items
                    (id) ON
                    DELETE CASCADE,
  FOREIGN KEY (branch_id)
                    REFERENCES branches
                    (id) ON
                    DELETE
                    SET NULL
                    ,
  FOREIGN KEY
                    (location) REFERENCES branches
                    (id) ON
                    DELETE
                    SET NULL
                    ,
  FOREIGN KEY
                    (checked_out_by) REFERENCES patrons
                    (id) ON
                    DELETE
                    SET NULL
                    );

                    CREATE TABLE reservations
                    (
                        id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
                        catalog_item_id VARCHAR(36),
                        patron_id BIGINT,
                        reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        expiry_date TIMESTAMP,
                        status VARCHAR(50) DEFAULT 'pending',
                        queue_position INT,
                        FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id) ON DELETE CASCADE,
                        FOREIGN KEY (patron_id) REFERENCES patrons(id) ON DELETE CASCADE
                    );

                    CREATE TABLE transactions
                    (
                        id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
                        copy_id VARCHAR(36),
                        patron_id BIGINT,
                        transaction_type VARCHAR(50) NOT NULL,
                        checkout_date TIMESTAMP,
                        due_date TIMESTAMP,
                        return_date TIMESTAMP,
                        fine_amount DECIMAL(10,2) DEFAULT 0.00,
                        status VARCHAR(50) DEFAULT 'active',
                        FOREIGN KEY (copy_id) REFERENCES item_copies(id) ON DELETE CASCADE,
                        FOREIGN KEY (patron_id) REFERENCES patrons(id) ON DELETE CASCADE
                    );

                    -- Create indexes for better performance
                    CREATE INDEX idx_catalog_items_type ON catalog_items(item_type);
                    CREATE INDEX idx_catalog_items_year ON catalog_items(publication_year);
                    CREATE INDEX idx_item_copies_status ON item_copies(status);
                    CREATE INDEX idx_item_copies_branch ON item_copies(branch_id);
                    CREATE INDEX idx_patrons_name ON patrons(last_name, first_name);
                    CREATE INDEX idx_transactions_status ON transactions(status);
                    CREATE INDEX idx_reservations_status ON reservations(status);