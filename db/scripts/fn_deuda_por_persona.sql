CREATE OR REPLACE FUNCTION fn_deuda_por_persona(
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
    'totalDeuda', COALESCE(SUM(saldo), 0),
    'totalPagado', COALESCE(SUM(monto_pagado), 0),
    'totalOriginal', COALESCE(SUM(monto_original), 0),
    'pendientes', COUNT(*) FILTER (WHERE estado = 'PENDIENTE'),
    'parciales', COUNT(*) FILTER (WHERE estado = 'PARCIAL'),
    'pagadas', COUNT(*) FILTER (WHERE estado = 'PAGADA')
  )
  INTO v_result
  FROM obligaciones_persona
  WHERE id_tenant = p_id_tenant
    AND id_persona = p_id_persona;

  RETURN v_result;

END;
$$;