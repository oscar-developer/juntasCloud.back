CREATE OR REPLACE FUNCTION fn_asamblea_resumen_persona(
  p_id_tenant BIGINT,
  p_id_persona BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN

  SELECT jsonb_build_object(
    'total', COUNT(*),
    'asistio', COUNT(*) FILTER (WHERE estado = 'ASISTIO'),
    'tarde', COUNT(*) FILTER (WHERE estado = 'TARDE'),
    'falto', COUNT(*) FILTER (WHERE estado = 'FALTO'),
    'justificado', COUNT(*) FILTER (WHERE estado = 'JUSTIFICADO')
  )
  INTO v_result
  FROM asistencia_asamblea
  WHERE id_tenant = p_id_tenant
    AND id_persona = p_id_persona
    AND anulado = FALSE;

  RETURN v_result;

END;
$$;