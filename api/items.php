<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$db = get_db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $results = $db->query('SELECT * FROM items ORDER BY title');
    $data = [];
    while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
        $data[] = $row;
    }
    json_response($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $barcode = trim($_POST['barcode'] ?? '');
    $loanDuration = (int)($_POST['loan_duration_days'] ?? 0);

    $stmt = $db->prepare('INSERT INTO items (title, barcode, loan_duration_days) VALUES (:title, :barcode, :loan_duration_days)');
    $stmt->bindValue(':title', $title, SQLITE3_TEXT);
    $stmt->bindValue(':barcode', $barcode, SQLITE3_TEXT);
    $stmt->bindValue(':loan_duration_days', $loanDuration, SQLITE3_INTEGER);
    $stmt->execute();

    json_response(['success' => true, 'id' => $db->lastInsertRowID()], 201);
    exit;
}

json_response(['error' => 'Method Not Allowed'], 405);
