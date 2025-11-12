<?php
/**
 * Скрипт для безопасного создания администратора (Admin) с паролем KorokNET.
 * Запустите один раз на локальной машине или сервере CLI:
 * php create_admin.php
 * После успешного выполнения удалите этот файл.
 */

require_once __DIR__ . '/config/database.php';

$login = 'Admin';
$passwordPlain = 'KorokNET';
$fullName = 'Администратор';

$database = new Database();
$pdo = $database->getConnection();

try {
    // Проверим, существует ли пользователь
    $stmt = $pdo->prepare('SELECT id FROM users WHERE login = :login LIMIT 1');
    $stmt->execute([':login' => $login]);
    if ($stmt->rowCount() > 0) {
        echo "Пользователь Admin уже существует.\n";
        exit(0);
    }

    $hash = password_hash($passwordPlain, PASSWORD_DEFAULT);

    $insert = $pdo->prepare('INSERT INTO users (login, password, full_name, phone, email, avatar, is_admin) VALUES (:login, :password, :full_name, :phone, :email, NULL, 1)');
    $insert->execute([
        ':login' => $login,
        ':password' => $hash,
        ':full_name' => $fullName,
        ':phone' => '8(000)000-00-00',
        ':email' => 'admin@example.com'
    ]);

    if ($insert->rowCount() > 0) {
        echo "Администратор успешно создан. Логин: Admin, пароль: KorokNET\n";
        echo "Не забудьте удалить этот скрипт после использования: backend/create_admin.php\n";
    } else {
        echo "Не удалось создать администратора.\n";
    }
} catch (PDOException $e) {
    echo "Ошибка БД: " . $e->getMessage() . "\n";
    exit(1);
}
