-- =========================================================
-- DATASET DEMO (5 asociaciones / multi-tenant con RLS)
-- Base: villa_union
-- =========================================================

-- Limpieza opcional (si quieres resetear todo)
-- OJO: borra en orden por FKs
-- TRUNCATE asistencia_asamblea, faena_participacion, caja_movimientos, junta_miembros, persona_terreno,
--         usuarios, bienes, asambleas, faenas, juntas_directivas, terrenos, personas
--         RESTART IDENTITY;
-- TRUNCATE tenants RESTART IDENTITY;

-- =========================================================
-- TENANTS (5 asociaciones)
-- =========================================================
INSERT INTO tenants (id_tenant, nombre, ruc, dni, estado, observaciones) VALUES
(1, 'Asociación Villa Unión',      '20600000001', NULL, 'ACTIVO', 'Demo tenant 1'),
(2, 'Asociación Los Pinos',        '20600000002', NULL, 'ACTIVO', 'Demo tenant 2'),
(3, 'Asociación San Pedro',        '20600000003', NULL, 'ACTIVO', 'Demo tenant 3'),
(4, 'Asociación Nueva Esperanza',  NULL, '44778899', 'ACTIVO', 'Demo tenant 4 (sin RUC)'),
(5, 'Asociación Las Lomas',        '20600000005', NULL, 'ACTIVO', 'Demo tenant 5');

-- =========================================================
-- TENANT 1
-- =========================================================
SET app.tenant_id = '1';

-- PERSONAS (6)
INSERT INTO personas
(id_tenant, id_persona, nombres, apellidopaterno, apellidomaterno, dni, telefono, referencia_vivienda,
 tipo_participante, estado, fecha_registro, observaciones)
VALUES
(1, 1, 'Carlos', 'Quispe', 'Huamán', '44556677', '999111222', 'Mz A Lt 01', 'PADRONADO', 'ACTIVO', '2024-01-10', 'Presidente'),
(1, 2, 'María',  'Condori', 'Quispe','77889911', '988222333', 'Mz A Lt 02', 'PADRONADO', 'ACTIVO', '2024-01-12', 'Tesorera'),
(1, 3, 'José',   'Soto', 'Vargas',  '11223344', '977333444', 'Mz B Lt 05', 'PADRONADO', 'ACTIVO', '2024-02-01', NULL),
(1, 4, 'Ana',    'Torres','Pérez',   '55667788', '966444555', 'Mz C Lt 03', 'NO_PADRONADO','ACTIVO','2024-02-20', 'Invitada frecuente'),
(1, 5, 'Luis',   'Rojas', 'Mamani',  '22334455', '955555666', 'Mz D Lt 08', 'PADRONADO', 'SUSPENDIDO','2024-03-05','Pendiente de cuota'),
(1, 6, 'Elena',  'Flores','Ccama',   '66778899', '944666777', 'Mz E Lt 10', 'INVITADO', 'ACTIVO', '2024-03-15','Invitada');

-- TERRENOS (2)
INSERT INTO terrenos
(id_tenant, id_terreno, descripcion, area_aprox_m2, estado, observaciones)
VALUES
(1, 1, 'Terreno Comunal Sector A', 2500.50, 'EN_USO', 'Zona de reuniones'),
(1, 2, 'Terreno Sector B',         1800.00, 'EN_VENTA', 'Lotes disponibles');

-- JUNTAS_DIRECTIVAS (2)
INSERT INTO juntas_directivas
(id_tenant, id_junta, nombre, fecha_inicio, fecha_fin, estado, observaciones)
VALUES
(1, 1, 'Junta 2024-2025', '2024-01-01', '2025-12-31', 'CESADA', 'Cerrada'),
(1, 2, 'Junta 2026-2027', '2026-01-01', NULL,         'VIGENTE', 'Actual');

-- FAENAS (2)
INSERT INTO faenas
(id_tenant, id_faena, fecha, descripcion, lugar, observaciones)
VALUES
(1, 1, '2026-01-20', 'Limpieza de canal', 'Sector A', NULL),
(1, 2, '2026-02-05', 'Mantenimiento de cerco', 'Sector B', 'Con herramientas');

-- ASAMBLEAS (2)
INSERT INTO asambleas
(id_tenant, id_asamblea, fecha, tipo, tema_principal, lugar, quorum_requerido, observaciones)
VALUES
(1, 1, '2026-01-15 19:30:00', 'ORDINARIA', 'Plan anual 2026', 'Local Comunal', 30, NULL),
(1, 2, '2026-02-10 20:00:00', 'EXTRAORDINARIA', 'Aprobación compra de materiales', 'Local Comunal', 40, 'Urgente');

-- BIENES (2)
INSERT INTO bienes
(id_tenant, id_bien, descripcion, tipo, cantidad, valor_estimado, ubicacion, fecha_alta, fecha_baja, estado, observaciones)
VALUES
(1, 1, 'Parlante portátil', 'EQUIPO', 1, 450.00, 'Almacén', '2025-06-01', NULL, 'BUENO', NULL),
(1, 2, 'Sillas plásticas',  'MOBILIARIO', 30, 12.00, 'Local Comunal', '2024-02-01', NULL, 'REGULAR', 'Varias dañadas');

-- USUARIOS (3) (username único por tenant)
INSERT INTO usuarios
(id_tenant, id_usuario, username, password_hash, rol, estado, id_persona, observaciones)
VALUES
(1, 1, 'admin_vu',  '$2b$10$demo_hash_admin', 'ADMIN', 'ACTIVO', 1, 'Admin general'),
(1, 2, 'presi_vu',  '$2b$10$demo_hash_presi', 'PRESIDENTE', 'ACTIVO', 1, NULL),
(1, 3, 'teso_vu',   '$2b$10$demo_hash_teso',  'TESORERA', 'ACTIVO', 2, NULL);

-- PERSONA_TERRENO (M:N)
INSERT INTO persona_terreno
(id_tenant, id_persona_terreno, id_persona, id_terreno, tipo_relacion, porcentaje_participacion)
VALUES
(1, 1, 1, 1, 'OTRO', NULL),
(1, 2, 2, 1, 'OTRO', NULL),
(1, 3, 3, 2, 'POSEEDOR', 50.00),
(1, 4, 5, 2, 'COPROPIETARIO', 50.00);

-- JUNTA_MIEMBROS
INSERT INTO junta_miembros
(id_tenant, id_junta_miembro, id_junta, id_persona, cargo, fecha_inicio, fecha_fin)
VALUES
(1, 1, 2, 1, 'PRESIDENTE', '2026-01-01', NULL),
(1, 2, 2, 2, 'TESORERO',   '2026-01-01', NULL),
(1, 3, 2, 3, 'SECRETARIO', '2026-01-01', NULL),
(1, 4, 2, 4, 'VOCAL',      '2026-01-01', NULL);

-- FAENA_PARTICIPACION
INSERT INTO faena_participacion
(id_tenant, id_faena_participacion, id_faena, id_persona, asistio, hora_llegada, multa_generada, monto_multa)
VALUES
(1, 1, 1, 1, TRUE,  '08:05', FALSE, NULL),
(1, 2, 1, 2, TRUE,  '08:15', FALSE, NULL),
(1, 3, 1, 5, FALSE, NULL,   TRUE,  20.00),
(1, 4, 2, 3, TRUE,  '09:00', FALSE, NULL),
(1, 5, 2, 4, FALSE, NULL,   TRUE,  10.00);

-- ASISTENCIA_ASAMBLEA
INSERT INTO asistencia_asamblea
(id_tenant, id_asistencia, id_asamblea, id_persona, asistio, hora_llegada, es_padronado_en_momento, observaciones)
VALUES
(1, 1, 1, 1, TRUE,  '19:35', TRUE,  NULL),
(1, 2, 1, 2, TRUE,  '19:40', TRUE,  NULL),
(1, 3, 1, 4, TRUE,  '19:50', FALSE, 'Invitada'),
(1, 4, 2, 3, TRUE,  '20:05', TRUE,  NULL),
(1, 5, 2, 5, FALSE, NULL,   TRUE,  'Suspendido, no asistió');

-- CAJA_MOVIMIENTOS (mezcla de ingresos/gastos)
INSERT INTO caja_movimientos
(id_tenant, id_movimiento, fecha, tipo, monto, categoria, id_persona, id_faena, id_asamblea, id_bien, id_usuario,
 descripcion, medio_pago, doc_referencia, observaciones)
VALUES
(1, 1, '2026-01-16', 'INGRESO', 50.00,  'APORTE', 1, NULL, 1, NULL, 3, 'Aporte mensual', 'YAPE', 'OP-001', NULL),
(1, 2, '2026-01-20', 'INGRESO', 20.00,  'MULTA_FAENA', 5, 1, NULL, NULL, 2, 'Multa por falta', 'EFECTIVO', NULL, NULL),
(1, 3, '2026-02-11', 'GASTO',   120.00, 'MATERIAL_OBRA', NULL, NULL, 2, NULL, 1, 'Compra de cemento', 'TRANSFERENCIA', 'F001-123', NULL),
(1, 4, '2026-02-12', 'GASTO',   60.00,  'MOVILIDAD', NULL, NULL, NULL, NULL, 1, 'Transporte de materiales', 'EFECTIVO', NULL, NULL),
(1, 5, '2026-02-13', 'GASTO',   30.00,  'REUNION', NULL, NULL, 2, NULL, 3, 'Agua y galletas', 'PLIN', NULL, NULL);

-- =========================================================
-- TENANTS 2..5 (dataset más compacto pero completo)
-- Para cada tenant: 4 personas, 1 terreno, 1 junta, 1 faena, 1 asamblea, 1 bien, 2 usuarios,
-- relaciones y algunos movimientos.
-- =========================================================

-- -------------------------
-- TENANT 2
-- -------------------------
SET app.tenant_id = '2';

INSERT INTO personas (id_tenant, id_persona, nombres, apellidopaterno, apellidomaterno, dni, telefono, referencia_vivienda,
                      tipo_participante, estado, fecha_registro, observaciones)
VALUES
(2, 1, 'Rosa', 'Cáceres', 'Loayza', '40112233', '900111222', 'Lt 01', 'PADRONADO','ACTIVO','2024-05-01',NULL),
(2, 2, 'Miguel','Arias', 'Sánchez','40223344', '900222333', 'Lt 02', 'PADRONADO','ACTIVO','2024-05-02',NULL),
(2, 3, 'Julia', 'Vega',  'Ramos',  '40334455', '900333444', 'Lt 03', 'NO_PADRONADO','ACTIVO','2024-06-10',NULL),
(2, 4, 'Hugo',  'Paredes','Soto',  '40445566', '900444555', 'Lt 04', 'INVITADO','ACTIVO','2024-06-11',NULL);

INSERT INTO terrenos (id_tenant, id_terreno, descripcion, area_aprox_m2, estado)
VALUES (2, 1, 'Terreno Comunal', 1500.00, 'EN_USO');

INSERT INTO juntas_directivas (id_tenant, id_junta, nombre, fecha_inicio, estado)
VALUES (2, 1, 'Junta 2026', '2026-01-01', 'VIGENTE');

INSERT INTO faenas (id_tenant, id_faena, fecha, descripcion, lugar)
VALUES (2, 1, '2026-02-01', 'Faena de limpieza', 'Parque');

INSERT INTO asambleas (id_tenant, id_asamblea, fecha, tipo, tema_principal, lugar, quorum_requerido)
VALUES (2, 1, '2026-01-18 19:00:00', 'ORDINARIA', 'Cuotas y faenas', 'Local', 25);

INSERT INTO bienes (id_tenant, id_bien, descripcion, tipo, cantidad, valor_estimado, ubicacion, fecha_alta, estado)
VALUES (2, 1, 'Megáfono', 'EQUIPO', 1, 180.00, 'Local', '2025-11-01', 'BUENO');

INSERT INTO usuarios (id_tenant, id_usuario, username, password_hash, rol, estado, id_persona)
VALUES
(2, 1, 'admin_lp', '$2b$10$demo_hash_admin', 'ADMIN', 'ACTIVO', 1),
(2, 2, 'presi_lp', '$2b$10$demo_hash_presi', 'PRESIDENTE', 'ACTIVO', 2);

INSERT INTO persona_terreno (id_tenant, id_persona_terreno, id_persona, id_terreno, tipo_relacion, porcentaje_participacion)
VALUES
(2, 1, 1, 1, 'OTRO', NULL),
(2, 2, 2, 1, 'OTRO', NULL);

INSERT INTO junta_miembros (id_tenant, id_junta_miembro, id_junta, id_persona, cargo, fecha_inicio)
VALUES
(2, 1, 1, 2, 'PRESIDENTE', '2026-01-01'),
(2, 2, 1, 1, 'TESORERO',   '2026-01-01');

INSERT INTO faena_participacion (id_tenant, id_faena_participacion, id_faena, id_persona, asistio, multa_generada, monto_multa)
VALUES
(2, 1, 1, 1, TRUE,  FALSE, NULL),
(2, 2, 1, 3, FALSE, TRUE,  15.00);

INSERT INTO asistencia_asamblea (id_tenant, id_asistencia, id_asamblea, id_persona, asistio, es_padronado_en_momento)
VALUES
(2, 1, 1, 1, TRUE, TRUE),
(2, 2, 1, 3, TRUE, FALSE);

INSERT INTO caja_movimientos
(id_tenant, id_movimiento, fecha, tipo, monto, categoria, id_persona, id_usuario, descripcion, medio_pago)
VALUES
(2, 1, '2026-01-19', 'INGRESO', 30.00, 'APORTE', 1, 1, 'Aporte', 'EFECTIVO'),
(2, 2, '2026-02-02', 'INGRESO', 15.00, 'MULTA_FAENA', 3, 2, 'Multa', 'YAPE'),
(2, 3, '2026-02-03', 'GASTO',  50.00, 'SERVICIOS', NULL, 1, 'Pago luz local', 'TRANSFERENCIA');

-- -------------------------
-- TENANT 3
-- -------------------------
SET app.tenant_id = '3';

INSERT INTO personas VALUES
(3,1,'Pedro','Mendoza','Luna','50112233','911111111','Mz A','PADRONADO','ACTIVO','2024-07-01',NULL),
(3,2,'Silvia','Núñez','Vega','50223344','922222222','Mz B','PADRONADO','ACTIVO','2024-07-02',NULL),
(3,3,'Marco','Sánchez','Ríos','50334455','933333333','Mz C','NO_PADRONADO','ACTIVO','2024-08-10',NULL),
(3,4,'Diana','Ruiz','Poma','50445566','944444444','Mz D','INVITADO','ACTIVO','2024-08-11',NULL);

INSERT INTO terrenos VALUES (3,1,'Área Comunal Principal',2100.00,'EN_USO',NULL);
INSERT INTO juntas_directivas VALUES (3,1,'Junta 2026','2026-01-01',NULL,'VIGENTE',NULL);
INSERT INTO faenas VALUES (3,1,'2026-01-25','Pintado de señalización','Ingreso',NULL);
INSERT INTO asambleas VALUES (3,1,'2026-01-12 18:30:00','ORDINARIA','Elección de comité','Local',20,NULL);
INSERT INTO bienes VALUES (3,1,'Laptop de actas','EQUIPO',1,1200.00,'Oficina','2025-12-01',NULL,'BUENO',NULL);

INSERT INTO usuarios VALUES
(3,1,'admin_sp','$2b$10$demo_hash_admin','ADMIN','ACTIVO',1,now(),NULL),
(3,2,'secre_sp','$2b$10$demo_hash_secre','SECRETARIO','ACTIVO',2,now(),NULL);

INSERT INTO persona_terreno VALUES
(3,1,1,1,'OTRO',NULL),
(3,2,2,1,'OTRO',NULL);

INSERT INTO junta_miembros VALUES
(3,1,1,1,'PRESIDENTE','2026-01-01',NULL),
(3,2,1,2,'SECRETARIO','2026-01-01',NULL);


INSERT INTO faena_participacion VALUES
(3,1,1,1,TRUE,'08:00',FALSE,NULL),
(3,2,1,3,FALSE,NULL,TRUE,10.00);

INSERT INTO asistencia_asamblea VALUES
(3,1,1,1,TRUE,'18:35',TRUE,NULL),
(3,2,1,4,TRUE,'18:50',FALSE,'Invitada');

INSERT INTO caja_movimientos VALUES
(3,1,'2026-01-13','INGRESO',25.00,'APORTE',1,NULL,1,NULL,1,'Aporte','EFECTIVO',NULL,NULL),
(3,2,'2026-01-26','INGRESO',10.00,'MULTA_FAENA',3,1,NULL,NULL,2,'Multa','YAPE',NULL,NULL),
(3,3,'2026-01-27','GASTO',  80.00,'MATERIAL_OBRA',NULL,NULL,NULL,NULL,1,'Pintura','TRANSFERENCIA','F002-001',NULL);

-- -------------------------
-- TENANT 4
-- -------------------------
SET app.tenant_id = '4';

INSERT INTO personas VALUES
(4,1,'Renato','Cruz','Lazo','60112233','955111111','Sector 1','PADRONADO','ACTIVO','2024-09-01',NULL),
(4,2,'Patricia','García','Meza','60223344','955222222','Sector 2','PADRONADO','ACTIVO','2024-09-02',NULL),
(4,3,'Iván','Salas','Choque','60334455','955333333','Sector 3','PADRONADO','ACTIVO','2024-09-03',NULL),
(4,4,'Noelia','Castro','Rojas','60445566','955444444','Sector 4','INVITADO','ACTIVO','2024-09-10',NULL);

INSERT INTO terrenos VALUES (4,1,'Terreno de Reserva',3000.00,'RESERVA',NULL);
INSERT INTO juntas_directivas VALUES (4,1,'Junta 2026','2026-01-01',NULL,'VIGENTE',NULL);
INSERT INTO faenas VALUES (4,1,'2026-02-08','Recolección de residuos','Zona central',NULL);
INSERT INTO asambleas VALUES (4,1,'2026-02-07 19:00:00','EXTRAORDINARIA','Aprobación de presupuesto','Local',35,NULL);
INSERT INTO bienes VALUES (4,1,'Proyector','EQUIPO',1,900.00,'Local','2025-10-01',NULL,'BUENO',NULL);

INSERT INTO usuarios VALUES
(4,1,'admin_ne','$2b$10$demo_hash_admin','ADMIN','ACTIVO',1,now(),NULL),
(4,2,'teso_ne','$2b$10$demo_hash_teso','TESORERA','ACTIVO',2,now(),NULL);

INSERT INTO persona_terreno VALUES
(4,1,1,1,'OTRO',NULL),
(4,2,2,1,'OTRO',NULL);

INSERT INTO junta_miembros VALUES
(4,1,1,1,'PRESIDENTE','2026-01-01',NULL),
(4,2,1,2,'TESORERO','2026-01-01',NULL);

INSERT INTO faena_participacion VALUES
(4,1,1,2,TRUE,'07:50',FALSE,NULL),
(4,2,1,4,FALSE,NULL,TRUE,12.00);

INSERT INTO asistencia_asamblea VALUES
(4,1,1,1,TRUE,'19:05',TRUE,NULL),
(4,2,1,4,TRUE,'19:25',FALSE,'Invitada');

INSERT INTO caja_movimientos VALUES
(4,1,'2026-02-07','INGRESO',40.00,'APORTE_VOLUNTARIO',2,NULL,1,NULL,2,'Aporte voluntario','PLIN',NULL,NULL),
(4,2,'2026-02-08','INGRESO',12.00,'MULTA_FAENA',4,1,NULL,NULL,1,'Multa','EFECTIVO',NULL,NULL),
(4,3,'2026-02-09','GASTO',  70.00,'SERVICIOS',NULL,NULL,NULL,NULL,1,'Pago agua','TRANSFERENCIA','REC-001',NULL);

-- -------------------------
-- TENANT 5
-- -------------------------
SET app.tenant_id = '5';

INSERT INTO personas VALUES
(5,1,'Alberto','Chávez','Huerta','70112233','966111111','Mz 1','PADRONADO','ACTIVO','2024-10-01',NULL),
(5,2,'Carmen','López','Soto','70223344','966222222','Mz 2','PADRONADO','ACTIVO','2024-10-02',NULL),
(5,3,'Gino','Navarro','Paz','70334455','966333333','Mz 3','NO_PADRONADO','ACTIVO','2024-10-10',NULL),
(5,4,'Ruth','Fernández','Mora','70445566','966444444','Mz 4','INVITADO','ACTIVO','2024-10-11',NULL);

INSERT INTO terrenos VALUES (5,1,'Terreno Sector Lomas',1750.00,'EN_USO',NULL);
INSERT INTO juntas_directivas VALUES (5,1,'Junta 2026','2026-01-01',NULL,'VIGENTE',NULL);
INSERT INTO faenas VALUES (5,1,'2026-01-30','Siembra de árboles','Entrada',NULL);
INSERT INTO asambleas VALUES (5,1,'2026-01-29 19:15:00','ORDINARIA','Organización de faena','Local',22,NULL);
INSERT INTO bienes VALUES (5,1,'Carretilla','HERRAMIENTA',2,160.00,'Almacén','2025-09-01',NULL,'REGULAR',NULL);

INSERT INTO usuarios VALUES
(5,1,'admin_ll','$2b$10$demo_hash_admin','ADMIN','ACTIVO',1,now(),NULL),
(5,2,'presi_ll','$2b$10$demo_hash_presi','PRESIDENTE','ACTIVO',1,now(),NULL);

INSERT INTO persona_terreno VALUES
(5,1,1,1,'OTRO',NULL),
(5,2,2,1,'OTRO',NULL);

INSERT INTO junta_miembros VALUES
(5,1,1,1,'PRESIDENTE','2026-01-01',NULL),
(5,2,1,2,'SECRETARIO','2026-01-01',NULL);

INSERT INTO faena_participacion VALUES
(5,1,1,1,TRUE,'08:10',FALSE,NULL),
(5,2,1,3,FALSE,NULL,TRUE,8.00);

INSERT INTO asistencia_asamblea VALUES
(5,1,1,1,TRUE,'19:20',TRUE,NULL),
(5,2,1,4,TRUE,'19:35',FALSE,'Invitada');

INSERT INTO caja_movimientos VALUES
(5,1,'2026-01-29','INGRESO',20.00,'APORTE',1,NULL,1,NULL,2,'Aporte','YAPE',NULL,NULL),
(5,2,'2026-01-30','INGRESO',8.00,'MULTA_FAENA',3,1,NULL,NULL,1,'Multa','EFECTIVO',NULL,NULL),
(5,3,'2026-01-31','GASTO',  45.00,'MATERIAL_OBRA',NULL,NULL,NULL,NULL,1,'Plantones','TRANSFERENCIA','BOL-001',NULL);

-- Fin
