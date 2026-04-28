INSERT INTO conceptos_cobro_base
(nombre, tipo, requiere_periodo, observaciones)
VALUES
('Cuota ordinaria', 'CUOTA_ORDINARIA', TRUE, 'Cobro periódico regular de la junta.'),
('Cuota extraordinaria', 'CUOTA_EXTRAORDINARIA', FALSE, 'Cobro especial aprobado por la junta.'),
('Multa por faena', 'MULTA_FAENA', FALSE, 'Multa generada por inasistencia o incumplimiento en faenas.'),
('Multa por asamblea', 'MULTA_ASAMBLEA', FALSE, 'Multa generada por inasistencia a asambleas.'),
('Aporte voluntario', 'APORTE', FALSE, 'Aporte no obligatorio realizado por una persona.'),
('Otro cobro', 'OTRO', FALSE, 'Otros conceptos de cobro definidos por la junta.');

INSERT INTO caja_categorias_base
(nombre, tipo)
VALUES
-- Ingresos
('Saldo inicial recibido', 'INGRESO'),
('Cuotas', 'INGRESO'),
('Multas', 'INGRESO'),
('Aportes', 'INGRESO'),
('Donaciones', 'INGRESO'),
('Otros ingresos', 'INGRESO'),

-- Gastos
('Mantenimiento', 'GASTO'),
('Servicios', 'GASTO'),
('Materiales', 'GASTO'),
('Administración', 'GASTO'),
('Eventos', 'GASTO'),
('Otros gastos', 'GASTO');

INSERT INTO app_modules (module_code, nombre, grupo, orden) VALUES
('dashboard', 'Dashboard', 'General', 1),
('personas', 'Personas', 'Catálogos', 10),
('terrenos', 'Terrenos', 'Catálogos', 20),
('persona_terreno', 'Relación Persona-Terreno', 'Catálogos', 30),
('bienes', 'Bienes', 'Catálogos', 40),
('juntas_directivas', 'Juntas Directivas', 'Gestión / Organización', 50),
('junta_miembros', 'Miembros de Junta', 'Gestión / Organización', 60),
('faenas', 'Faenas', 'Eventos y Asistencia', 70),
('faena_asistencia', 'Asistencia faena', 'Eventos y Asistencia', 80),
('asambleas', 'Asambleas', 'Eventos y Asistencia', 90),
('asamblea_asistencia', 'Asistencia asamblea', 'Eventos y Asistencia', 100),
('finanzas_resumen', 'Resumen financiero', 'Finanzas', 110),
('finanzas_caja', 'Caja', 'Finanzas', 120),
('finanzas_obligaciones', 'Obligaciones / Cobranza', 'Finanzas', 130),
('finanzas_pagos', 'Pagos', 'Finanzas', 140),
('finanzas_creditos', 'Créditos', 'Finanzas', 150),
('finanzas_conceptos_cobro', 'Conceptos de cobro', 'Configuración financiera', 160),
('finanzas_categorias_caja', 'Categorías de caja', 'Configuración financiera', 170),
('admin_miembros', 'Miembros del tenant', 'Administración', 180),
('admin_invitaciones', 'Invitaciones', 'Administración', 190),
('admin_roles', 'Roles / Perfiles', 'Administración', 200),
('admin_configuracion', 'Configuración de la junta', 'Administración', 210);