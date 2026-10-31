-- Prepara la base de datos de Neon (PostgreSQL) para la versión MVC del backend.
-- Uso: copiar y ejecutar en el SQL Editor de la consola de Neon ANTES de desplegar master.
-- Es seguro ejecutarlo más de una vez.

BEGIN;

-- Duración variable de las clases (antes siempre era 60 minutos).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration_minutes INT NOT NULL DEFAULT 60;

-- Recuperación de contraseña para administradores: el token pertenece a un estudiante O a un admin.
ALTER TABLE password_reset_tokens
    ADD COLUMN IF NOT EXISTS admin_id INT NULL REFERENCES admins (id) ON DELETE CASCADE;
ALTER TABLE password_reset_tokens ALTER COLUMN student_id DROP NOT NULL;

-- Tipos de clase en lugar de niveles. Los cursos anteriores no se borran porque las
-- reservas existentes los referencian; solo se desactivan para que no aparezcan al reservar.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE courses
SET is_active = course_name IN ('Clase de inglés', 'Asesoría', 'Primera clase');

INSERT INTO courses (course_name, is_active)
SELECT name, TRUE
FROM (VALUES ('Clase de inglés'), ('Asesoría'), ('Primera clase')) AS class_types (name)
WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.course_name = class_types.name);

COMMIT;
