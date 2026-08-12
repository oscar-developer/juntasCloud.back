/*
Aplica las politicas RLS faltantes para permitir el borrado fisico de personas
desde el backend, manteniendo la misma regla administrativa usada por UPDATE.
*/

DROP POLICY IF EXISTS persona_condiciones_delete ON public.persona_condiciones;

CREATE POLICY persona_condiciones_delete
ON public.persona_condiciones
FOR DELETE
USING (
  id_tenant = public.app_current_tenant_id()
  AND public.can_admin_active_tenant(id_tenant)
);

DROP POLICY IF EXISTS personas_delete ON public.personas;

CREATE POLICY personas_delete
ON public.personas
FOR DELETE
USING (
  id_tenant = public.app_current_tenant_id()
  AND public.can_admin_active_tenant(id_tenant)
);
