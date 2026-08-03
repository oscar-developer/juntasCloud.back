select current_user;

select * from tenants;


select * from auth_users
where id_user =1;

update  auth_users set email_verified=true, email_verified_at = now()
where id_user =1;



-- Simular usuario autenticado dentro de una transacción:
BEGIN;
SELECT set_config('app.user_id', '1', true);

-- Crear tenant y convertirse en OWNER:
SELECT public.create_tenant(
  'Junta Directiva Residencial Los Jardines',
  'RUC',
  '20123456789',
  'Tenant principal'
);
COMMIT;



SELECT set_config('app.user_id', '1', false);
select * from tenants;
select * from tenant_users;

BEGIN;
SET LOCAL app.user_id = '1';
SELECT public.enviar_tenant_a_papelera(
  p_tenant_id => 2
);
COMMIT;

BEGIN;
SET LOCAL app.user_id = '1';
SELECT public.restaurar_tenant(
  p_tenant_id => 2
);
COMMIT;


BEGIN;
SET LOCAL app.user_id = '1';
SELECT public.eliminar_tenant_definitivamente(p_tenant_id =>2, p_confirmacion => 'ELIMINAR DEFINITIVAMENTE');
COMMIT;