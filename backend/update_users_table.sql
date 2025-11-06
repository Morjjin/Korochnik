-- Обновление таблицы users для добавления поля avatar
-- Если таблица уже существует, выполните этот скрипт

USE korochnik;

-- Добавляем поле avatar, если его еще нет
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) DEFAULT NULL AFTER email;

-- Добавляем поле updated_at, если его еще нет
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

