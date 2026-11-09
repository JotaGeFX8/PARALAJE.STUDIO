-- Pruebas de seguridad. Cada bloque debe terminar en "OK".
\set ON_ERROR_STOP on
insert into auth.users values
 ('11111111-1111-1111-1111-111111111111','ana@x.test'),
 ('22222222-2222-2222-2222-222222222222','bo@x.test'),
 ('33333333-3333-3333-3333-333333333333','root@x.test');
-- el trigger crea perfiles
select count(*) = 3 as perfiles_creados from public.profiles;
update public.profiles set role='admin' where id='33333333-3333-3333-3333-333333333333';
update public.profiles set status='suspended' where id='22222222-2222-2222-2222-222222222222';

-- Anónimo: no ve perfiles, sí categorías
set role anon;
do $$ begin
  perform 1 from public.profiles; raise exception 'FALLO: anon lee perfiles';
exception when insufficient_privilege then raise notice 'OK anon sin perfiles'; end $$;
select count(*) = 12 as anon_ve_categorias from public.categories;
reset role;

-- Ana (miembro activo)
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select count(*) = 2 as ana_ve_activos_no_suspendidos from public.profiles;
update public.profiles set username='ana_lux', bio='hola' where id = auth.uid();
-- no puede escalar privilegios
do $$ begin
  update public.profiles set role='admin' where id = auth.uid();
  raise exception 'FALLO: escalada de rol';
exception when insufficient_privilege then raise notice 'OK rol protegido'; end $$;
-- no puede editar a otro (0 filas)
with u as (update public.profiles set bio='hack' where id='33333333-3333-3333-3333-333333333333' returning 1)
select count(*) = 0 as ana_no_edita_ajenos from u;
-- intereses
insert into public.profile_interests (profile_id, interest_slug) values (auth.uid(), 'uap');
do $$ begin
  insert into public.profile_interests (profile_id, interest_slug) values ('33333333-3333-3333-3333-333333333333','uap');
  raise exception 'FALLO: interés ajeno';
exception when insufficient_privilege then raise notice 'OK no inserta intereses ajenos'; end $$;
-- username inválido
do $$ begin
  update public.profiles set username='<script>' where id = auth.uid();
  raise exception 'FALLO: username inválido aceptado';
exception when check_violation then raise notice 'OK username validado'; end $$;
-- avatar: carpeta propia sí, ajena no
insert into storage.objects (bucket_id, name) values ('avatars','11111111-1111-1111-1111-111111111111/a.webp');
do $$ begin
  insert into storage.objects (bucket_id, name) values ('avatars','33333333-3333-3333-3333-333333333333/a.webp');
  raise exception 'FALLO: avatar en carpeta ajena';
exception when insufficient_privilege then raise notice 'OK avatar carpeta ajena bloqueada'; end $$;
reset role;

-- Bo (suspendido): solo se ve a sí mismo
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select count(*) = 1 as suspendido_solo_se_ve_a_si from public.profiles;
with u as (update public.profiles set bio='sigo aquí' where id = auth.uid() returning 1)
select count(*) = 0 as suspendido_no_edita_perfil from u;
do $$ begin
  insert into storage.objects (bucket_id, name) values ('avatars','22222222-2222-2222-2222-222222222222/a.webp');
  raise exception 'FALLO: suspendido sube avatar';
exception when insufficient_privilege then raise notice 'OK suspendido sin subida de avatar'; end $$;
do $$ begin
  perform public.set_my_interests(array['uap']);
  raise exception 'FALLO: suspendido cambia intereses';
exception when insufficient_privilege then raise notice 'OK suspendido sin cambios de intereses'; end $$;
reset role;

-- Admin: ve todo y puede editar perfiles ajenos (campos públicos)
set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select count(*) = 3 as admin_ve_todo from public.profiles;
with u as (update public.profiles set bio='moderado' where id='11111111-1111-1111-1111-111111111111' returning 1)
select count(*) = 1 as admin_modera from u;
reset role;

-- Intereses atómicos: reemplaza, marca favoritos y respeta límites
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select public.set_my_interests(array['astronomia','bioconstruccion','misterios'], array['astronomia']);
select public.set_my_interests(array['astronomia','bioconstruccion','misterios','uap'], array['uap']);
select count(*) = 4 and count(*) filter (where is_favorite) = 1
  as intereses_reemplazados from public.profile_interests where profile_id = auth.uid();
do $$ begin
  perform public.set_my_interests(array['astronomia','x','y'], array['a','b','c','d']);
  raise exception 'FALLO: más de 3 favoritos';
exception when check_violation then raise notice 'OK límite favoritos'; end $$;
do $$ begin
  perform public.set_my_interests(array['no-existe']);
  raise exception 'FALLO: interés inexistente aceptado';
exception when foreign_key_violation then raise notice 'OK interés inexistente rechazado'; end $$;
reset role;
set role anon;
do $$ begin
  perform public.set_my_interests(array['uap']);
  raise exception 'FALLO: anon ejecuta set_my_interests';
exception when insufficient_privilege then raise notice 'OK anon sin rpc'; end $$;
reset role;

-- Eliminación de cuenta
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$ begin
  perform public.delete_my_account('otro');
  raise exception 'FALLO: borrado sin confirmación válida';
exception when invalid_parameter_value then raise notice 'OK confirmación exigida'; end $$;
select public.delete_my_account('ANA_LUX');
reset role;
select not exists (select 1 from auth.users where id='11111111-1111-1111-1111-111111111111')
   and not exists (select 1 from public.profile_interests where profile_id='11111111-1111-1111-1111-111111111111')
   as cuenta_borrada_en_cascada;
set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
update public.profiles set username = 'root_admin' where id = auth.uid();
do $$ begin
  perform public.delete_my_account('root_admin');
  raise exception 'FALLO: único admin se autoelimina';
exception when insufficient_privilege then raise notice 'OK único admin protegido'; end $$;
reset role;
