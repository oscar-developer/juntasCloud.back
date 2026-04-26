# AGENTS - juntasCloud.back

## Snapshot
- Backend NestJS 11 con Prisma 7, `@prisma/adapter-pg` y PostgreSQL.
- `main.ts` define prefijo global `api`, Swagger en `/api/docs` y CORS habilitado.
- La conexion Prisma se arma desde `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.
- Modulos presentes en `src/`: `auth`, `auth-users`, `tenants`, `tenant-invitations`, `personas`, `terrenos`, `juntas-directivas`, `faenas`, `asambleas`, `bienes`, `persona-terrenos`, `junta-miembros`, `faena-participaciones`, `asistencia-asamblea`, `caja-movimientos`, `mail`, `prisma`, `common`.

## Comandos Base
- Desarrollo: `npm run start:dev`
- Build: `npm run build`
- Unit tests: `npm test`
- E2E: `npm run test:e2e`
- Sincronizar Prisma desde DB: `npm run db:sync`

Baseline verificado el 2026-04-25:
- `npm test -- --runInBand` pasa con 3 suites y 31 tests.
- `npm run build` pasa.

## Variables de Entorno
- App y auth: `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`
- Base de datos: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- SMTP / frontend: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `FRONTEND_BASE_URL`

No documentar valores reales de `.env`; solo nombres y proposito.

## Modelo Multitenant
- `auth_users` representa usuarios globales de autenticacion.
- `tenants` representa juntas/asociaciones.
- `tenant_users` representa membresias por tenant, con `role` y `estado`.
- `tenant_invitations` soporta invitaciones entre usuarios y tenants.

### Flujo de request tenant-scoped
1. El cliente envia JWT Bearer y header `X-Tenant-Id`.
2. `JwtAuthGuard` autentica al usuario.
3. `TenantMembershipGuard` lee `X-Tenant-Id`, obtiene `userId`, valida membresia activa en `tenant_users` y enriquece `req` con:
   - `tenantId`
   - `userId`
   - `membershipRole`
4. `RolesGuard` usa `membershipRole` para validar `@Roles(...)`.
5. El servicio vuelve a abrir una transaccion Prisma y setea contexto SQL:
   - `set_config('app.user_id', ...)`
   - `set_config('app.tenant_id', ...)`
6. PostgreSQL aplica RLS usando esas variables de sesion.

### Regla critica
No confiar en RLS si la transaccion no seteo `app.user_id` y `app.tenant_id`. El guard por si solo no reemplaza el contexto dentro de Prisma.

## Patrones de Codigo
- DTOs y respuestas HTTP usan `camelCase`.
- Prisma y SQL usan `snake_case`.
- Los IDs en DB son `BigInt`; la mayoria de responses los convierten a `number`.
- Algunos `Decimal` tambien se convierten a `number` al responder.
- La validacion suele estar en cada controlador con `ValidationPipe`; no existe pipe global equivalente en `main.ts`.
- Los servicios repiten helpers locales como `withTenantContext`, `withUserContext`, `parseId` y normalizadores.
- Las consultas tenant-scoped suelen usar claves compuestas Prisma como `id_tenant_id_persona`, `id_tenant_id_faena`, etc.
- `tenants` y `tenant-invitations` son user-scoped antes que tenant-scoped, por eso suelen usar `withUserContext` y solo setean `app.user_id`.

## Guia Para Nuevas Features Tenant-Scoped
- Proteger controladores con `@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)`.
- Leer `X-Tenant-Id` usando el helper existente y no parsearlo ad hoc.
- Pasar `tenantId` y `userId` de forma explicita al servicio.
- Encapsular acceso a DB en un helper tipo `withTenantContext`.
- Dentro de la transaccion, setear `app.user_id` y `app.tenant_id`.
- Validar membresia activa antes de operar.
- Seguir el patron de DTO camelCase -> Prisma snake_case -> response camelCase.
- Cuando la entidad sea tenant-scoped, usar claves compuestas Prisma y no IDs globales sueltos.

## Mapa Funcional
- `auth`: registro, login, verificacion de correo, forgot/reset/change password, tokens hash y login logs.
- `tenants`: CRUD de tenants y ownership por `owner_user_id`.
- `tenant-invitations`: crear, aceptar, rechazar y listar invitaciones recibidas/enviadas.
- `personas` y `persona_condiciones`: padron y trazabilidad de estados.
- `terrenos` y `persona-terrenos`: lotes y relacion persona-lote.
- `juntas-directivas` y `junta-miembros`: gobierno y miembros de junta.
- `faenas` y `faena-participaciones`: actividades, asistencia y anulaciones.
- `asambleas` y `asistencia-asamblea`: reuniones y control de participacion.
- `bienes` y `caja-movimientos`: activos y movimientos de caja.

## Fuente de Verdad de Datos
- Hay dos vistas de la base:
  - SQL manual en `db/base de datos/`
  - esquema Prisma en `prisma/schema.prisma`
- Para entender estructura, constraints y RLS, tomar `db/base de datos/juntas_cloud v3.sql` como referencia principal.
- `prisma/schema.prisma` refleja el modelo consumido por la app y expone varias tablas con comentarios de RLS.
- Scripts como `juntas_cloud.sql`, `Datos.sql` y `DatosBlanco.sql` parecen seeds o variantes historicas; revisarlos antes de asumir que son la version vigente.

## Caveats Importantes
- `README.md` actual es boilerplate de Nest y no describe el proyecto real.
- `auth-users` es un CRUD global sin guards; tratarlo como area sensible y no usarlo como patron de seguridad para modulos nuevos.
- La paginacion no es uniforme:
  - `tenants`: `skip/take`
  - `personas`: `page/pageSize`
  - `caja-movimientos`: `page/limit`
- El borrado tampoco es uniforme:
  - `tenants`: soft delete via `estado = INACTIVO`
  - `personas`: retiro logico via `estado = RETIRADO`
  - `faena-participaciones`, `asistencia-asamblea`, `caja-movimientos`: anulacion
  - varios modulos restantes usan `delete` real
- Hay posibles desalineaciones entre enums permitidos en SQL y DTOs TypeScript; revisar ambos lados antes de tocar estados.
- El e2e actual (`test/app.e2e-spec.ts`) es solo el ejemplo base de Nest sobre `AppController`; no cubre flujos reales del dominio.

## Reglas Para Futuros Agentes
- No asumir que todos los endpoints comparten el mismo contrato de paginacion.
- No asumir que todos los `remove` hacen lo mismo; revisar si la entidad usa delete, soft delete o anulacion.
- Si cambias DB, revisar tanto SQL como Prisma antes de modificar servicios o DTOs.
- Si agregas un modulo tenant-scoped, seguir el patron guards + helper transaccional + contexto RLS + mapping DTO.
- Si tocas auth o membresias, revisar tambien `tenant-invitations`, `tenant_users`, `tenants` y los guards comunes.
- No usar `auth-users` como modelo de referencia para nuevos endpoints protegidos.
