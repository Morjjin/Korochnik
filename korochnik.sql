-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1
-- Время создания: Ноя 17 2025 г., 21:58
-- Версия сервера: 10.4.32-MariaDB
-- Версия PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `korochnik`
--

-- --------------------------------------------------------

--
-- Структура таблицы `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_name` varchar(200) NOT NULL,
  `start_date` date NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `status` varchar(50) DEFAULT 'Новая',
  `feedback` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `applications`
--

INSERT INTO `applications` (`id`, `user_id`, `course_name`, `start_date`, `payment_method`, `status`, `feedback`, `created_at`, `updated_at`) VALUES
(4, 7, 'C# и разработка на .NET', '2025-11-18', 'наличными', 'Обучение завершено', 'нгорм зщвыд', '2025-11-13 21:34:18', '2025-11-13 21:37:43');

-- --------------------------------------------------------

--
-- Структура таблицы `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `application_count` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `courses`
--

INSERT INTO `courses` (`id`, `name`, `description`, `duration`, `price`, `application_count`, `created_at`) VALUES
(1, 'Основы алгоритмизации и программирования', 'Курс по основам алгоритмизации и программирования. Изучение базовых концепций программирования, структур данных и алгоритмов.', '40 часов', 15000.00, 0, '2025-11-06 20:19:12'),
(2, 'Основы веб-дизайна', 'Курс по основам веб-дизайна. Изучение принципов дизайна, работы с цветом, типографикой и композицией для веб-сайтов.', '36 часов', 12000.00, 0, '2025-11-06 20:19:12'),
(3, 'Основы проектирования баз данных', 'Курс по основам проектирования баз данных. Изучение нормализации, проектирования схем БД, SQL и работы с СУБД.', '32 часа', 13000.00, 0, '2025-11-06 20:19:12'),
(7, 'JavaScript для начинающих', 'Изучение основ JavaScript: переменные, функции, объекты, DOM-манипуляции и асинхронное программирование.', '48 часов', 18000.00, 0, '2025-11-06 21:07:35'),
(8, 'Python: от основ к продвинутому уровню', 'Комплексный курс по Python: синтаксис, ООП, работа с библиотеками, веб-разработка и анализ данных.', '60 часов', 25000.00, 0, '2025-11-06 21:07:35'),
(9, 'React и современная фронтенд-разработка', 'Изучение React, компонентной архитектуры, хуков, роутинга и управления состоянием приложений.', '56 часов', 22000.00, 0, '2025-11-06 21:07:35'),
(10, 'Node.js и серверная разработка', 'Создание серверных приложений на Node.js, работа с Express, базами данных и API.', '52 часа', 20000.00, 0, '2025-11-06 21:07:35'),
(11, 'Мобильная разработка на Android', 'Разработка мобильных приложений для Android: Java/Kotlin, UI/UX, работа с API и публикация в Google Play.', '72 часа', 30000.00, 0, '2025-11-06 21:07:35'),
(12, 'iOS разработка на Swift', 'Создание приложений для iOS: Swift, Xcode, UIKit, SwiftUI и публикация в App Store.', '68 часов', 32000.00, 0, '2025-11-06 21:07:35'),
(13, 'DevOps и CI/CD', 'Изучение DevOps практик: Docker, Kubernetes, Jenkins, автоматизация развертывания и мониторинг.', '64 часа', 28000.00, 0, '2025-11-06 21:07:35'),
(15, 'Кибербезопасность и этичный хакинг', 'Защита информационных систем, анализ уязвимостей, криптография и практическая безопасность.', '70 часов', 33000.00, 0, '2025-11-06 21:07:35'),
(16, 'UI/UX дизайн', 'Проектирование пользовательских интерфейсов, UX-исследования, прототипирование и тестирование.', '54 часа', 24000.00, 0, '2025-11-06 21:07:35'),
(17, 'Графический дизайн в Adobe Photoshop', 'Профессиональная работа с Photoshop: ретушь, композиция, цветокоррекция и создание графики.', '42 часа', 19000.00, 0, '2025-11-06 21:07:35'),
(18, '3D моделирование и визуализация', 'Создание 3D моделей, текстурирование, освещение и рендеринг в Blender и 3ds Max.', '66 часов', 31000.00, 0, '2025-11-06 21:07:35'),
(19, 'SMM и продвижение в социальных сетях', 'Стратегии продвижения в соцсетях, контент-маркетинг, аналитика и работа с аудиторией.', '38 часов', 16000.00, 0, '2025-11-06 21:07:35'),
(20, 'SEO оптимизация и продвижение сайтов', 'Техническая и контентная оптимизация, работа с поисковыми системами и аналитика.', '44 часа', 21000.00, 0, '2025-11-06 21:07:35'),
(21, 'Проектный менеджмент в IT', 'Управление IT-проектами: методологии, планирование, команды и контроль качества.', '50 часов', 23000.00, 0, '2025-11-06 21:07:35'),
(22, 'Тестирование программного обеспечения', 'Виды тестирования, автоматизация, написание тест-кейсов и работа с инструментами QA.', '46 часов', 20000.00, 0, '2025-11-06 21:07:35'),
(23, 'Blockchain и криптовалюты', 'Основы блокчейна, смарт-контракты, разработка децентрализованных приложений (DApps).', '58 часов', 27000.00, 0, '2025-11-06 21:07:35'),
(24, 'Веб-разработка на PHP', 'Серверная разработка на PHP: синтаксис, ООП, работа с базами данных и фреймворками.', '48 часов', 18000.00, 0, '2025-11-06 21:07:35'),
(25, 'Java Enterprise разработка', 'Корпоративная разработка на Java: Spring Framework, Hibernate, микросервисы и архитектура.', '70 часов', 34000.00, 0, '2025-11-06 21:07:35'),
(26, 'C# и разработка на .NET', 'Разработка приложений на C#: основы языка, .NET Framework, ASP.NET и работа с базами данных.', '56 часов', 26000.00, 0, '2025-11-06 21:07:35'),
(27, 'Go: современный язык программирования', 'Изучение Go: синтаксис, конкурентность, веб-разработка и создание микросервисов.', '40 часов', 20000.00, 0, '2025-11-06 21:07:35'),
(35, 'Машинное обучение и Data Science', 'Основы машинного обучения, работа с данными, нейронные сети и практические проекты.', '80 часов', 35000.00, 0, '2025-11-06 21:07:48'),
(42, 'Проектный менеджмент в IT', 'Управление IT-проектами: методологии, планирование, команды и контроль качества.', '50 часов', 23000.00, 0, '2025-11-06 21:07:48');

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `login` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `login`, `password`, `full_name`, `phone`, `email`, `avatar`, `is_admin`, `created_at`, `updated_at`) VALUES
(4, 'Admin', '$2y$10$zDD1TZByaHyfoeynueif7ex/vq5TcWCi4I4AvfcbU.RW21Ln5UaNq', 'Администратор', '8(000)000-00-00', 'admin@example.com', NULL, 1, '2025-11-12 15:22:47', '2025-11-12 15:22:47'),
(5, 'johnny12', '$2y$10$/DhD.h1iEKyaqTbQ3tZps.x2e6y5.TjGRQp/P3nf4Teh/S0UMfW8y', 'Просто прр', '8(908)226-38-49', 'test@mail.ru', NULL, 0, '2025-11-12 18:29:20', '2025-11-12 18:29:20'),
(6, 'johnny13', '$2y$10$s0NdkWTK/r6P8NzbgINoKOkoeBOlFTQ04XEV7dEkVwvU7XEl6Jzdq', 'Просто прр', '8(908)226-38-49', 'test@mail.ru', NULL, 0, '2025-11-12 18:35:51', '2025-11-12 18:35:51'),
(7, 'morjin', '$2y$10$dqSWoxxI7lZRrIyPTxn7Xuq0tFlRCR45POoJtI6BCpNkUNk/bpp0S', 'Александров Кирилл Витальевич', '8(908)226-38-49', 'kir.aleksandrov2006@gmail.com', 'uploads/avatars/avatar_7_1762973054.jpg', 0, '2025-11-12 18:40:10', '2025-11-12 18:44:14');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Индексы таблицы `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_name` (`name`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `login` (`login`),
  ADD KEY `idx_login` (`login`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT для таблицы `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
