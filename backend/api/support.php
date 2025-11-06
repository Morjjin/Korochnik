<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

include_once '../config/database.php';
include_once '../models/SupportTicket.php';

session_start();

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$ticket = new SupportTicket($db);

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Получение тикетов
    if (!isset($_SESSION['user_id'])) {
        sendJsonResponse(array("error" => "Необходима авторизация"), 401);
    }

    if (isset($_GET['id'])) {
        // Получение одного тикета
        $ticket->id = $_GET['id'];
        if ($ticket->readOne($ticket->id)) {
            // Проверка прав доступа
            if (!$_SESSION['is_admin'] && $ticket->user_id != $_SESSION['user_id']) {
                sendJsonResponse(array("error" => "Доступ запрещен"), 403);
            }
            
            sendJsonResponse(array(
                "id" => $ticket->id,
                "user_id" => $ticket->user_id,
                "subject" => $ticket->subject,
                "message" => $ticket->message,
                "status" => $ticket->status,
                "admin_response" => $ticket->admin_response,
                "created_at" => $ticket->created_at,
                "updated_at" => $ticket->updated_at
            ));
        } else {
            sendJsonResponse(array("error" => "Тикет не найден"), 404);
        }
    } else {
        // Получение списка тикетов
        if ($_SESSION['is_admin']) {
            // Администратор видит все тикеты
            $stmt = $ticket->readAll();
            $tickets_arr = array();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $ticket_item = array(
                    "id" => $row['id'],
                    "user_id" => $row['user_id'],
                    "user_name" => $row['full_name'],
                    "user_email" => $row['email'],
                    "subject" => $row['subject'],
                    "message" => $row['message'],
                    "status" => $row['status'],
                    "admin_response" => $row['admin_response'],
                    "created_at" => $row['created_at'],
                    "updated_at" => $row['updated_at']
                );
                $tickets_arr[] = $ticket_item;
            }
            
            sendJsonResponse($tickets_arr);
        } else {
            // Пользователь видит только свои тикеты
            $stmt = $ticket->readByUser($_SESSION['user_id']);
            $tickets_arr = array();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $ticket_item = array(
                    "id" => $row['id'],
                    "subject" => $row['subject'],
                    "message" => $row['message'],
                    "status" => $row['status'],
                    "admin_response" => $row['admin_response'],
                    "created_at" => $row['created_at'],
                    "updated_at" => $row['updated_at']
                );
                $tickets_arr[] = $ticket_item;
            }
            
            sendJsonResponse($tickets_arr);
        }
    }

} elseif ($method == 'POST') {
    // Создание нового тикета
    if (!isset($_SESSION['user_id']) || $_SESSION['is_admin']) {
        sendJsonResponse(array("error" => "Необходима авторизация пользователя"), 401);
    }

    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (!$data) {
        sendJsonResponse(array("error" => "Неверный формат данных"), 400);
    }

    if (empty($data->subject) || empty($data->message)) {
        sendJsonResponse(array("error" => "Необходимо указать тему и сообщение"), 400);
    }

    $ticket->user_id = $_SESSION['user_id'];
    $ticket->subject = $data->subject;
    $ticket->message = $data->message;

    if ($ticket->create()) {
        sendJsonResponse(array(
            "message" => "Обращение успешно создано",
            "id" => $ticket->id
        ), 201);
    } else {
        sendJsonResponse(array("error" => "Невозможно создать обращение"), 500);
    }

} elseif ($method == 'PUT') {
    // Обновление тикета (ответ администратора или изменение статуса)
    if (!isset($_SESSION['user_id'])) {
        sendJsonResponse(array("error" => "Необходима авторизация"), 401);
    }

    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (!$data || empty($data->id)) {
        sendJsonResponse(array("error" => "Неверный формат данных"), 400);
    }

    $ticket->id = $data->id;
    
    if (!$ticket->readOne($ticket->id)) {
        sendJsonResponse(array("error" => "Тикет не найден"), 404);
    }

    if ($_SESSION['is_admin']) {
        // Администратор может отвечать и менять статус
        if (isset($data->admin_response)) {
            $ticket->admin_response = $data->admin_response;
            $ticket->status = isset($data->status) ? $data->status : 'В обработке';
            if ($ticket->addResponse()) {
                sendJsonResponse(array("message" => "Ответ успешно добавлен"));
            } else {
                sendJsonResponse(array("error" => "Ошибка добавления ответа"), 500);
            }
        } elseif (isset($data->status)) {
            $ticket->status = $data->status;
            if ($ticket->updateStatus()) {
                sendJsonResponse(array("message" => "Статус успешно обновлен"));
            } else {
                sendJsonResponse(array("error" => "Ошибка обновления статуса"), 500);
            }
        } else {
            sendJsonResponse(array("error" => "Необходимо указать ответ или статус"), 400);
        }
    } else {
        // Пользователь может только просматривать свои тикеты
        if ($ticket->user_id != $_SESSION['user_id']) {
            sendJsonResponse(array("error" => "Доступ запрещен"), 403);
        }
        sendJsonResponse(array("error" => "Пользователи не могут изменять тикеты"), 403);
    }

} else {
    sendJsonResponse(array("error" => "Метод не поддерживается"), 405);
}
?>

