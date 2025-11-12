-- Миграция: добавить колонку is_admin в users
USE korochnik;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin TINYINT(1) DEFAULT 0 AFTER avatar;