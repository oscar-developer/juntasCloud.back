CREATE OR REPLACE FUNCTION public.fn_persona_ficha(
  p_id_tenant BIGINT,
  p_id_persona BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.personas p
    WHERE p.id_tenant = p_id_tenant
      AND p.id_persona = p_id_persona
  ) THEN
    RETURN NULL;
  END IF;

  WITH persona_data AS (
    SELECT
      p.id_persona,
      p.nro_padron,
      p.nombres,
      p.apellido_paterno,
      p.apellido_materno,
      p.dni,
      p.telefono,
      p.estado
    FROM public.personas p
    WHERE p.id_tenant = p_id_tenant
      AND p.id_persona = p_id_persona
  ),
  deuda AS (
    SELECT COALESCE(SUM(op.saldo) FILTER (
      WHERE op.estado IN ('PENDIENTE', 'PARCIAL')
    ), 0)::NUMERIC(10,2) AS deuda_pendiente_total
    FROM public.obligaciones_persona op
    WHERE op.id_tenant = p_id_tenant
      AND op.id_persona = p_id_persona
  ),
  faenas_resumen AS (
    SELECT
      COUNT(*)::INT AS total,
      COUNT(*) FILTER (WHERE fp.estado = 'ASISTIO')::INT AS asistencias,
      COUNT(*) FILTER (WHERE fp.estado = 'FALTO')::INT AS faltas,
      COUNT(*) FILTER (WHERE fp.estado = 'TARDE')::INT AS tardanzas
    FROM public.faena_participacion fp
    WHERE fp.id_tenant = p_id_tenant
      AND fp.id_persona = p_id_persona
      AND fp.anulado = FALSE
  ),
  asambleas_resumen AS (
    SELECT
      COUNT(*)::INT AS total,
      COUNT(*) FILTER (WHERE aa.estado = 'ASISTIO')::INT AS asistencias,
      COUNT(*) FILTER (WHERE aa.estado = 'FALTO')::INT AS faltas,
      COUNT(*) FILTER (WHERE aa.estado = 'TARDE')::INT AS tardanzas
    FROM public.asistencia_asamblea aa
    WHERE aa.id_tenant = p_id_tenant
      AND aa.id_persona = p_id_persona
      AND aa.anulado = FALSE
  ),
  eventos_base AS (
    SELECT
      'FAENA'::TEXT AS tipo_evento,
      f.id_faena AS id_evento,
      fp.id_faena_participacion AS id_asistencia,
      f.fecha_programada::TIMESTAMPTZ AS fecha,
      f.descripcion AS nombre_evento,
      fp.estado,
      fp.hora_llegada,
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
  ultimos_eventos AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'tipo', e.tipo_evento,
          'idEvento', e.id_evento,
          'idAsistencia', e.id_asistencia,
          'fecha', e.fecha,
          'nombreEvento', e.nombre_evento,
          'estadoAsistencia', e.estado,
          'horaLlegada', e.hora_llegada,
          'generoObligacion', COALESCE(obl.obligaciones_count, 0) > 0,
          'multaGenerada', e.multa_generada OR COALESCE(obl.obligaciones_count, 0) > 0,
          'montoRelacionado', CASE
            WHEN COALESCE(obl.obligaciones_count, 0) = 1 THEN obl.monto_original
            ELSE e.monto_multa
          END,
          'idObligacion', CASE
            WHEN COALESCE(obl.obligaciones_count, 0) = 1 THEN obl.id_obligacion
            ELSE NULL
          END,
          'relacionObligacionAmbigua', COALESCE(obl.obligaciones_count, 0) > 1
        )
        ORDER BY e.fecha DESC, e.id_evento DESC
      ),
      '[]'::JSONB
    ) AS eventos
    FROM (
      SELECT *
      FROM eventos_base
      ORDER BY fecha DESC, id_evento DESC
      LIMIT 5
    ) e
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::INT AS obligaciones_count,
        MIN(op.id_obligacion) AS id_obligacion,
        MIN(op.monto_original) AS monto_original
      FROM public.obligaciones_persona op
      JOIN public.conceptos_cobro cc
        ON cc.id_tenant = op.id_tenant
       AND cc.id_concepto_cobro = op.id_concepto_cobro
      WHERE op.id_tenant = p_id_tenant
        AND op.id_persona = p_id_persona
        AND op.estado <> 'ANULADA'
        AND (
          (e.tipo_evento = 'FAENA' AND op.id_faena = e.id_evento AND cc.tipo = 'MULTA_FAENA')
          OR
          (e.tipo_evento = 'ASAMBLEA' AND op.id_asamblea = e.id_evento AND cc.tipo = 'MULTA_ASAMBLEA')
        )
    ) obl ON TRUE
  )
  SELECT jsonb_build_object(
    'persona', jsonb_build_object(
      'idPersona', pd.id_persona,
      'nroPadron', pd.nro_padron,
      'nombres', pd.nombres,
      'nombreCompleto', concat_ws(' ', pd.nombres, pd.apellido_paterno, pd.apellido_materno),
      'dni', pd.dni,
      'telefono', pd.telefono,
      'estado', pd.estado
    ),
    'resumenFinanciero', jsonb_build_object(
      'deudaPendienteTotal', d.deuda_pendiente_total
    ),
    'resumenFaenas', jsonb_build_object(
      'total', fr.total,
      'asistencias', fr.asistencias,
      'faltas', fr.faltas,
      'tardanzas', fr.tardanzas,
      'porcentajeAsistencia', CASE
        WHEN fr.total = 0 THEN 0
        ELSE ROUND(((fr.asistencias + fr.tardanzas)::NUMERIC * 100) / fr.total, 2)
      END
    ),
    'resumenAsambleas', jsonb_build_object(
      'total', ar.total,
      'asistencias', ar.asistencias,
      'faltas', ar.faltas,
      'tardanzas', ar.tardanzas,
      'porcentajeAsistencia', CASE
        WHEN ar.total = 0 THEN 0
        ELSE ROUND(((ar.asistencias + ar.tardanzas)::NUMERIC * 100) / ar.total, 2)
      END
    ),
    'ultimosEventos', ue.eventos
  )
  INTO v_result
  FROM persona_data pd
  CROSS JOIN deuda d
  CROSS JOIN faenas_resumen fr
  CROSS JOIN asambleas_resumen ar
  CROSS JOIN ultimos_eventos ue;

  RETURN v_result;
END;
$$;
