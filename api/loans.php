<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$db = get_db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = 'SELECT
            l.id AS loan_id,
            l.patron_id,
            l.item_id,
            l.due_date,
            l.loaned_at,
            p.name AS patron_name,
            p.email AS patron_email,
            i.title AS item_title,
            i.barcode AS item_barcode,
            i.loan_duration_days
        FROM loans l
        JOIN patrons p ON l.patron_id = p.id
        JOIN items i ON l.item_id = i.id
        ORDER BY p.name, i.barcode';

    $results = $db->query($query);
    $data = [];
    while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
        $data[] = $row;
    }
    json_response($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $patronId = (int)($_POST['patron_id'] ?? 0);
    $itemId = (int)($_POST['item_id'] ?? 0);
    $dueDate = trim($_POST['due_date'] ?? '');

    $stmt = $db->prepare('INSERT INTO loans (patron_id, item_id, due_date) VALUES (:patron_id, :item_id, :due_date)');
    $stmt->bindValue(':patron_id', $patronId, SQLITE3_INTEGER);
    $stmt->bindValue(':item_id', $itemId, SQLITE3_INTEGER);
    $stmt->bindValue(':due_date', $dueDate, SQLITE3_TEXT);
    $stmt->execute();

    json_response(['success' => true, 'id' => $db->lastInsertRowID()], 201);
    exit;
}

json_response(['error' => 'Method Not Allowed'], 405);
