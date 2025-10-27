<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$db = get_db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $results = $db->query('SELECT * FROM courses ORDER BY course_code');
    $data = [];
    while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
        $data[] = $row;
    }
    json_response($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $courseName = $_POST['course_name'] ?? '';
    $courseCode = $_POST['course_code'] ?? '';
    $credits = (int)($_POST['credits'] ?? 0);

    $stmt = $db->prepare('INSERT INTO courses (course_name, course_code, credits) VALUES (:name, :code, :credits)');
    $stmt->bindValue(':name', $courseName, SQLITE3_TEXT);
    $stmt->bindValue(':code', $courseCode, SQLITE3_TEXT);
    $stmt->bindValue(':credits', $credits, SQLITE3_INTEGER);
    $stmt->execute();

    json_response(['success' => true, 'id' => $db->lastInsertRowID()], 201);
    exit;
}

json_response(['error' => 'Method Not Allowed'], 405);



