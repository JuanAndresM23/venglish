-- Permite desactivar estudiantes (no pueden iniciar sesión, activar su cuenta ni reservar).
-- Uso: copiar y ejecutar en el SQL Editor de Neon ANTES de desplegar master.
-- Es seguro ejecutarlo más de una vez.

ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
