CREATE OR REPLACE FUNCTION public.fn_persona_pagos(
  p_id_tenant BIGINT,
  p_id_persona BIGINT,
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
  v_page INT := GREATEST(COALESCE(p_page, 1), 1);
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.personas p
    WHERE p.id_tenant = p_id_tenant
      AND p.id_persona = p_id_persona
  ) THEN
    RETURN NULL;
  END IF;

  WITH pagos AS (
    SELECT
      obp.id_obligacion_pago,
      obp.id_obligacion,
      obp.id_movimiento,
      obp.monto_aplicado,
      cm.fecha,
      cm.monto AS monto_movimiento,
      cm.medio_pago,
      cm.descripcion,
      cm.doc_referencia,
      cm.observaciones,
      cm.anulado,
      op.id_faena,
      op.id_asamblea,
      cc.id_concepto_cobro,
      cc.cod_concepto_cobro,
      cc.nombre AS concepto,
      cc.tipo AS tipo_concepto
    FROM public.obligacion_pagos obp
    JOIN public.obligaciones_persona op
      ON op.id_tenant = obp.id_tenant
     AND op.id_obligacion = obp.id_obligacion
    JOIN public.caja_movimientos cm
      ON cm.id_tenant = obp.id_tenant
     AND cm.id_movimiento = obp.id_movimiento
    JOIN public.conceptos_cobro cc
      ON cc.id_tenant = op.id_tenant
     AND cc.id_concepto_cobro = op.id_concepto_cobro
    WHERE op.id_tenant = p_id_tenant
      AND op.id_persona = p_id_persona
  ),
  total AS (
    SELECT COUNT(*)::INT AS total FROM pagos
  ),
  pagina AS (
    SELECT p.*
    FROM pagos p
    ORDER BY p.fecha DESC, p.id_obligacion_pago DESC
    OFFSET (v_page - 1) * v_limit
    LIMIT v_limit
  )
  SELECT jsonb_build_object(
    'items', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'idObligacionPago', p.id_obligacion_pago,
          'idObligacion', p.id_obligacion,
          'idMovimiento', p.id_movimiento,
          'fecha', p.fecha,
          'importe', p.monto_aplicado,
          'montoMovimiento', p.monto_movimiento,
          'idConceptoCobro', p.id_concepto_cobro,
          'codigoConcepto', p.cod_concepto_cobro,
          'concepto', p.concepto,
          'tipoConcepto', p.tipo_concepto,
          'medioPago', p.medio_pago,
          'referencia', p.doc_referencia,
          'descripcion', p.descripcion,
          'observaciones', p.observaciones,
          'estado', CASE WHEN p.anulado THEN 'ANULADO' ELSE 'REGISTRADO' END,
          'anulado', p.anulado,
          'tipoEvento', CASE
            WHEN p.id_faena IS NOT NULL THEN 'FAENA'
            WHEN p.id_asamblea IS NOT NULL THEN 'ASAMBLEA'
            ELSE NULL
          END,
          'idEvento', COALESCE(p.id_faena, p.id_asamblea)
        )
        ORDER BY p.fecha DESC, p.id_obligacion_pago DESC
      ) FILTER (WHERE p.id_obligacion_pago IS NOT NULL),
      '[]'::JSONB
    ),
    'total', t.total,
    'page', v_page,
    'limit', v_limit
  )
  INTO v_result
  FROM total t
  LEFT JOIN pagina p ON TRUE
  GROUP BY t.total;

  RETURN v_result;
END;
$$;
