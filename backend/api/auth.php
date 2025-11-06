<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';
include_once '../models/User.php';

session_start();

// Функция для отправки JSON ответа
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Функция валидации данных регистрации
function validateRegistrationData($data) {
    // Проверка наличия всех полей
    if (empty($data->login) || empty($data->password) || empty($data->full_name) || 
        empty($data->phone) || empty($data->email)) {
        return false;
    }
    
    // Валидация логина (латиница и цифры, минимум 6 символов)
    if (!preg_match('/^[a-zA-Z0-9]{6,}$/', $data->login)) {
        return false;
    }
    
    // Валидация пароля (минимум 8 символов)
    if (strlen($data->password) < 8) {
        return false;
    }
    
    // Валидация ФИО (кириллица и пробелы)
    if (!preg_match('/^[а-яА-ЯёЁ\s]+$/u', $data->full_name)) {
        return false;
    }
    
    // Валидация телефона
    if (!preg_match('/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/', $data->phone)) {
        return false;
    }
    
    // Валидация email
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    
    return true;
}

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (!$data || !isset($data->action)) {
        sendJsonResponse(array("error" => "Неверный формат данных"), 400);
    }

    switch($data->action) {
        case 'register':
            // Валидация данных
            if (!validateRegistrationData($data)) {
                sendJsonResponse(array("error" => "Неверные данные. Проверьте правильность заполнения всех полей."), 400);
            }
            
            // Проверяем, не существует ли уже пользователь с таким логином
            $user->login = $data->login;
            if ($user->loginExists()) {
                sendJsonResponse(array("error" => "Пользователь с таким логином уже существует"), 400);
            }
            
            $user->password = $data->password; // В реальном проекте хэшируйте пароль!
            $user->full_name = $data->full_name;
            $user->phone = $data->phone;
            $user->email = $data->email;

            if ($user->create()) {
                sendJsonResponse(array("message" => "Пользователь успешно зарегистрирован"), 201);
            } else {
                sendJsonResponse(array("error" => "Невозможно зарегистрировать пользователя"), 503);
            }
            break;

        case 'login':
            if (empty($data->login) || empty($data->password)) {
                sendJsonResponse(array("error" => "Неполные данные"), 400);
            }

            // Проверка администратора
            if ($data->login === 'Admin' && $data->password === 'KorokNET') {
                $_SESSION['user_id'] = 'admin';
                $_SESSION['is_admin'] = true;
                $_SESSION['full_name'] = 'Администратор';
                sendJsonResponse(array(
                    "message" => "Администратор успешно вошел",
                    "is_admin" => true,
                    "full_name" => 'Администратор'
                ));
            } else {
                $user->login = $data->login;
                $user->password = $data->password;
                
                if ($user->loginExistsWithPassword()) {
                    $_SESSION['user_id'] = $user->id;
                    $_SESSION['is_admin'] = false;
                    $_SESSION['full_name'] = $user->full_name;
                    
                    sendJsonResponse(array(
                        "message" => "Успешный вход",
                        "is_admin" => false,
                        "user_id" => $user->id,
                        "full_name" => $user->full_name,
                        "avatar" => $user->avatar
                    ));
                } else {
                    sendJsonResponse(array("error" => "Неверный логин или пароль"), 401);
                }
            }
            break;

        case 'logout':
            session_destroy();
            sendJsonResponse(array("message" => "Успешный выход"));
            break;

        default:
            sendJsonResponse(array("error" => "Неизвестное действие"), 400);
            break;
    }
} else {
    sendJsonResponse(array("error" => "Метод не поддерживается"), 405);
}
?>