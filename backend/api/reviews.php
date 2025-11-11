<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Обработка preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
if ($limit <= 0) $limit = 5;

try {
    // Выбираем последние отзывы (feedback) из заявок, где feedback не пустой
    $query = "SELECT a.feedback, a.created_at, u.full_name, u.id as user_id, u.avatar
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
            'user_name' => $row['full_name'] ? $row['full_name'] : 'Пользователь',
            'avatar' => $row['avatar'] ? $row['avatar'] : null,
            'feedback' => $row['feedback'],
            'created_at' => $row['created_at']
        );
    }

    echo json_encode($reviews);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array('error' => 'Ошибка сервера')); 
}

?>
