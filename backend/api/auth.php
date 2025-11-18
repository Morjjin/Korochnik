<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

include_once '../config/database.php';
include_once '../models/User.php';

session_start();

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Получаем входные данные
$input = file_get_contents("php://input");
$data = json_decode($input);

if (!$data) {
    sendJsonResponse(array("error" => "Неверный формат данных"), 400);
}

if (!isset($data->action)) {
    sendJsonResponse(array("error" => "Не указано действие"), 400);
}

$action = $data->action;

if ($action == 'register') {
    // РЕГИСТРАЦИЯ
    if (empty($data->login) || empty($data->password) || empty($data->full_name) || empty($data->phone) || empty($data->email)) {
        sendJsonResponse(array("error" => "Все поля обязательны для заполнения"), 400);
    }

    // Проверка формата логина
    if (!preg_match('/^[a-zA-Z0-9_-]{6,20}$/', $data->login)) {
        sendJsonResponse(array("error" => "Логин должен содержать 6-20 символов (латиница, цифры, -_)"), 400);
    }

    // Проверка формата пароля
    if (strlen($data->password) < 8) {
        sendJsonResponse(array("error" => "Пароль должен содержать минимум 8 символов"), 400);
    }

    // Проверка формата ФИО
    if (!preg_match('/^[а-яА-ЯёЁ\s-]+$/u', $data->full_name)) {
        sendJsonResponse(array("error" => "ФИО должно содержать только кириллицу, пробелы и дефисы"), 400);
    }

    // Проверка формата телефона
    if (!preg_match('/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/', $data->phone)) {
        sendJsonResponse(array("error" => "Телефон должен быть в формате 8(XXX)XXX-XX-XX"), 400);
    }

    // Проверка формата email
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(array("error" => "Некорректный формат email"), 400);
    }

    // Проверка существования логина
    $user->login = $data->login;
    if ($user->loginExists()) {
        sendJsonResponse(array("error" => "Пользователь с таким логином уже существует"), 400);
    }

    // Создание пользователя
    $user->login = $data->login;
    $user->password = password_hash($data->password, PASSWORD_DEFAULT);
    $user->full_name = $data->full_name;
    $user->phone = $data->phone;
    $user->email = $data->email;

    if ($user->create()) {
        // Автоматически входим после регистрации
        $user->login = $data->login;
        $user->password = $data->password; // исходный пароль для проверки
        
        if ($user->loginExists()) {
            if (password_verify($user->password, $user->password)) {
                $_SESSION['user_id'] = $user->id;
                $_SESSION['login'] = $user->login;
                $_SESSION['is_admin'] = $user->is_admin;
                
                $redirect_to = isset($data->redirect_to) ? $data->redirect_to : '';
                
                sendJsonResponse(array(
                    "success" => true,
                    "message" => "Регистрация и авторизация успешны",
                    "full_name" => $user->full_name,
                    "avatar" => $user->avatar,
                    "is_admin" => $user->is_admin,
                    "redirect_to" => $redirect_to
                ));
            }
        }
        
        sendJsonResponse(array(
            "success" => true,
            "message" => "Пользователь успешно создан",
            "redirect_to" => isset($data->redirect_to) ? $data->redirect_to : ''
        ));
    } else {
        sendJsonResponse(array("error" => "Невозможно создать пользователя"), 500);
    }

} elseif ($action == 'login') {
    // АВТОРИЗАЦИЯ
    if (empty($data->login) || empty($data->password)) {
        sendJsonResponse(array("error" => "Логин и пароль обязательны"), 400);
    }

    $user->login = $data->login;
    $user->password = $data->password;

    if ($user->loginExists()) {
        if (password_verify($user->password, $user->password)) {
            $_SESSION['user_id'] = $user->id;
            $_SESSION['login'] = $user->login;
            $_SESSION['is_admin'] = $user->is_admin;
            
            $redirect_to = isset($data->redirect_to) ? $data->redirect_to : '';
            
            sendJsonResponse(array(
                "success" => true,
                "message" => "Авторизация успешна",
                "full_name" => $user->full_name,
                "avatar" => $user->avatar,
                "is_admin" => $user->is_admin,
                "redirect_to" => $redirect_to
            ));
        } else {
            sendJsonResponse(array("error" => "Неверный пароль"), 401);
        }
    } else {
        sendJsonResponse(array("error" => "Пользователь с таким логином не найден"), 404);
    }

} elseif ($action == 'logout') {
    // ВЫХОД
    session_destroy();
    sendJsonResponse(array("success" => true, "message" => "Выход выполнен"));

} else {
    sendJsonResponse(array("error" => "Неизвестное действие"), 400);
}
?>