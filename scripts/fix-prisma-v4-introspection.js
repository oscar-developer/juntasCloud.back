const fs = require('node:fs');
const path = require('node:path');

const schemaPath =
  process.argv[2] ?? path.join(process.cwd(), 'prisma', 'schema.prisma');

const ownerIndexUnique =
  '  id_tenant                                      BigInt           @unique(map: "ux_tenant_users_one_active_owner", where: raw("(((role)::text = \'OWNER\'::text) AND ((estado)::text = \'ACTIVO\'::text))"))';
const ownerIndexField = '  id_tenant                                      BigInt';
const ownerIndexModelLine =
  '  @@index([id_tenant], map: "ux_tenant_users_one_active_owner", where: raw("(((role)::text = \'OWNER\'::text) AND ((estado)::text = \'ACTIVO\'::text))"))';
const personaUniqueLine =
  '  @@unique([id_tenant, id_persona], map: "ux_tenant_users_persona", where: raw("(id_persona IS NOT NULL)"))';

let schema = fs.readFileSync(schemaPath, 'utf8');

function insertAfter(anchor, line) {
  if (schema.includes(line)) {
    return;
  }

  if (!schema.includes(anchor)) {
    throw new Error(`No se encontro el ancla esperada en schema.prisma: ${anchor}`);
  }

  schema = schema.replace(anchor, `${anchor}\n${line}`);
}

schema = schema.replace(ownerIndexUnique, ownerIndexField);
schema = schema.replaceAll(
  '  tenant_users           tenant_users?',
  '  tenant_users           tenant_users[]',
);

insertAfter(
  '  @@unique([id_tenant, id_asamblea, id_persona], map: "ux_asistencia_asamblea")',
  '  @@unique([id_tenant, id_asistencia])',
);
insertAfter(
  '  @@unique([id_tenant, id_faena, id_persona], map: "ux_faena_participacion")',
  '  @@unique([id_tenant, id_faena_participacion])',
);
insertAfter(
  '  @@unique([id_tenant, id_junta, cargo], map: "ux_junta_presidente_activo", where: raw("(((cargo)::text = \'PRESIDENTE\'::text) AND (fecha_fin IS NULL))"))',
  '  @@unique([id_tenant, id_junta_miembro])',
);
insertAfter(
  '  @@unique([id_tenant, id_persona, id_terreno], map: "ux_persona_terreno")',
  '  @@unique([id_tenant, id_persona_terreno])',
);
insertAfter(
  '  @@index([id_tenant, id_credito, fecha_movimiento], map: "inx_crm_credito_fecha")',
  '  @@unique([id_tenant, id_credito_movimiento])',
);
insertAfter(
  '  @@index([id_tenant, id_obligacion, fecha_movimiento], map: "inx_om_obligacion_fecha")',
  '  @@unique([id_tenant, id_obligacion_movimiento])',
);
insertAfter(
  '  @@index([id_tenant, id_movimiento], map: "inx_obp_movimiento")',
  '  @@unique([id_tenant, id_obligacion_pago])',
);
insertAfter(personaUniqueLine, ownerIndexModelLine);

fs.writeFileSync(schemaPath, schema);
