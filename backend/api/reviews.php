<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

include_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    try {
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 5;
        
        // Получаем отзывы из заявок
        $query = "SELECT a.id, a.feedback, a.created_at, u.full_name as user_name, u.avatar, a.course_name
                  FROM applications a 
                  LEFT JOIN users u ON a.user_id = u.id 
                  WHERE a.feedback IS NOT NULL AND a.feedback != '' 
                  ORDER BY a.created_at DESC 
                  LIMIT :limit";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $reviews = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $reviews[] = array(
                'id' => $row['id'],
                'user_name' => $row['user_name'],
                'avatar' => $row['avatar'],
                'course_name' => $row['course_name'],
                'feedback' => $row['feedback'],
                'created_at' => $row['created_at']
            );
        }
        
        sendJsonResponse($reviews);
        
    } catch (Exception $e) {
        sendJsonResponse(array("error" => "Ошибка базы данных: " . $e->getMessage()), 500);
    }
} else {
    sendJsonResponse(array("error" => "Метод не поддерживается"), 405);
}
?>