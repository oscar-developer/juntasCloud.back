-- =============================================================================
-- PERMISOS DE OSCAR_DEV
-- Ejecutar como juntas_master dentro de juntascloudv4
-- =============================================================================

GRANT CONNECT
ON DATABASE juntascloudv4
TO oscar_dev;

GRANT USAGE
ON SCHEMA public
TO oscar_dev;

-- Objetos existentes.
GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public
TO oscar_dev;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO oscar_dev;

GRANT EXECUTE
ON ALL FUNCTIONS IN SCHEMA public
TO oscar_dev;

-- Objetos futuros creados por juntas_master.
ALTER DEFAULT PRIVILEGES
FOR ROLE juntas_master
IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLES
TO oscar_dev;

ALTER DEFAULT PRIVILEGES
FOR ROLE juntas_master
IN SCHEMA public
GRANT USAGE, SELECT
ON SEQUENCES
TO oscar_dev;

ALTER DEFAULT PRIVILEGES
FOR ROLE juntas_master
IN SCHEMA public
GRANT EXECUTE
ON FUNCTIONS
TO oscar_dev;