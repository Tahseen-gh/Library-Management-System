<?php
// Lightweight DB module for SQLite with schema creation and seeding

declare(strict_types=1);

function get_db(): SQLite3 {
    static $db = null;
    if ($db instanceof SQLite3) {
        return $db;
    }

    $db = new SQLite3(__DIR__ . '/school.db');

    // Ensure tables exist
    $db->exec('CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )');

    $db->exec('CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT NOT NULL,
        course_code TEXT NOT NULL,
        credits INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )');

    $db->exec('CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        grade TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
    )');

    // Seed once if empty
    $studentCount = (int)$db->querySingle('SELECT COUNT(*) FROM students');
    if ($studentCount === 0) {
        $db->exec("INSERT INTO students (name, email) VALUES 
            ('Alice Johnson', 'alice@email.com'),
            ('Bob Smith', 'bob@email.com'),
            ('Carol Davis', 'carol@email.com')");

        $db->exec("INSERT INTO courses (course_name, course_code, credits) VALUES 
            ('Introduction to Programming', 'CS101', 3),
            ('Database Systems', 'CS202', 4),
            ('Web Development', 'CS305', 3),
            ('Data Structures', 'CS201', 4)");

        $db->exec("INSERT INTO enrollments (student_id, course_id, grade) VALUES 
            (1, 1, 'A'),
            (1, 2, 'B+'),
            (2, 1, 'A-'),
            (2, 3, 'B'),
            (3, 2, 'A'),
            (3, 3, 'A-')");
    }

    return $db;
}

function json_response($data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
}



