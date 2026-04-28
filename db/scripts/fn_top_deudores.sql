
CREATE OR REPLACE FUNCTION fn_top_deudores(
  p_id_tenant BIGINT,
  p_limite INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN

  SELECT jsonb_agg(row_to_json(t))
  INTO v_result
  FROM (
    SELECT 
      p.id_persona,
      p.nombres,
      p.apellido_paterno,
      p.apellido_materno,
      SUM(op.saldo) AS deuda_total
    FROM obligaciones_persona op
    JOIN personas p
      ON p.id_tenant = op.id_tenant
     AND p.id_persona = op.id_persona
    WHERE op.id_tenant = p_id_tenant
    GROUP BY p.id_persona, p.nombres, p.apellido_paterno, p.apellido_materno
    HAVING SUM(op.saldo) > 0
    ORDER BY deuda_total DESC
    LIMIT p_limite
  ) t;

  RETURN COALESCE(v_result, '[]'::jsonb);

END;
$$;