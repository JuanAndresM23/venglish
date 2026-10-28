-- Reemplaza los niveles (básico, medio, avanzado...) por tipos de clase.
-- Los cursos anteriores no se borran porque las reservas existentes los referencian;
-- solo se desactivan para que ya no aparezcan al reservar.
-- Uso: mysql -u root -p bd_venglish < backend/database/migrations/001_class_types.sql

ALTER TABLE courses ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE courses SET is_active = FALSE;

INSERT INTO courses (course_name, is_active)
SELECT name, TRUE FROM (
    SELECT 'Clase de inglés' AS name UNION ALL SELECT 'Asesoría' UNION ALL SELECT 'Primera clase'
) AS class_types;
