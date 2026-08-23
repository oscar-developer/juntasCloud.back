CREATE OR REPLACE FUNCTION public.fn_persona_asistencias(
  p_id_tenant BIGINT,
  p_id_persona BIGINT,
  p_tipo VARCHAR DEFAULT NULL,
  p_estado VARCHAR DEFAULT NULL,
  p_anio INT DEFAULT NULL,
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

  WITH asistencias_base AS (
    SELECT
      'FAENA'::TEXT AS tipo_evento,
      f.id_faena AS id_evento,
      fp.id_faena_participacion AS id_asistencia,
      f.fecha_programada::TIMESTAMPTZ AS fecha,
      f.descripcion AS nombre_evento,
      fp.estado,
      fp.hora_llegada,
      fp.observaciones AS observacion,
      fp.multa_generada,
      fp.monto_multa
    FROM public.faena_participacion fp
    JOIN public.faenas f
      ON f.id_tenant = fp.id_tenant
     AND f.id_faena = fp.id_faena
    WHERE fp.id_tenant = p_id_tenant
      AND fp.id_persona = p_id_persona
      AND fp.anulado = FALSE

    UNION ALL

    SELECT
      'ASAMBLEA'::TEXT AS tipo_evento,
      a.id_asamblea AS id_evento,
      aa.id_asistencia,
      a.fecha_programada AS fecha,
      a.tema_principal AS nombre_evento,
      aa.estado,
      aa.hora_llegada,
      aa.observaciones AS observacion,
      FALSE AS multa_generada,
      NULL::NUMERIC(10,2) AS monto_multa
    FROM public.asistencia_asamblea aa
    JOIN public.asambleas a
      ON a.id_tenant = aa.id_tenant
     AND a.id_asamblea = aa.id_asamblea
    WHERE aa.id_tenant = p_id_tenant
      AND aa.id_persona = p_id_persona
      AND aa.anulado = FALSE
  ),
  filtradas AS (
    SELECT ab.*
    FROM asistencias_base ab
    WHERE (p_tipo IS NULL OR ab.tipo_evento = p_tipo)
      AND (p_estado IS NULL OR ab.estado = p_estado)
      AND (p_anio IS NULL OR EXTRACT(YEAR FROM ab.fecha)::INT = p_anio)
  ),
  total AS (
    SELECT COUNT(*)::INT AS total FROM filtradas
  ),
  pagina AS (
    SELECT f.*
    FROM filtradas f
    ORDER BY f.fecha DESC, f.id_evento DESC
    OFFSET (v_page - 1) * v_limit
    LIMIT v_limit
  )
  SELECT jsonb_build_object(
    'items', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'tipoEvento', p.tipo_evento,
          'idEvento', p.id_evento,
          'idAsistencia', p.id_asistencia,
          'fecha', p.fecha,
          'nombreEvento', p.nombre_evento,
          'estado', p.estado,
          'horaLlegada', p.hora_llegada,
          'observacion', p.observacion,
          'multaGenerada', p.multa_generada OR COALESCE(obl.obligaciones_count, 0) > 0,
          'montoMulta', CASE
            WHEN COALESCE(obl.obligaciones_count, 0) = 1 THEN obl.monto_original
            ELSE p.monto_multa
          END,
          'idObligacion', CASE
            WHEN COALESCE(obl.obligaciones_count, 0) = 1 THEN obl.id_obligacion
            ELSE NULL
          END,
          'estadoObligacion', CASE
            WHEN COALESCE(obl.obligaciones_count, 0) = 1 THEN obl.estado_obligacion
            ELSE NULL
          END,
          'relacionObligacionAmbigua', COALESCE(obl.obligaciones_count, 0) > 1
        )
        ORDER BY p.fecha DESC, p.id_evento DESC
      ) FILTER (WHERE p.id_evento IS NOT NULL),
      '[]'::JSONB
    ),
    'total', t.total,
    'page', v_page,
    'limit', v_limit
  )
  INTO v_result
  FROM total t
  LEFT JOIN pagina p ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::INT AS obligaciones_count,
      MIN(op.id_obligacion) AS id_obligacion,
      MIN(op.monto_original) AS monto_original,
      MIN(op.estado) AS estado_obligacion
    FROM public.obligaciones_persona op
    JOIN public.conceptos_cobro cc
      ON cc.id_tenant = op.id_tenant
     AND cc.id_concepto_cobro = op.id_concepto_cobro
    WHERE op.id_tenant = p_id_tenant
      AND op.id_persona = p_id_persona
      AND op.estado <> 'ANULADA'
      AND (
        (p.tipo_evento = 'FAENA' AND op.id_faena = p.id_evento AND cc.tipo = 'MULTA_FAENA')
        OR
        (p.tipo_evento = 'ASAMBLEA' AND op.id_asamblea = p.id_evento AND cc.tipo = 'MULTA_ASAMBLEA')
      )
  ) obl ON TRUE
  GROUP BY t.total;

  RETURN v_result;
END;
$$;
