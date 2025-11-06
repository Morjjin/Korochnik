<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Course.php';

$database = new Database();
$db = $database->getConnection();
$course = new Course($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Получение списка всех курсов
    $stmt = $course->read();
    $courses_arr = array();
    
    if ($stmt->rowCount() > 0) {
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $course_item = array(
                "id" => $row['id'],
                "name" => $row['name'],
                "description" => $row['description'],
                "duration" => $row['duration'],
                "price" => $row['price']
            );
            $courses_arr[] = $course_item;
        }
        
        http_response_code(200);
        echo json_encode($courses_arr);
    } else {
        http_response_code(404);
        echo json_encode(array("error" => "Курсы не найдены"));
    }
    
} elseif ($method == 'POST') {
    // Создание нового курса (только для администратора)
    session_start();
    
    if (!isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
        http_response_code(403);
        echo json_encode(array("error" => "Доступ запрещен. Требуются права администратора"));
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->name) && !empty($data->description)) {
        $course->name = $data->name;
        $course->description = $data->description;
        $course->duration = isset($data->duration) ? $data->duration : null;
        $course->price = isset($data->price) ? $data->price : null;
        
        if ($course->create()) {
            http_response_code(201);
            echo json_encode(array("message" => "Курс успешно создан"));
        } else {
            http_response_code(503);
            echo json_encode(array("error" => "Невозможно создать курс"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("error" => "Неполные данные. Обязательные поля: name, description"));
    }
    
} elseif ($method == 'OPTIONS') {
    // Для CORS preflight
    http_response_code(200);
    
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Метод не поддерживается"));
}
?>