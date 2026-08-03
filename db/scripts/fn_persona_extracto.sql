CREATE OR REPLACE FUNCTION fn_persona_extracto(
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

    'deuda', fn_deuda_por_persona(p_id_tenant, p_id_persona),

    'faenas', fn_faena_resumen_persona(p_id_tenant, p_id_persona),

    'asambleas', fn_asamblea_resumen_persona(p_id_tenant, p_id_persona)

  )
  INTO v_result;

  RETURN v_result;

END;
$$;