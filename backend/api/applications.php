<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

include_once '../config/database.php';
include_once '../models/Application.php';

// Получаем доступ к $db для проверки заявки в PATCH методе

session_start();

// Проверяем, что скрипт вызывается через HTTP
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$application = new Application($db);

$method = $_SERVER['REQUEST_METHOD'];

// Всегда возвращаем JSON, даже при ошибках
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

if ($method == 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);
    
    if (!$data) {
        sendJsonResponse(array("error" => "Неверный формат данных"), 400);
    }

    if (empty($data->course_name) || empty($data->start_date) || empty($data->payment_method)) {
        sendJsonResponse(array("error" => "Все поля обязательны для заполнения"), 400);
    }
    
    if (!isset($_SESSION['user_id']) || $_SESSION['is_admin']) {
        sendJsonResponse(array("error" => "Необходима авторизация"), 401);
    }

    $application->user_id = $_SESSION['user_id'];
    $application->course_name = $data->course_name;
    $application->start_date = $data->start_date;
    $application->payment_method = $data->payment_method;

    if ($application->create()) {
        sendJsonResponse(array("message" => "Заявка успешно создана"), 201);
    } else {
        sendJsonResponse(array("error" => "Невозможно создать заявку"), 500);
    }
    
} elseif ($method == 'GET') {
    if (!isset($_SESSION['user_id'])) {
        sendJsonResponse(array("error" => "Необходима авторизация"), 401);
    }

    try {
        if ($_SESSION['is_admin']) {
            $stmt = $application->readAll();
        } else {
            $stmt = $application->readByUser($_SESSION['user_id']);
        }

        $applications_arr = array();
        
        if ($stmt) {
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $applications_arr[] = $row;
            }
        }
        
        sendJsonResponse($applications_arr, 200);
        
    } catch (Exception $e) {
        sendJsonResponse(array("error" => "Ошибка базы данных: " . $e->getMessage()), 500);
    }
    
} elseif ($method == 'PUT') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);
    
    if (!$data) {
        sendJsonResponse(array("error" => "Неверный формат данных"), 400);
    }

    if (!isset($_SESSION['user_id'])) {
        sendJsonResponse(array("error" => "Необходима авторизация"), 401);
    }

    if (empty($data->id) || empty($data->status)) {
        sendJsonResponse(array("error" => "Неполные данные"), 400);
    }

    // Проверяем права: админ может менять любой статус, пользователь - только на "Обучение завершено"
    if (!$_SESSION['is_admin']) {
        // Пользователь может только отметить обучение как завершенное
        if ($data->status !== 'Обучение завершено') {
            sendJsonResponse(array("error" => "Вы можете только отметить обучение как завершенное"), 403);
        }
        
        // Проверяем, что заявка принадлежит пользователю и имеет статус "Идет обучение"
        $checkQuery = "SELECT id, status, user_id FROM applications WHERE id = :id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":id", $data->id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() == 0) {
            sendJsonResponse(array("error" => "Заявка не найдена"), 404);
        }
        
        $row = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if ($row['user_id'] != $_SESSION['user_id']) {
            sendJsonResponse(array("error" => "Доступ запрещен"), 403);
        }
        
        if ($row['status'] !== 'Идет обучение') {
            sendJsonResponse(array("error" => "Можно завершить только обучение, которое уже началось"), 400);
        }
    }

    $application->id = $data->id;
    $application->status = $data->status;

    if ($application->updateStatus()) {
        sendJsonResponse(array("message" => "Статус заявки обновлен"), 200);
    } else {
        sendJsonResponse(array("error" => "Невозможно обновить статус"), 500);
    }
    
} elseif ($method == 'PATCH') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);
    
    if (!$data) {
        sendJsonResponse(array("error" => "Неверный формат данных"), 400);
    }

    if (!isset($_SESSION['user_id']) || $_SESSION['is_admin']) {
        sendJsonResponse(array("error" => "Необходима авторизация"), 401);
    }

    if (empty($data->id) || empty($data->feedback)) {
        sendJsonResponse(array("error" => "Неполные данные"), 400);
    }

    // Проверяем, что заявка принадлежит пользователю и имеет статус "Обучение завершено"
    $checkQuery = "SELECT id, status FROM applications WHERE id = :id AND user_id = :user_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":id", $data->id);
    $checkStmt->bindParam(":user_id", $_SESSION['user_id']);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() == 0) {
        sendJsonResponse(array("error" => "Заявка не найдена"), 404);
    }
    
    $row = $checkStmt->fetch(PDO::FETCH_ASSOC);
    if ($row['status'] !== 'Обучение завершено') {
        sendJsonResponse(array("error" => "Отзыв можно оставить только после завершения обучения"), 400);
    }

    $application->id = $data->id;
    $application->user_id = $_SESSION['user_id'];
    $application->feedback = $data->feedback;

    if ($application->updateFeedback()) {
        sendJsonResponse(array("message" => "Отзыв успешно добавлен"), 200);
    } else {
        sendJsonResponse(array("error" => "Невозможно добавить отзыв"), 500);
    }
    
} else {
    sendJsonResponse(array("error" => "Метод не поддерживается"), 405);
}
?>