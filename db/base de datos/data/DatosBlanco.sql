-- =============================================================================
-- CONCEPTOS DE COBRO BASE
-- =============================================================================

INSERT INTO public.conceptos_cobro_base (
 cod_concepto_cobro,
 nombre,
 tipo,
 activo,
 requiere_periodo,
 observaciones
)
VALUES
( 'CUOTA_ORDINARIA', 'Cuota ordinaria', 'CUOTA_ORDINARIA', TRUE, TRUE, 'Cobro periódico regular de la junta.'),
( 'CUOTA_EXTRAORDINARIA', 'Cuota extraordinaria', 'CUOTA_EXTRAORDINARIA', TRUE, FALSE, 'Cobro especial aprobado por la junta.'),
( 'MULTA_FAENA', 'Multa por faena', 'MULTA_FAENA', TRUE, FALSE, 'Multa generada por inasistencia o incumplimiento en faenas.'),
( 'MULTA_ASAMBLEA', 'Multa por asamblea', 'MULTA_ASAMBLEA', TRUE, FALSE, 'Multa generada por inasistencia a asambleas.'),
( 'APORTE', 'Aporte voluntario', 'APORTE', TRUE, FALSE, 'Aporte no obligatorio realizado por una persona.'),
( 'OTRO', 'Otro cobro', 'OTRO', TRUE, FALSE, 'Otros conceptos de cobro definidos por la junta.');

-- =============================================================================
-- CATEGORÍAS BASE DE CAJA
-- =============================================================================

INSERT INTO public.caja_categorias_base (
  cod_categoria,
  nombre,
  tipo,
  activo
)
VALUES
-- Ingresos
('SALDO_INICIAL',  'Saldo inicial recibido', 'INGRESO', TRUE),
('CUOTAS',         'Cuotas',                  'INGRESO', TRUE),
('MULTAS',         'Multas',                  'INGRESO', TRUE),
('APORTES',        'Aportes',                 'INGRESO', TRUE),
('DONACIONES',     'Donaciones',              'INGRESO', TRUE),
('OTROS_INGRESOS', 'Otros ingresos',          'INGRESO', TRUE),

-- Gastos
('MANTENIMIENTO',  'Mantenimiento',            'GASTO', TRUE),
('SERVICIOS',      'Servicios',                'GASTO', TRUE),
('MATERIALES',     'Materiales',               'GASTO', TRUE),
('ADMINISTRACION', 'Administración',           'GASTO', TRUE),
('EVENTOS',        'Eventos',                  'GASTO', TRUE),
('OTROS_GASTOS',   'Otros gastos',             'GASTO', TRUE);

-- =============================================================================
-- MÓDULOS GLOBALES DE LA APLICACIÓN
-- =============================================================================

INSERT INTO public.app_modules (
  module_code,
  nombre,
  grupo,
  orden,
  estado
)
VALUES
('dashboard',                   'Dashboard',                    'General',                   1,   TRUE),

('personas',                    'Personas',                     'Catálogos',                 10,  TRUE),
('terrenos',                    'Terrenos',                     'Catálogos',                 20,  TRUE),
('persona_terreno',             'Relación Persona-Terreno',     'Catálogos',                 30,  TRUE),
('bienes',                      'Bienes',                       'Catálogos',                 40,  TRUE),

('juntas_directivas',           'Juntas directivas',            'Gestión / Organización',    50,  TRUE),
('junta_miembros',              'Miembros de junta',            'Gestión / Organización',    60,  TRUE),

('faenas',                      'Faenas',                       'Eventos y Asistencia',      70,  TRUE),
('faena_asistencia',            'Asistencia a faenas',          'Eventos y Asistencia',      80,  TRUE),
('asambleas',                   'Asambleas',                    'Eventos y Asistencia',      90,  TRUE),
('asamblea_asistencia',         'Asistencia a asambleas',       'Eventos y Asistencia',      100, TRUE),

('finanzas_resumen',            'Resumen financiero',           'Finanzas',                  110, TRUE),
('finanzas_caja',               'Caja',                         'Finanzas',                  120, TRUE),
('finanzas_obligaciones',       'Obligaciones y cobranza',      'Finanzas',                  130, TRUE),
('finanzas_pagos',              'Pagos',                        'Finanzas',                  140, TRUE),
('finanzas_creditos',           'Créditos',                     'Finanzas',                  150, TRUE),

('finanzas_conceptos_cobro',    'Conceptos de cobro',           'Configuración financiera',  160, TRUE),
('finanzas_categorias_caja',    'Categorías de caja',           'Configuración financiera',  170, TRUE),

('admin_miembros',              'Miembros del tenant',          'Administración',            180, TRUE),
('admin_invitaciones',          'Invitaciones',                 'Administración',            190, TRUE),
('admin_roles',                 'Roles y perfiles',             'Administración',            200, TRUE),
('admin_configuracion',         'Configuración de la junta',    'Administración',            210, TRUE);