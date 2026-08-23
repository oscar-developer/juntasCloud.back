CREATE OR REPLACE FUNCTION public.fn_registrar_tardanza_asamblea(
    p_id_tenant BIGINT,
    p_id_asistencia BIGINT,
    p_hora_llegada TIME,
    p_cobrar_ahora BOOLEAN,
    p_medio_pago VARCHAR(20),
    p_id_user BIGINT
)
RETURNS TABLE (
    id_asistencia BIGINT,
    id_obligacion BIGINT,
    id_movimiento BIGINT,
    estado_obligacion VARCHAR(20)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_persona BIGINT;
    v_id_asamblea BIGINT;
    v_id_concepto BIGINT;
    v_id_obligacion BIGINT;
    v_id_movimiento BIGINT := NULL;
    v_id_categoria BIGINT;
    v_monto NUMERIC(10,2);
BEGIN

    /*
      1. Obtener y bloquear asistencia
    */
    SELECT
        a.id_persona,
        a.id_asamblea
    INTO
        v_id_persona,
        v_id_asamblea
    FROM asistencia_asamblea a
    WHERE a.id_tenant = p_id_tenant
      AND a.id_asistencia = p_id_asistencia
      AND a.anulado = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la asistencia';
    END IF;


    /*
      2. Obtener configuración/concepto
    */
    SELECT id_concepto_cobro
    INTO v_id_concepto
    FROM conceptos_cobro
    WHERE id_tenant = p_id_tenant
      AND cod_concepto_cobro = 'MUL_ASAM_TARDE'
      AND activo = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No está configurado el concepto de multa por tardanza';
    END IF;


    /*
      Aquí idealmente el monto saldría de una tabla
      de configuración/reglas.
    */
    v_monto := 2.00;


    /*
      3. Actualizar asistencia
    */
    UPDATE asistencia_asamblea
    SET estado = 'TARDE',
        hora_llegada = p_hora_llegada,
        updated_at = now(),
        updated_by_user = p_id_user
    WHERE id_tenant = p_id_tenant
      AND id_asistencia = p_id_asistencia;


    /*
      4. Crear obligación
    */
    INSERT INTO obligaciones_persona
    (
        id_tenant,
        id_persona,
        id_concepto_cobro,
        fecha_emision,
        monto_original,
        monto_pagado,
        monto_exonerado,
        monto_compensado,
        saldo,
        id_asamblea,
        estado,
        created_by_user
    )
    VALUES
    (
        p_id_tenant,
        v_id_persona,
        v_id_concepto,
        CURRENT_DATE,
        v_monto,
        0,
        0,
        0,
        v_monto,
        v_id_asamblea,
        'PENDIENTE',
        p_id_user
    )
    RETURNING id_obligacion
    INTO v_id_obligacion;


    /*
      5. Historial creación
    */
    INSERT INTO obligacion_movimientos
    (
        id_tenant,
        id_obligacion,
        tipo_movimiento,
        monto,
        referencia_tipo,
        referencia_id,
        observaciones,
        created_by_user
    )
    VALUES
    (
        p_id_tenant,
        v_id_obligacion,
        'CREACION',
        v_monto,
        'ASAMBLEA',
        v_id_asamblea,
        'Multa generada por tardanza',
        p_id_user
    );


    /*
      6. Si paga en ese instante
    */
    IF p_cobrar_ahora THEN

        IF p_medio_pago IS NULL THEN
            RAISE EXCEPTION 'Debe indicar el medio de pago';
        END IF;

        SELECT id_categoria_caja
        INTO v_id_categoria
        FROM caja_categorias
        WHERE id_tenant = p_id_tenant
          AND cod_categoria = 'ING_MULTAS'
          AND activo = TRUE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'No existe la categoría de caja para multas';
        END IF;


        INSERT INTO caja_movimientos
        (
            id_tenant,
            fecha,
            tipo,
            monto,
            id_categoria_caja,
            id_persona,
            id_asamblea,
            id_user,
            descripcion,
            medio_pago,
            created_by_user
        )
        VALUES
        (
            p_id_tenant,
            CURRENT_DATE,
            'INGRESO',
            v_monto,
            v_id_categoria,
            v_id_persona,
            v_id_asamblea,
            p_id_user,
            'Pago de multa por tardanza',
            p_medio_pago,
            p_id_user
        )
        RETURNING id_movimiento
        INTO v_id_movimiento;


        INSERT INTO obligacion_pagos
        (
            id_tenant,
            id_obligacion,
            id_movimiento,
            monto_aplicado,
            created_by_user
        )
        VALUES
        (
            p_id_tenant,
            v_id_obligacion,
            v_id_movimiento,
            v_monto,
            p_id_user
        );


        UPDATE obligaciones_persona
        SET monto_pagado = v_monto,
            saldo = 0,
            estado = 'PAGADA',
            updated_at = now(),
            updated_by_user = p_id_user
        WHERE id_tenant = p_id_tenant
          AND id_obligacion = v_id_obligacion;


        INSERT INTO obligacion_movimientos
        (
            id_tenant,
            id_obligacion,
            tipo_movimiento,
            monto,
            referencia_tipo,
            referencia_id,
            observaciones,
            created_by_user
        )
        VALUES
        (
            p_id_tenant,
            v_id_obligacion,
            'PAGO',
            v_monto,
            'CAJA_MOVIMIENTO',
            v_id_movimiento,
            'Pago de multa por tardanza',
            p_id_user
        );

    END IF;


    RETURN QUERY
    SELECT
        p_id_asistencia,
        v_id_obligacion,
        v_id_movimiento,
        CASE
            WHEN p_cobrar_ahora THEN 'PAGADA'::VARCHAR(20)
            ELSE 'PENDIENTE'::VARCHAR(20)
        END;

END;
$$;