<?php
/**
 * Отладочный скрипт для проверки админа
 * Запустите через браузер: http://localhost/korochnik/backend/api/debug_admin.php
 * 
 * ВНИМАНИЕ: После отладки удалите этот файл! Он содержит чувствительную информацию.
 */

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(['error' => 'Не удалось подключиться к БД']);
    exit(1);
}

$result = [];

// 1. Проверяем, есть ли таблица users
try {
    $check = $pdo->query("SHOW TABLES LIKE 'users'");
    $tableExists = $check->rowCount() > 0;
    $result['users_table_exists'] = $tableExists;
} catch (PDOException $e) {
    $result['error_table_check'] = $e->getMessage();
}

// 2. Получаем данные админа
try {
    $stmt = $pdo->prepare('SELECT id, login, password, full_name, is_admin FROM users WHERE login = :login LIMIT 1');
    $stmt->execute([':login' => 'Admin']);
    
    if ($stmt->rowCount() > 0) {
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        $result['admin_found'] = true;
        $result['admin_data'] = [
            'id' => $admin['id'],
            'login' => $admin['login'],
            'full_name' => $admin['full_name'],
            'is_admin' => $admin['is_admin'],
            'password_hash_first_20_chars' => substr($admin['password'], 0, 20) . '...',
            'password_hash_length' => strlen($admin['password']),
            'password_hash_starts_with_2y' => substr($admin['password'], 0, 3) === '$2y'
        ];
        
        // 3. Проверяем, работает ли password_verify
        $testPassword = 'KorokNET';
        $verifyResult = password_verify($testPassword, $admin['password']);
        $result['password_verify_result'] = $verifyResult;
        $result['password_verify_test_password'] = $testPassword;
        
        if (!$verifyResult) {
            $result['warning'] = 'password_verify вернул FALSE. Это значит, что пароль либо:
            1. Хранится не как bcrypt (не начинается с $2y$)
            2. Был повреждён/изменён
            3. Это не тот пароль, который был хеширован';
        }
    } else {
        $result['admin_found'] = false;
        $result['message'] = 'Пользователь Admin не найден в БД';
    }
} catch (PDOException $e) {
    $result['error_admin_query'] = $e->getMessage();
}

// 4. Количество всех пользователей в таблице
try {
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM users');
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    $result['total_users'] = $count['count'];
} catch (PDOException $e) {
    $result['error_count'] = $e->getMessage();
}

// 5. Список всех пользователей (только логины)
try {
    $stmt = $pdo->query('SELECT id, login, is_admin FROM users');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $result['all_users'] = $users;
} catch (PDOException $e) {
    $result['error_all_users'] = $e->getMessage();
}

http_response_code(200);
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
exit(0);
?>
