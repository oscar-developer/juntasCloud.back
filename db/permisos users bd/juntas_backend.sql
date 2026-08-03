-- Acceso a la base y al esquema.
GRANT CONNECT ON DATABASE juntascloudv4 TO juntas_backend;
GRANT USAGE ON SCHEMA public TO juntas_backend;

-- Permisos sobre tablas y secuencias existentes.
GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public
TO juntas_backend;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO juntas_backend;

-- Permite ejecutar las funciones controladas del sistema.
GRANT EXECUTE
ON ALL FUNCTIONS IN SCHEMA public
TO juntas_backend;

-- Estas tablas sensibles deben modificarse mediante funciones.
REVOKE INSERT, UPDATE, DELETE
ON public.tenants,
   public.tenant_users,
   public.tenant_invitations
FROM juntas_backend;

-- Catálogos globales: el backend solo debe consultarlos.
REVOKE INSERT, UPDATE, DELETE
ON public.app_modules,
   public.caja_categorias_base,
   public.conceptos_cobro_base
FROM juntas_backend;