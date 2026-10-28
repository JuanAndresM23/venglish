-- Esquema PostgreSQL (Neon) para Venglish, para crear una base de datos desde cero.
-- Uso: ejecutar en el SQL Editor de Neon o con psql "<DATABASE_URL>" -f backend/database/db.sql
-- Para una base existente usar los scripts de database/migrations/.

CREATE TABLE IF NOT EXISTS courses (
    id          SERIAL PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL,
    duration    INT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE   -- los inactivos no se ofrecen al reservar
);

CREATE TABLE IF NOT EXISTS admins (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role_level  INT NOT NULL DEFAULT 0,         -- 0 = docente, 1 = superadmin
    full_name   VARCHAR(150) NULL,
    email       VARCHAR(255) NULL,
    calendar_id TEXT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(150) NOT NULL,
    phone             VARCHAR(50)  NULL,
    email             VARCHAR(255) NULL UNIQUE,
    student_code      VARCHAR(50)  NOT NULL UNIQUE,
    password          VARCHAR(255) NULL,
    registration_date DATE NULL DEFAULT CURRENT_DATE,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE  -- FALSE = desactivado por la academia
);

CREATE TABLE IF NOT EXISTS bookings (
    id                SERIAL PRIMARY KEY,
    course_id         INT  NOT NULL REFERENCES courses (id),
    student_id        INT  NOT NULL REFERENCES students (id),
    teacher_id        INT  NOT NULL REFERENCES admins (id),
    class_date        DATE NOT NULL,
    class_time        TIME NOT NULL,
    duration_minutes  INT  NOT NULL DEFAULT 60,
    status            VARCHAR(20) NULL DEFAULT 'scheduled',
    calendar_event_id VARCHAR(255) NULL,
    reminder_24h_sent BOOLEAN NULL DEFAULT FALSE,
    reminder_1h_sent  BOOLEAN NULL DEFAULT FALSE,
    CONSTRAINT uq_teacher_slot UNIQUE (teacher_id, class_date, class_time)
);
CREATE INDEX IF NOT EXISTS idx_student_date ON bookings (student_id, class_date);

CREATE TABLE IF NOT EXISTS teacher_schedules (
    id           SERIAL PRIMARY KEY,
    teacher_id   INT      NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
    day_of_week  SMALLINT NOT NULL,             -- 1 = lunes ... 7 = domingo
    start_time   TIME     NOT NULL,
    end_time     TIME     NOT NULL,
    is_available BOOLEAN  NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_teacher_day ON teacher_schedules (teacher_id, day_of_week);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         SERIAL PRIMARY KEY,
    student_id INT          NULL REFERENCES students (id) ON DELETE CASCADE,
    admin_id   INT          NULL REFERENCES admins (id) ON DELETE CASCADE,  -- estudiante O admin
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE
);

-- Tipos de clase que el estudiante puede reservar.
INSERT INTO courses (course_name)
SELECT name
FROM (VALUES ('Clase de inglés'), ('Asesoría'), ('Primera clase')) AS class_types (name)
WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.course_name = class_types.name);
