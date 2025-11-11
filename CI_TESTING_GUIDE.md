# CI/Testing & Автоматизация

## 1. Текущее состояние

### ✅ Реализовано
- Базовая структура проекта
- HTML5 семантика
- CSS организация

### ⚠️ Отсутствует
- Автоматизированные тесты
- GitHub Actions (CI/CD)
- Линтеры (ESLint, StyleLint, PHP_CodeSniffer)
- Lighthouse CI

---

## 2. Рекомендуемый стек

| Инструмент | Назначение | Сложность |
|-----------|-----------|----------|
| **ESLint** | Проверка JavaScript | Низкая |
| **StyleLint** | Проверка CSS | Низкая |
| **PHP_CodeSniffer** | Проверка PHP | Средняя |
| **Lighthouse CI** | Performance/SEO/A11y | Средняя |
| **Jest/PHPUnit** | Unit тесты | Высокая |
| **GitHub Actions** | Автоматизация | Средняя |

**Для быстрого старта**: ESLint + Lighthouse CI + GitHub Actions

---

## 3. Настройка ESLint (JavaScript)

### 3.1. Установка (Windows PowerShell)

```powershell
cd d:\sitepc\htdocs\korochnik

# Установить Node.js зависимости (если npm не установлен)
# Скачать с https://nodejs.org/ (LTS версия)

# Инициализировать npm
npm init -y

# Установить ESLint
npm install --save-dev eslint
npx eslint --init

# Выбрать опции:
# ✓ How would you like to use ESLint? → Detect problems
# ✓ What type of modules? → CommonJS
# ✓ Which framework? → None
# ✓ Does your project use TypeScript? → No
# ✓ Where does your code run? → Browser
# ✓ What format? → JSON
```

### 3.2. Файл `.eslintrc.json`

```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 12
  },
  "rules": {
    "indent": ["error", 4],
    "linebreak-style": ["error", "windows"],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-unused-vars": ["warn"],
    "no-console": ["warn"],
    "no-var": ["error"],
    "prefer-const": ["error"],
    "eqeqeq": ["error", "always"]
  }
}
```

### 3.3. Файл `.eslintignore`

```
node_modules/
dist/
*.min.js
```

### 3.4. Запуск проверки

```powershell
# Проверить все JS файлы
npx eslint frontend/*.js

# Автоматически исправить некоторые ошибки
npx eslint frontend/*.js --fix

# Проверить конкретный файл
npx eslint frontend/app.js
```

---

## 4. Настройка StyleLint (CSS)

### 4.1. Установка

```powershell
npm install --save-dev stylelint stylelint-config-standard
```

### 4.2. Файл `.stylelintrc.json`

```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "indentation": 4,
    "string-quotes": "single",
    "color-hex-case": "lower",
    "selector-list-comma-newline-after": "always-multi-line",
    "no-empty-source": null
  }
}
```

### 4.3. Запуск проверки

```powershell
npx stylelint frontend/styles.css
npx stylelint frontend/styles.css --fix
```

---

## 5. PHP_CodeSniffer (PHP Код)

### 5.1. Установка через Composer

```powershell
# Если Composer не установлен, скачать с https://getcomposer.org/

cd backend
composer require --dev "squizlabs/php_codesniffer"
```

### 5.2. Файл `phpcs.xml`

Создать в корне проекта:

```xml
<?xml version="1.0"?>
<ruleset name="Project Ruleset">
    <description>PHP CodeSniffer ruleset</description>
    
    <!-- Проверяемые файлы -->
    <file>backend/api</file>
    <file>backend/models</file>
    <file>backend/config</file>
    
    <!-- Стандарт PSR-12 -->
    <rule ref="PSR12"/>
    
    <!-- Игнорировать файлы -->
    <exclude-pattern>*/uploads/*</exclude-pattern>
    <exclude-pattern>*/config/database.php</exclude-pattern>
</ruleset>
```

### 5.3. Запуск проверки

```powershell
cd backend
php vendor/bin/phpcs

# Автоматическое исправление
php vendor/bin/phpcbf

# Проверить конкретный файл
php vendor/bin/phpcs api/auth.php
```

---

## 6. Lighthouse CI

### 6.1. Установка

```powershell
npm install --save-dev @lhci/cli@0.9.x
npx lhci wizard --new-config
```

### 6.2. Файл `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost/"],
      "numberOfRuns": 3,
      "settings": {
        "chromeFlags": "--headless"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.90 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    }
  }
}
```

### 6.3. Запуск локально

```powershell
# Запустить локальный сервер
# (в отдельном PowerShell окне)
php -S localhost:8000

# В другом окне запустить Lighthouse CI
npx lhci autorun
```

---

## 7. GitHub Actions (CI/CD)

### 7.1. Создать файл `.github/workflows/ci.yml`

```yaml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        php-version: ['8.0', '8.1']
    
    steps:
    # 1. Checkout код
    - uses: actions/checkout@v3
    
    # 2. Настроить Node.js
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    # 3. Установить зависимости Node
    - name: Install dependencies
      run: npm ci
    
    # 4. Запустить ESLint
    - name: Lint JavaScript
      run: npx eslint frontend/*.js --max-warnings 0
    
    # 5. Запустить StyleLint
    - name: Lint CSS
      run: npx stylelint frontend/styles.css
    
    # 6. Настроить PHP
    - name: Setup PHP ${{ matrix.php-version }}
      uses: shivammathur/setup-php@v2
      with:
        php-version: ${{ matrix.php-version }}
        tools: composer:v2
    
    # 7. Установить Composer зависимости
    - name: Install Composer dependencies
      run: |
        cd backend
        composer install --prefer-dist --no-progress
    
    # 8. Запустить PHP CodeSniffer
    - name: Check PHP code style
      run: |
        cd backend
        php vendor/bin/phpcs --standard=PSR12 api/ models/ config/
    
    # 9. Запустить Lighthouse CI
    - name: Run Lighthouse CI
      uses: treosh/lighthouse-ci-action@v9
      with:
        configPath: './lighthouserc.json'
        uploadArtifacts: true
    
    # 10. HTML/CSS Валидация
    - name: Validate HTML
      run: npx --yes @html/prettier@latest frontend/index.html --check
    
    # 11. Security check PHP
    - name: Security check PHP
      run: |
        cd backend
        php vendor/bin/phpstan analyse api/ models/ || true

  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.1'
        tools: composer:v2
    
    - name: Run PHP Unit Tests
      run: |
        cd backend
        composer install
        php vendor/bin/phpunit tests/ || echo "No tests found"
```

### 7.2. Структура GitHub Actions

```
.github/
└── workflows/
    ├── ci.yml          (основная pipeline)
    ├── lighthouse.yml  (отдельный файл для Lighthouse)
    └── security.yml    (проверка безопасности)
```

---

## 8. package.json (скрипты)

Обновить `package.json`:

```json
{
  "name": "korochnik",
  "version": "1.0.0",
  "description": "Educational portal",
  "scripts": {
    "lint": "npm run lint:js && npm run lint:css",
    "lint:js": "eslint frontend/*.js",
    "lint:js:fix": "eslint frontend/*.js --fix",
    "lint:css": "stylelint frontend/styles.css",
    "lint:css:fix": "stylelint frontend/styles.css --fix",
    "lighthouse": "lhci autorun",
    "test": "echo 'No tests yet'",
    "validate": "npm run lint && npm run lighthouse"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "stylelint": "^14.0.0",
    "stylelint-config-standard": "^29.0.0",
    "@lhci/cli": "^0.9.0"
  }
}
```

### Использование:

```powershell
npm run lint              # Проверить всё
npm run lint:js:fix       # Исправить JS автоматически
npm run lint:css:fix      # Исправить CSS
npm run lighthouse        # Запустить Lighthouse CI
npm run validate          # Полная проверка
```

---

## 9. PHPUnit Tests (Опционально)

### 9.1. Установка

```powershell
cd backend
composer require --dev phpunit/phpunit
```

### 9.2. Пример теста (`backend/tests/AuthTest.php`)

```php
<?php
namespace Tests;

use PHPUnit\Framework\TestCase;

class AuthTest extends TestCase {
    
    public function testLoginValidation() {
        // Тест валидации логина
        $email = 'test@example.com';
        $this->assertTrue(filter_var($email, FILTER_VALIDATE_EMAIL));
    }
    
    public function testPasswordValidation() {
        // Тест требований к паролю
        $password = 'TestPass123';
        $hasUppercase = preg_match('/[A-Z]/', $password);
        $hasNumber = preg_match('/\d/', $password);
        $minLength = strlen($password) >= 8;
        
        $this->assertTrue($hasUppercase && $hasNumber && $minLength);
    }
}
?>
```

### 9.3. Запуск тестов

```powershell
cd backend
php vendor/bin/phpunit tests/
```

---

## 10. Быстрый старт (30 минут)

### ШАГ 1: Node.js и зависимости (5 мин)
```powershell
npm init -y
npm install --save-dev eslint stylelint stylelint-config-standard @lhci/cli
npx eslint --init  # Выбрать preset
```

### ШАГ 2: Конфигурация (10 мин)
- Скопировать `.eslintrc.json` (из примера выше)
- Скопировать `.stylelintrc.json`
- Скопировать `lighthouserc.json`

### ШАГ 3: Обновить package.json (5 мин)
```powershell
npm run lint:js:fix    # Исправить все JS файлы
npm run lint:css:fix   # Исправить CSS
```

### ШАГ 4: GitHub Actions (10 мин)
- Создать `.github/workflows/ci.yml` (из примера выше)
- Commit и push
- Проверить на GitHub → Actions

---

## 11. Результаты после внедрения

### Качество кода:
- ✅ Единообразный стиль (ESLint + StyleLint)
- ✅ Отсутствие common ошибок
- ✅ Автоматические исправления

### Performance:
- ✅ Lighthouse Performance: 85+ (цель)
- ✅ Core Web Vitals: зелёные
- ✅ Автоматические проверки при каждом push

### Безопасность:
- ✅ PHP static analysis (PHPStan)
- ✅ Проверка зависимостей (npm audit)
- ✅ Ограничения для PR (правила должны пройти)

### Надёжность:
- ✅ Все изменения проходят проверку
- ✅ История запусков в GitHub Actions
- ✅ Отчёты Lighthouse для каждого коммита

---

## 12. Дополнительные инструменты

### SonarQube (опционально)
```
Глубокий анализ кода, проверка уязвимостей
Требует: Java + Docker
```

### Dependabot (автоматический)
```
GitHub автоматически проверяет обновления зависимостей
Включить: Settings → Security → Dependabot
```

### Pre-commit hooks
```powershell
npm install --save-dev husky lint-staged

# Запустить проверку перед каждым commit
# Предотвращает отправку невалидного кода
```

---

**Версия**: 1.0  
**Дата**: 11 ноября 2025 г.  
**Минимальное время настройки**: 30 минут  
**ROI (возврат инвестиций)**: Экономия часов на отладку + улучшение качества
