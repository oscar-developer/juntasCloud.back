CREATE OR REPLACE FUNCTION public.fn_persona_obligaciones(
  p_id_tenant BIGINT,
  p_id_persona BIGINT,
  p_estado VARCHAR DEFAULT NULL,
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

  WITH filtradas AS (
    SELECT
      op.id_obligacion,
      op.fecha_emision,
      op.fecha_vencimiento,
      op.periodo,
      op.monto_original,
      op.monto_pagado,
      op.monto_exonerado,
      op.monto_compensado,
      op.saldo,
      op.estado,
      op.observaciones,
      op.id_faena,
      op.id_asamblea,
      cc.id_concepto_cobro,
      cc.cod_concepto_cobro,
      cc.nombre AS concepto,
      cc.tipo AS tipo_concepto,
      f.descripcion AS faena_nombre,
      f.fecha_programada::TIMESTAMPTZ AS faena_fecha,
      fp.id_faena_participacion,
      a.tema_principal AS asamblea_nombre,
      a.fecha_programada AS asamblea_fecha,
      aa.id_asistencia
    FROM public.obligaciones_persona op
    JOIN public.conceptos_cobro cc
      ON cc.id_tenant = op.id_tenant
     AND cc.id_concepto_cobro = op.id_concepto_cobro
    LEFT JOIN public.faenas f
      ON f.id_tenant = op.id_tenant
     AND f.id_faena = op.id_faena
    LEFT JOIN public.faena_participacion fp
      ON fp.id_tenant = op.id_tenant
     AND fp.id_faena = op.id_faena
     AND fp.id_persona = op.id_persona
     AND fp.anulado = FALSE
    LEFT JOIN public.asambleas a
      ON a.id_tenant = op.id_tenant
     AND a.id_asamblea = op.id_asamblea
    LEFT JOIN public.asistencia_asamblea aa
      ON aa.id_tenant = op.id_tenant
     AND aa.id_asamblea = op.id_asamblea
     AND aa.id_persona = op.id_persona
     AND aa.anulado = FALSE
    WHERE op.id_tenant = p_id_tenant
      AND op.id_persona = p_id_persona
      AND (p_estado IS NULL OR op.estado = p_estado)
  ),
  total AS (
    SELECT COUNT(*)::INT AS total FROM filtradas
  ),
  pagina AS (
    SELECT f.*
    FROM filtradas f
    ORDER BY f.fecha_emision DESC, f.id_obligacion DESC
    OFFSET (v_page - 1) * v_limit
    LIMIT v_limit
  )
  SELECT jsonb_build_object(
    'items', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'idObligacion', p.id_obligacion,
          'fecha', p.fecha_emision,
          'fechaEmision', p.fecha_emision,
          'fechaVencimiento', p.fecha_vencimiento,
          'periodo', p.periodo,
          'idConceptoCobro', p.id_concepto_cobro,
          'codigoConcepto', p.cod_concepto_cobro,
          'concepto', p.concepto,
          'tipoConcepto', p.tipo_concepto,
          'descripcion', p.observaciones,
          'importeOriginal', p.monto_original,
          'montoPagado', p.monto_pagado,
          'montoExonerado', p.monto_exonerado,
          'montoCompensado', p.monto_compensado,
          'saldoPendiente', p.saldo,
          'estado', p.estado,
          'origen', p.tipo_concepto,
          'tipoEvento', CASE
            WHEN p.id_faena IS NOT NULL THEN 'FAENA'
            WHEN p.id_asamblea IS NOT NULL THEN 'ASAMBLEA'
            ELSE NULL
          END,
          'idEvento', COALESCE(p.id_faena, p.id_asamblea),
          'idAsistencia', COALESCE(p.id_faena_participacion, p.id_asistencia),
          'eventoRelacionado', CASE
            WHEN p.id_faena IS NOT NULL THEN jsonb_build_object(
              'tipoEvento', 'FAENA',
              'idEvento', p.id_faena,
              'nombreEvento', p.faena_nombre,
              'fecha', p.faena_fecha,
              'idAsistencia', p.id_faena_participacion
            )
            WHEN p.id_asamblea IS NOT NULL THEN jsonb_build_object(
              'tipoEvento', 'ASAMBLEA',
              'idEvento', p.id_asamblea,
              'nombreEvento', p.asamblea_nombre,
              'fecha', p.asamblea_fecha,
              'idAsistencia', p.id_asistencia
            )
            ELSE NULL
          END
        )
        ORDER BY p.fecha_emision DESC, p.id_obligacion DESC
      ) FILTER (WHERE p.id_obligacion IS NOT NULL),
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
