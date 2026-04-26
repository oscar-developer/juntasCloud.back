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