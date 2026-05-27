-- Agregar columna tema a la tabla registros
ALTER TABLE registros ADD COLUMN IF NOT EXISTS tema VARCHAR(200);
