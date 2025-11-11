# Рекомендации по безопасности Backend

## 1. Статус текущей реализации

### ✅ Уже сделано
- **PDO prepared statements** — все запросы используют PDO
- **htmlspecialchars()** — входные данные экранируются (защита от XSS)
- **Проверка сессий** — админ-операции требуют `$_SESSION['is_admin']`
- **CORS headers** — явно указаны методы и origin

### ⚠️ Требует проверки/улучшения

---

## 2. Критические пункты

### 2.1. Хеширование паролей (`backend/api/auth.php`)

**ТЕКУЩАЯ ПРОБЛЕМА**: Неясно, использует ли `password_hash()` для хранения паролей.

**Требуемое изменение**:
```php
// ВМЕСТО:
$hashed = md5($password); // ❌ НЕБЕЗОПАСНО!

// ИСПОЛЬЗУЙТЕ:
$hashed = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]); // ✅ БЕЗОПАСНО

// Проверка при входе:
if (password_verify($input_password, $stored_hash)) {
    // пароль верный
}
```

**Почему**: MD5 крахнут за минуты методом brute-force. BCRYPT защищает от этого.

---

### 2.2. CSRF-токены на формах

**ТЕКУЩАЯ ПРОБЛЕМА**: Формы регистрации/входа не имеют CSRF-токена.

**Требуемое изменение**:

В `frontend/index.html`:
```html
<form id="loginFormElement">
    <!-- Добавить скрытое поле CSRF -->
    <input type="hidden" name="csrf_token" id="csrf_token" value="">
    
    <div class="form-group">
        <label for="login">Логин</label>
        <input type="text" id="login" name="login" required>
    </div>
    ...
</form>
```

В `frontend/app.js`:
```javascript
// Получить CSRF при загрузке страницы
async function loadCsrfToken() {
    const result = await apiFetch('csrf.php');
    if (result.success) {
        document.getElementById('csrf_token').value = result.data.token;
    }
}

// При отправке формы:
const formData = {
    login: ...,
    password: ...,
    csrf_token: document.getElementById('csrf_token').value, // ← добавить
    action: 'login'
};
```

Создать `backend/api/csrf.php`:
```php
<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    echo json_encode(['token' => $_SESSION['csrf_token']]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // В auth.php проверить:
    if ($_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        http_response_code(403);
        echo json_encode(['error' => 'CSRF validation failed']);
        exit;
    }
}
?>
```

---

### 2.3. Валидация user_id в `applications.php`

**ТЕКУЩАЯ ПРОБЛЕМА**: В PATCH операции проверяется `user_id`, но нужно убедиться, что пользователь не может изменить чужую заявку.

**Требуемое изменение**:
```php
// В applications.php, PATCH метод:
if (!$_SESSION['is_admin']) {
    // Пользователь может ТОЛЬКО изменять свои заявки
    if ($row['user_id'] != $_SESSION['user_id']) {
        sendJsonResponse(array("error" => "Forbidden"), 403);
    }
}
```

**Статус**: Выглядит, что это уже сделано. ✅

---

### 2.4. Защита файлов (`backend/uploads/`)

**ТЕКУЩАЯ ПРОБЛЕМА**: Люди могут напрямую обращаться к `uploads/avatars/` и видеть список файлов.

**Требуемое изменение**: В `backend/uploads/.htaccess` добавить:
```apache
# Запретить листинг файлов
Options -Indexes

# Запретить выполнение PHP в uploads
<FilesMatch "\.php$">
    Deny from all
</FilesMatch>

# Разрешить только изображения
<FilesMatch "^\.">
    Deny from all
</FilesMatch>
```

В `backend/uploads/avatars/.htaccess`:
```apache
Options -Indexes
<FilesMatch "\.(php|js|html|css)$">
    Deny from all
</FilesMatch>
AddType image/jpeg .jpg
AddType image/png .png
```

---

### 2.5. Сессии и timeouts

**ТЕКУЩЕЕ СОСТОЯНИЕ**: Нужно проверить, есть ли timeout сессии.

**Требуемое добавление** в `backend/config/database.php` или `backend/api/auth.php`:

```php
// После session_start():
ini_set('session.gc_maxlifetime', 3600); // 1 час
ini_set('session.cookie_lifetime', 3600);
ini_set('session.cookie_httponly', true); // защита от JS-доступа
ini_set('session.cookie_secure', true); // только HTTPS (на продакшене)
session_start();

// Проверка неактивности:
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > 3600)) {
    session_destroy();
    http_response_code(401);
    echo json_encode(['error' => 'Session expired']);
    exit;
}
$_SESSION['last_activity'] = time();
```

---

### 2.6. Логирование и обработка ошибок

**ТЕКУЩАЯ ПРОБЛЕМА**: API может раскрывать внутреннюю структуру в ошибках.

**Требуемое изменение**:
```php
// ВМЕСТО:
echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);

// ИСПОЛЬЗУЙТЕ:
error_log('DB Error: ' . $e->getMessage()); // логировать на сервер
echo json_encode(['error' => 'An error occurred. Please contact support.']);
```

---

## 3. Быстрая проверка безопасности (5 минут)

### Checklist:
```
[ ] Проверить backend/api/auth.php — использует password_hash()?
[ ] Проверить .htaccess в uploads/ — запрещён листинг и PHP?
[ ] Добавить CSRF-токены на формы
[ ] Проверить session timeout в auth.php
[ ] Убедиться, что все PDO параметры bindParam/bindValue
[ ] Проверить, что XSS защита (htmlspecialchars) везде
```

---

## 4. Дополнительные рекомендации

### Rate Limiting (защита от brute-force)
```php
// В auth.php добавить:
$ip = $_SERVER['REMOTE_ADDR'];
$login_attempts_key = "login_attempts_$ip";

if (isset($_SESSION[$login_attempts_key]) && $_SESSION[$login_attempts_key] > 5) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many login attempts. Try again later.']);
    exit;
}

// После неудачной попытки:
$_SESSION[$login_attempts_key] = ($_SESSION[$login_attempts_key] ?? 0) + 1;
```

### Логирование важных действий
```php
// Создать backend/logs/security.log
// Логировать: неудачные входы, админ-действия, удаления

file_put_contents(
    __DIR__ . '/../logs/security.log',
    date('Y-m-d H:i:s') . " | Failed login: $login from " . $_SERVER['REMOTE_ADDR'] . "\n",
    FILE_APPEND
);
```

---

## 5. SQL Injection (текущий статус: SAFE ✅)

Все API используют PDO prepared statements:

**Безопасно** ✅:
```php
$stmt = $db->prepare("SELECT * FROM users WHERE login = ?");
$stmt->bindParam(1, $login);
```

**Небезопасно** ❌:
```php
// НИКОГДА НЕ ИСПОЛЬЗУЙТЕ:
$query = "SELECT * FROM users WHERE login = '$login'";
```

---

## 6. XSS Protection (текущий статус: GOOD ✅)

Используется `htmlspecialchars()`:

```php
$this->login = htmlspecialchars(strip_tags($this->login));
```

---

## 7. План внедрения

### Фаза 1 (CRITICAL — today)
- [ ] Проверить password_hash() в auth.php
- [ ] Добавить .htaccess в uploads/

### Фаза 2 (HIGH — этот день)
- [ ] CSRF-токены на формы
- [ ] Session timeout
- [ ] Rate limiting

### Фаза 3 (MEDIUM — неделя)
- [ ] Логирование безопасности
- [ ] HTTPS enforcement (на продакшене)
- [ ] Регулярная проверка логов

---

**Версия**: 1.0  
**Дата**: 11 ноября 2025 г.
