-- Database Schema for Korochnik Portal
-- Схема базы данных для портала Корочки.есть

-- Create database
CREATE DATABASE IF NOT EXISTS korochnik CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE korochnik;

-- Table: users (Пользователи)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_login (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: courses (Курсы)
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    duration VARCHAR(50),
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: applications (Заявки)
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Новая',
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default courses (Модуль 2: три обязательных курса + 20 дополнительных)
INSERT INTO courses (name, description, duration, price) VALUES
('Основы алгоритмизации и программирования', 
 'Курс по основам алгоритмизации и программирования. Изучение базовых концепций программирования, структур данных и алгоритмов.',
 '40 часов', 15000.00),
('Основы веб-дизайна', 
 'Курс по основам веб-дизайна. Изучение принципов дизайна, работы с цветом, типографикой и композицией для веб-сайтов.',
 '36 часов', 12000.00),
('Основы проектирования баз данных', 
 'Курс по основам проектирования баз данных. Изучение нормализации, проектирования схем БД, SQL и работы с СУБД.',
 '32 часа', 13000.00),
('JavaScript для начинающих', 
 'Изучение основ JavaScript: переменные, функции, объекты, DOM-манипуляции и асинхронное программирование.',
 '48 часов', 18000.00),
('Python: от основ к продвинутому уровню', 
 'Комплексный курс по Python: синтаксис, ООП, работа с библиотеками, веб-разработка и анализ данных.',
 '60 часов', 25000.00),
('React и современная фронтенд-разработка', 
 'Изучение React, компонентной архитектуры, хуков, роутинга и управления состоянием приложений.',
 '56 часов', 22000.00),
('Node.js и серверная разработка', 
 'Создание серверных приложений на Node.js, работа с Express, базами данных и API.',
 '52 часа', 20000.00),
('Мобильная разработка на Android', 
 'Разработка мобильных приложений для Android: Java/Kotlin, UI/UX, работа с API и публикация в Google Play.',
 '72 часа', 30000.00),
('iOS разработка на Swift', 
 'Создание приложений для iOS: Swift, Xcode, UIKit, SwiftUI и публикация в App Store.',
 '68 часов', 32000.00),
('DevOps и CI/CD', 
 'Изучение DevOps практик: Docker, Kubernetes, Jenkins, автоматизация развертывания и мониторинг.',
 '64 часа', 28000.00),
('Машинное обучение и Data Science', 
 'Основы машинного обучения, работа с данными, нейронные сети и практические проекты.',
 '80 часов', 35000.00),
('Кибербезопасность и этичный хакинг', 
 'Защита информационных систем, анализ уязвимостей, криптография и практическая безопасность.',
 '70 часов', 33000.00),
('UI/UX дизайн', 
 'Проектирование пользовательских интерфейсов, UX-исследования, прототипирование и тестирование.',
 '54 часа', 24000.00),
('Графический дизайн в Adobe Photoshop', 
 'Профессиональная работа с Photoshop: ретушь, композиция, цветокоррекция и создание графики.',
 '42 часа', 19000.00),
('3D моделирование и визуализация', 
 'Создание 3D моделей, текстурирование, освещение и рендеринг в Blender и 3ds Max.',
 '66 часов', 31000.00),
('SMM и продвижение в социальных сетях', 
 'Стратегии продвижения в соцсетях, контент-маркетинг, аналитика и работа с аудиторией.',
 '38 часов', 16000.00),
('SEO оптимизация и продвижение сайтов', 
 'Техническая и контентная оптимизация, работа с поисковыми системами и аналитика.',
 '44 часа', 21000.00),
('Проектный менеджмент в IT', 
 'Управление IT-проектами: методологии, планирование, команды и контроль качества.',
 '50 часов', 23000.00),
('Тестирование программного обеспечения', 
 'Виды тестирования, автоматизация, написание тест-кейсов и работа с инструментами QA.',
 '46 часов', 20000.00),
('Blockchain и криптовалюты', 
 'Основы блокчейна, смарт-контракты, разработка децентрализованных приложений (DApps).',
 '58 часов', 27000.00),
('Веб-разработка на PHP', 
 'Серверная разработка на PHP: синтаксис, ООП, работа с базами данных и фреймворками.',
 '48 часов', 18000.00),
('Java Enterprise разработка', 
 'Корпоративная разработка на Java: Spring Framework, Hibernate, микросервисы и архитектура.',
 '70 часов', 34000.00),
('C# и разработка на .NET', 
 'Разработка приложений на C#: основы языка, .NET Framework, ASP.NET и работа с базами данных.',
 '56 часов', 26000.00),
('Go: современный язык программирования', 
 'Изучение Go: синтаксис, конкурентность, веб-разработка и создание микросервисов.',
 '40 часов', 20000.00)
ON DUPLICATE KEY UPDATE name=name;

-- Table: support_tickets (Обращения в поддержку)
CREATE TABLE IF NOT EXISTS support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('Открыт', 'В обработке', 'Решен', 'Закрыт') DEFAULT 'Открыт',
    admin_response TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

