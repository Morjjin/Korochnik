<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Course.php';

$database = new Database();
$db = $database->getConnection();
$course = new Course($db);

// Получаем топ-3 курса по количеству заявок
$query = "
    SELECT c.*, COUNT(a.id) as application_count 
    FROM courses c 
    LEFT JOIN applications a ON c.name = a.course_name 
    GROUP BY c.id 
    ORDER BY application_count DESC, c.created_at DESC 
    LIMIT 3
";

try {
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $popular_courses = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $course_item = array(
            "id" => $row['id'],
            "name" => $row['name'],
            "description" => $row['description'],
            "duration" => $row['duration'],
            "price" => $row['price'],
            "application_count" => $row['application_count']
        );
        $popular_courses[] = $course_item;
    }
    
    echo json_encode($popular_courses);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => "Ошибка сервера: " . $e->getMessage()));
}
?>