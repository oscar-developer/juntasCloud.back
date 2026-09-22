-- =============================================================================
-- PERMISOS DE JUNTAS_BACKEND
-- Ejecutar como juntas_master dentro de juntascloudv4
-- =============================================================================

GRANT CONNECT
ON DATABASE juntascloudv4
TO juntas_backend;

GRANT USAGE
ON SCHEMA public
TO juntas_backend;

-- Objetos existentes.
GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public
TO juntas_backend;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO juntas_backend;

GRANT EXECUTE
ON ALL FUNCTIONS IN SCHEMA public
TO juntas_backend;

-- Tablas sensibles: se modifican mediante funciones controladas.
REVOKE INSERT, UPDATE, DELETE
ON public.tenants,
   public.tenant_users,
   public.tenant_invitations,
   public.persona_constancias
FROM juntas_backend;

-- Catálogos globales de solo lectura.
REVOKE INSERT, UPDATE, DELETE
ON public.app_modules,
   public.caja_categorias_base,
   public.conceptos_cobro_base
FROM juntas_backend;

-- Objetos futuros creados por juntas_master.
ALTER DEFAULT PRIVILEGES
FOR ROLE juntas_master
IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLES
TO juntas_backend;

ALTER DEFAULT PRIVILEGES
FOR ROLE juntas_master
IN SCHEMA public
GRANT USAGE, SELECT
ON SEQUENCES
TO juntas_backend;

ALTER DEFAULT PRIVILEGES
FOR ROLE juntas_master
IN SCHEMA public
GRANT EXECUTE
ON FUNCTIONS
TO juntas_backend;
