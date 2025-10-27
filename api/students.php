<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$db = get_db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $results = $db->query('SELECT * FROM students ORDER BY name');
    $data = [];
    while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
        $data[] = $row;
    }
    json_response($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';

    $stmt = $db->prepare('INSERT INTO students (name, email) VALUES (:name, :email)');
    $stmt->bindValue(':name', $name, SQLITE3_TEXT);
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $stmt->execute();

    json_response(['success' => true, 'id' => $db->lastInsertRowID()], 201);
    exit;
}

json_response(['error' => 'Method Not Allowed'], 405);



