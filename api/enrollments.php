<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$db = get_db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = 'SELECT 
            e.id as enrollment_id,
            s.id as student_id,
            s.name as student_name,
            s.email as student_email,
            c.id as course_id,
            c.course_name,
            c.course_code,
            c.credits,
            e.enrollment_date,
            e.grade
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
        ORDER BY s.name, c.course_code';

    $results = $db->query($query);
    $data = [];
    while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
        $data[] = $row;
    }
    json_response($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $studentId = (int)($_POST['student_id'] ?? 0);
    $courseId = (int)($_POST['course_id'] ?? 0);
    $grade = $_POST['grade'] ?? '';

    $stmt = $db->prepare('INSERT INTO enrollments (student_id, course_id, grade) VALUES (:student_id, :course_id, :grade)');
    $stmt->bindValue(':student_id', $studentId, SQLITE3_INTEGER);
    $stmt->bindValue(':course_id', $courseId, SQLITE3_INTEGER);
    $stmt->bindValue(':grade', $grade, SQLITE3_TEXT);
    $stmt->execute();

    json_response(['success' => true, 'id' => $db->lastInsertRowID()], 201);
    exit;
}

json_response(['error' => 'Method Not Allowed'], 405);



