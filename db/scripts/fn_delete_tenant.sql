CREATE OR REPLACE FUNCTION fn_delete_tenant(
  p_id_tenant BIGINT,
  p_id_user BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_owner BOOLEAN;
BEGIN

  -- 🔐 Validar que sea OWNER
  SELECT EXISTS (
    SELECT 1
    FROM tenant_users
    WHERE id_tenant = p_id_tenant
      AND id_user = p_id_user
      AND role = 'OWNER'
      AND estado = 'ACTIVO'
  )
  INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Solo el OWNER puede eliminar el tenant';
  END IF;

  -- 🚨 ORDEN IMPORTANTE (de tablas hijas a padres)

  DELETE FROM obligacion_movimientos WHERE id_tenant = p_id_tenant;
  DELETE FROM obligacion_pagos WHERE id_tenant = p_id_tenant;
  DELETE FROM obligaciones_persona WHERE id_tenant = p_id_tenant;

  DELETE FROM credito_movimientos WHERE id_tenant = p_id_tenant;
  DELETE FROM creditos_persona WHERE id_tenant = p_id_tenant;

  DELETE FROM caja_movimientos WHERE id_tenant = p_id_tenant;
  DELETE FROM caja_categorias WHERE id_tenant = p_id_tenant;

  DELETE FROM asistencia_asamblea WHERE id_tenant = p_id_tenant;
  DELETE FROM asambleas WHERE id_tenant = p_id_tenant;

  DELETE FROM faena_participacion WHERE id_tenant = p_id_tenant;
  DELETE FROM faenas WHERE id_tenant = p_id_tenant;

  DELETE FROM junta_miembros WHERE id_tenant = p_id_tenant;
  DELETE FROM juntas_directivas WHERE id_tenant = p_id_tenant;

  DELETE FROM persona_terreno WHERE id_tenant = p_id_tenant;
  DELETE FROM bienes WHERE id_tenant = p_id_tenant;
  DELETE FROM terrenos WHERE id_tenant = p_id_tenant;

  DELETE FROM persona_condiciones WHERE id_tenant = p_id_tenant;
  DELETE FROM personas WHERE id_tenant = p_id_tenant;

  DELETE FROM tenant_invitations WHERE id_tenant = p_id_tenant;
  DELETE FROM tenant_users WHERE id_tenant = p_id_tenant;

  -- 🧨 FINAL
  DELETE FROM tenants WHERE id_tenant = p_id_tenant;

END;
$$;