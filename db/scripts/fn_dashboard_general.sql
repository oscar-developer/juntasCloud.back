CREATE OR REPLACE FUNCTION fn_dashboard_general(
  p_id_tenant BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN

  SELECT jsonb_build_object(

    -- 💰 Caja
    'caja', jsonb_build_object(
      'saldoActual', COALESCE(SUM(
        CASE 
          WHEN tipo = 'INGRESO' THEN monto
          WHEN tipo = 'GASTO' THEN -monto
        END
      ), 0)
    ),

    -- 📊 Personas
    'personas', jsonb_build_object(
      'total', COUNT(*),
      'padronados', COUNT(*) FILTER (WHERE tipo_participante = 'PADRONADO')
    ),

    -- 🧾 Obligaciones
    'obligaciones', jsonb_build_object(
      'pendientes', COUNT(*) FILTER (WHERE estado = 'PENDIENTE'),
      'deudaTotal', COALESCE(SUM(saldo), 0)
    ),

    -- 🛠️ Faenas
    'faenas', jsonb_build_object(
      'programadas', COUNT(*) FILTER (WHERE estado = 'PROGRAMADA')
    ),

    -- 🏛️ Asambleas
    'asambleas', jsonb_build_object(
      'proximas', COUNT(*) FILTER (
        WHERE estado = 'PROGRAMADA'
      )
    )

  )
  INTO v_result
  FROM caja_movimientos cm
  WHERE cm.id_tenant = p_id_tenant;

  RETURN v_result;

END;
$$;