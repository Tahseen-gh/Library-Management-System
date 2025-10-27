<?php
// Lightweight DB module for SQLite with schema creation and seeding

declare(strict_types=1);

function get_db(): SQLite3 {
    static $db = null;
    if ($db instanceof SQLite3) {
        return $db;
    }

    $db = new SQLite3(__DIR__ . '/library.db');

    // Ensure tables exist
    $db->exec('CREATE TABLE IF NOT EXISTS patrons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )');

    $db->exec('CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        barcode TEXT NOT NULL,
        loan_duration_days INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )');

    $db->exec('CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patron_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        loaned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        due_date TEXT,
        FOREIGN KEY (patron_id) REFERENCES patrons(id),
        FOREIGN KEY (item_id) REFERENCES items(id)
    )');

    // Seed once if empty
    $patronCount = (int)$db->querySingle('SELECT COUNT(*) FROM patrons');
    if ($patronCount === 0) {
        $db->exec("INSERT INTO patrons (name, email) VALUES
            ('Avery Morgan', 'avery.morgan@example.com'),
            ('Jordan Ellis', 'jordan.ellis@example.com'),
            ('Taylor Bennett', 'taylor.bennett@example.com')");

        $db->exec("INSERT INTO items (title, barcode, loan_duration_days) VALUES
            ('The Night Library', 'BK-1001', 28),
            ('City Histories Documentary', 'DVD-2001', 7),
            ('New Release Thriller', 'DVD-3005', 3),
            ('STEM Explorers: Robotics', 'BK-1042', 28)");

        $db->exec("INSERT INTO loans (patron_id, item_id, due_date) VALUES
            (1, 1, date('now', '+28 days')),
            (1, 2, date('now', '+7 days')),
            (2, 3, date('now', '+3 days')),
            (3, 4, date('now', '+28 days'))");
    }

    return $db;
}

function json_response($data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
}
