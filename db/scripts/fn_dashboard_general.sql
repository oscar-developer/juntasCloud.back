/*
Uso:

SELECT public.fn_dashboard_general(7);

Nota:
Esta funcion lee tablas con RLS. Desde el backend debe ejecutarse dentro de una
transaccion que haya configurado app.user_id y app.tenant_id.
*/
CREATE OR REPLACE FUNCTION public.fn_dashboard_general(
  p_id_tenant BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_id_tenant IS NULL THEN
    RAISE EXCEPTION 'El id_tenant es obligatorio';
  END IF;

  SELECT jsonb_build_object(
    'caja',
    (
      SELECT jsonb_build_object(
        'saldoActual',
        COALESCE(
          SUM(
            CASE
              WHEN cm.tipo = 'INGRESO' THEN cm.monto
              WHEN cm.tipo = 'GASTO' THEN -cm.monto
              ELSE 0
            END
          ),
          0
        )
      )
      FROM public.caja_movimientos cm
      WHERE cm.id_tenant = p_id_tenant
        AND cm.anulado = FALSE
    ),

    'personas',
    (
      SELECT jsonb_build_object(
        'total',
        COUNT(*),
        'padronados',
        COUNT(*) FILTER (WHERE p.tipo_participante = 'PADRONADO'),
        'noPadronados',
        COUNT(*) FILTER (WHERE p.tipo_participante = 'NO_PADRONADO'),
        'invitados',
        COUNT(*) FILTER (WHERE p.tipo_participante = 'INVITADO')

      )
      FROM public.personas p
      WHERE p.id_tenant = p_id_tenant
    ),

    'obligaciones',
    (
      SELECT jsonb_build_object(
        'pendientes',
        COUNT(*) FILTER (WHERE op.estado = 'PENDIENTE'),
        'deudaTotal',
        COALESCE(
          SUM(op.saldo) FILTER (WHERE op.estado IN ('PENDIENTE', 'PARCIAL')),
          0
        )
      )
      FROM public.obligaciones_persona op
      WHERE op.id_tenant = p_id_tenant
    ),

    'faenas',
    (
      SELECT jsonb_build_object(
        'programadas',
        COUNT(*)
      )
      FROM public.faenas f
      WHERE f.id_tenant = p_id_tenant
        AND f.estado = 'PROGRAMADA'
    ),

    'asambleas',
    (
      SELECT jsonb_build_object(
        'proximas',
        COUNT(*)
      )
      FROM public.asambleas a
      WHERE a.id_tenant = p_id_tenant
        AND a.estado = 'PROGRAMADA'
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;
