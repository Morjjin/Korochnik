<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
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

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Получение данных профиля
    if (!isset($_SESSION['user_id']) || $_SESSION['is_admin']) {
        sendJsonResponse(array("error" => "Необходима авторизация"), 401);
    }

    $user->id = $_SESSION['user_id'];
    if ($user->readOne($user->id)) {
        sendJsonResponse(array(
            "id" => $user->id,
            "login" => $user->login,
            "full_name" => $user->full_name,
            "phone" => $user->phone,
            "email" => $user->email,
            "avatar" => $user->avatar
        ));
    } else {
        sendJsonResponse(array("error" => "Пользователь не найден"), 404);
    }

} elseif ($method == 'POST') {
    // Загрузка аватара
    if (!isset($_SESSION['user_id']) || $_SESSION['is_admin']) {
        sendJsonResponse(array("error" => "Необходима авторизация"), 401);
    }

    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        sendJsonResponse(array("error" => "Ошибка загрузки файла"), 400);
    }

    $file = $_FILES['avatar'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB

    if (!in_array($file['type'], $allowedTypes)) {
        sendJsonResponse(array("error" => "Недопустимый тип файла. Разрешены: JPEG, PNG, GIF, WebP"), 400);
    }

    if ($file['size'] > $maxSize) {
        sendJsonResponse(array("error" => "Файл слишком большой. Максимум 5MB"), 400);
    }

    // Создаем папку для аватаров, если её нет
    $uploadDir = __DIR__ . '/../uploads/avatars/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Генерируем уникальное имя файла
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = 'avatar_' . $_SESSION['user_id'] . '_' . time() . '.' . $extension;
    $filePath = $uploadDir . $fileName;

    // Удаляем старый аватар, если есть
    $user->id = $_SESSION['user_id'];
    if ($user->readOne($user->id) && $user->avatar) {
        $oldAvatarPath = __DIR__ . '/../uploads/avatars/' . basename($user->avatar);
        if (file_exists($oldAvatarPath)) {
            unlink($oldAvatarPath);
        }
    }

    // Сохраняем новый аватар
    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        // Сохраняем путь в БД
        $avatarUrl = 'uploads/avatars/' . $fileName;
        $user->avatar = $avatarUrl;
        if ($user->update()) {
            sendJsonResponse(array(
                "message" => "Аватар успешно загружен",
                "avatar" => $avatarUrl
            ));
        } else {
            unlink($filePath);
            sendJsonResponse(array("error" => "Ошибка сохранения в базу данных"), 500);
        }
    } else {
        sendJsonResponse(array("error" => "Ошибка сохранения файла"), 500);
    }

} elseif ($method == 'PUT') {
    // Обновление данных профиля
    if (!isset($_SESSION['user_id']) || $_SESSION['is_admin']) {
        sendJsonResponse(array("error" => "Необходима авторизация"), 401);
    }

    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (!$data) {
        sendJsonResponse(array("error" => "Неверный формат данных"), 400);
    }

    $user->id = $_SESSION['user_id'];
    
    // Валидация данных
    if (isset($data->full_name) && !preg_match('/^[а-яА-ЯёЁ\s]+$/u', $data->full_name)) {
        sendJsonResponse(array("error" => "ФИО должно содержать только кириллицу и пробелы"), 400);
    }
    
    if (isset($data->phone) && !preg_match('/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/', $data->phone)) {
        sendJsonResponse(array("error" => "Телефон должен быть в формате 8(XXX)XXX-XX-XX"), 400);
    }
    
    if (isset($data->email) && !filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(array("error" => "Некорректный формат email"), 400);
    }

    // Получаем текущие данные
    if (!$user->readOne($user->id)) {
        sendJsonResponse(array("error" => "Пользователь не найден"), 404);
    }

    // Обновляем только переданные поля
    if (isset($data->full_name)) {
        $user->full_name = $data->full_name;
    }
    if (isset($data->phone)) {
        $user->phone = $data->phone;
    }
    if (isset($data->email)) {
        $user->email = $data->email;
    }

    if ($user->update()) {
        sendJsonResponse(array(
            "message" => "Профиль успешно обновлен",
            "user" => array(
                "id" => $user->id,
                "login" => $user->login,
                "full_name" => $user->full_name,
                "phone" => $user->phone,
                "email" => $user->email,
                "avatar" => $user->avatar
            )
        ));
    } else {
        sendJsonResponse(array("error" => "Ошибка обновления профиля"), 500);
    }

} else {
    sendJsonResponse(array("error" => "Метод не поддерживается"), 405);
}
?>

