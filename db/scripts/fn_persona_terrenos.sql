CREATE OR REPLACE FUNCTION public.fn_persona_terrenos(
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

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'idPersonaTerreno', pt.id_persona_terreno,
        'idTerreno', t.id_terreno,
        'codigoLote', t.codigo_lote,
        'manzana', t.manzana,
        'numeroLote', t.numero_lote,
        'descripcion', t.descripcion,
        'areaAproxM2', t.area_aprox_m2,
        'areaLegalM2', t.area_legal_m2,
        'partidaRegistral', t.partida_registral,
        'ubicacion', t.ubicacion,
        'estado', t.estado,
        'tipoRelacion', pt.tipo_relacion,
        'porcentajeParticipacion', pt.porcentaje_participacion,
        'relacionPrincipal', NULL
      )
      ORDER BY pt.id_persona_terreno DESC
    ),
    '[]'::JSONB
  )
  INTO v_result
  FROM public.persona_terreno pt
  JOIN public.terrenos t
    ON t.id_tenant = pt.id_tenant
   AND t.id_terreno = pt.id_terreno
  WHERE pt.id_tenant = p_id_tenant
    AND pt.id_persona = p_id_persona;

  RETURN v_result;
END;
$$;
