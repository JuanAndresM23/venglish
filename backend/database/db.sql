-- Esquema MySQL 8 para Venglish (migrado desde Neon/PostgreSQL).
-- Uso: mysql -u root -p < backend/database/db.sql

CREATE DATABASE IF NOT EXISTS bd_venglish CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE bd_venglish;

CREATE TABLE IF NOT EXISTS courses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL,
    duration    INT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE   -- los inactivos no se ofrecen al reservar
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admins (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role_level INT NOT NULL DEFAULT 0,          -- 0 = docente, 1 = superadmin
    full_name  VARCHAR(150) NULL,
    email      VARCHAR(255) NULL,
    calendar_id TEXT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    phone        VARCHAR(50)  NULL,
    email        VARCHAR(255) NULL UNIQUE,
    student_code VARCHAR(50)  NOT NULL UNIQUE,
    password     VARCHAR(255) NULL,
    registration_date DATE NULL DEFAULT (CURRENT_DATE)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    course_id  INT  NOT NULL,
    student_id INT  NOT NULL,
    teacher_id INT  NOT NULL,
    class_date DATE NOT NULL,
    class_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    status     VARCHAR(20) NULL DEFAULT 'scheduled',
    calendar_event_id VARCHAR(255) NULL,
    reminder_24h_sent BOOLEAN NULL DEFAULT FALSE,
    reminder_1h_sent  BOOLEAN NULL DEFAULT FALSE,
    UNIQUE KEY uq_teacher_slot (teacher_id, class_date, class_time),
    KEY idx_student_date (student_id, class_date),
    CONSTRAINT fk_booking_course  FOREIGN KEY (course_id)  REFERENCES courses  (id),
    CONSTRAINT fk_booking_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_booking_teacher FOREIGN KEY (teacher_id) REFERENCES admins   (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teacher_schedules (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id   INT     NOT NULL,
    day_of_week  TINYINT NOT NULL,              -- 1 = lunes ... 7 = domingo
    start_time   TIME    NOT NULL,
    end_time     TIME    NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    KEY idx_teacher_day (teacher_id, day_of_week),
    CONSTRAINT fk_schedule_teacher FOREIGN KEY (teacher_id) REFERENCES admins (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT          NULL,
    admin_id   INT          NULL,               -- el token pertenece a un estudiante O a un admin
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME     NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_reset_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_reset_admin   FOREIGN KEY (admin_id)   REFERENCES admins   (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tipos de clase que el estudiante puede reservar.
INSERT INTO courses (course_name)
SELECT name FROM (
    SELECT 'Clase de inglés' AS name UNION ALL SELECT 'Asesoría' UNION ALL SELECT 'Primera clase'
) AS class_types
WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.course_name = class_types.name);
