<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

include_once '../config/database.php';
include_once '../models/Course.php';

$database = new Database();
$db = $database->getConnection();
$course = new Course($db);

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Получение списка курсов с количеством заявок
    $query = "SELECT c.*, COUNT(a.id) as application_count 
              FROM courses c 
              LEFT JOIN applications a ON c.name = a.course_name 
              GROUP BY c.id 
              ORDER BY c.name";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $courses = array();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $courses[] = array(
            'id' => $row['id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'duration' => $row['duration'],
            'price' => $row['price'],
            'application_count' => (int)$row['application_count']
        );
    }
    
    sendJsonResponse($courses);

} elseif ($method == 'POST') {
    // Создание нового курса
    $input = file_get_contents("php://input");
    $data = json_decode($input);
    
    if (!$data) {
        sendJsonResponse(array("error" => "Неверный формат данных"), 400);
    }
    
    // Проверяем авторизацию администратора
    if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
        sendJsonResponse(array("error" => "Недостаточно прав"), 403);
    }
    
    // Валидация обязательных полей
    if (empty($data->name)) {
        sendJsonResponse(array("error" => "Название курса обязательно"), 400);
    }
    
    // Создаем курс
    $course->name = $data->name;
    $course->description = $data->description ?? '';
    $course->duration = $data->duration ?? '';
    $course->price = $data->price ?? 0;
    
    if ($course->create()) {
        sendJsonResponse(array(
            "message" => "Курс успешно создан",
            "course" => array(
                "id" => $course->id,
                "name" => $course->name,
                "description" => $course->description,
                "duration" => $course->duration,
                "price" => $course->price
            )
        ));
    } else {
        sendJsonResponse(array("error" => "Ошибка при создании курса"), 500);
    }

} elseif ($method == 'DELETE') {
    // Удаление курса
    // Проверяем авторизацию администратора
    if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
        sendJsonResponse(array("error" => "Недостаточно прав"), 403);
    }
    
    // Получаем ID курса из URL
    $url_parts = explode('/', $_SERVER['REQUEST_URI']);
    $course_id = end($url_parts);
    
    if (!is_numeric($course_id)) {
        sendJsonResponse(array("error" => "Неверный ID курса"), 400);
    }
    
    // Проверяем, есть ли заявки на этот курс
    $checkQuery = "SELECT COUNT(*) as application_count FROM applications WHERE course_name = (SELECT name FROM courses WHERE id = ?)";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$course_id]);
    $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['application_count'] > 0) {
        sendJsonResponse(array("error" => "Невозможно удалить курс: есть активные заявки"), 400);
    }
    
    $course->id = $course_id;
    
    if ($course->delete()) {
        sendJsonResponse(array("message" => "Курс успешно удален"));
    } else {
        sendJsonResponse(array("error" => "Ошибка при удалении курса"), 500);
    }

} else {
    sendJsonResponse(array("error" => "Метод не поддерживается"), 405);
}
?>