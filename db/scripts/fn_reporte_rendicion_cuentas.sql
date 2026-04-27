CREATE OR REPLACE FUNCTION fn_reporte_rendicion_cuentas(
  p_id_junta BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_tenant BIGINT;
  v_fecha_inicio DATE;
  v_fecha_fin DATE;
  v_result JSONB;
BEGIN
  -- Obtener tenant desde la sesión (RLS)
  v_id_tenant := current_setting('app.tenant_id', true)::BIGINT;

  IF v_id_tenant IS NULL THEN
    RAISE EXCEPTION 'No se ha configurado app.tenant_id en la sesión';
  END IF;

  -- Obtener periodo de la junta
  SELECT 
    jd.fecha_inicio,
    COALESCE(jd.fecha_fin, CURRENT_DATE)
  INTO v_fecha_inicio, v_fecha_fin
  FROM juntas_directivas jd
  WHERE jd.id_junta = p_id_junta;

  IF v_fecha_inicio IS NULL THEN
    RAISE EXCEPTION 'No existe la junta o no pertenece al tenant actual';
  END IF;

  -- Construir JSON
  SELECT jsonb_build_object(
    'periodo', jsonb_build_object(
      'fechaInicio', v_fecha_inicio,
      'fechaFin', v_fecha_fin
    ),

    'resumen', jsonb_build_object(
      'saldoInicial', COALESCE(SUM(
        CASE 
          WHEN cm.tipo = 'INGRESO'
           AND cc.nombre ILIKE '%saldo inicial%'
          THEN cm.monto ELSE 0 END
      ), 0),

      'totalIngresos', COALESCE(SUM(
        CASE 
          WHEN cm.tipo = 'INGRESO'
           AND cc.nombre NOT ILIKE '%saldo inicial%'
          THEN cm.monto ELSE 0 END
      ), 0),

      'totalGastos', COALESCE(SUM(
        CASE 
          WHEN cm.tipo = 'GASTO'
          THEN cm.monto ELSE 0 END
      ), 0),

      'saldoFinal', COALESCE(SUM(
        CASE 
          WHEN cm.tipo = 'INGRESO' THEN cm.monto
          WHEN cm.tipo = 'GASTO' THEN -cm.monto
          ELSE 0
        END
      ), 0)
    ),

    'porCategoria', (
      SELECT jsonb_agg(x)
      FROM (
        SELECT 
          cc.tipo,
          cc.nombre AS categoria,
          SUM(cm.monto) AS total
        FROM caja_movimientos cm
        INNER JOIN caja_categorias cc
          ON cc.id_tenant = cm.id_tenant
         AND cc.id_categoria_caja = cm.id_categoria_caja
        WHERE cm.fecha BETWEEN v_fecha_inicio AND v_fecha_fin
          AND cm.anulado = false
        GROUP BY cc.tipo, cc.nombre
        ORDER BY cc.tipo, cc.nombre
      ) x
    ),

    'detalleMovimientos', (
      SELECT jsonb_agg(x)
      FROM (
        SELECT 
          cm.fecha,
          cm.tipo,
          cc.nombre AS categoria,
          cm.descripcion,
          cm.monto,
          cm.medio_pago,
          cm.doc_referencia
        FROM caja_movimientos cm
        INNER JOIN caja_categorias cc
          ON cc.id_tenant = cm.id_tenant
         AND cc.id_categoria_caja = cm.id_categoria_caja
        WHERE cm.fecha BETWEEN v_fecha_inicio AND v_fecha_fin
          AND cm.anulado = false
        ORDER BY cm.fecha, cm.id_movimiento
      ) x
    )
  )
  INTO v_result
  FROM caja_movimientos cm
  INNER JOIN caja_categorias cc
    ON cc.id_tenant = cm.id_tenant
   AND cc.id_categoria_caja = cm.id_categoria_caja
  WHERE cm.fecha BETWEEN v_fecha_inicio AND v_fecha_fin
    AND cm.anulado = false;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;