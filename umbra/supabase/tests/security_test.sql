-- =============================================================================
-- Pruebas de seguridad de la base de datos (RLS, permisos, límites).
-- Se ejecutan contra Supabase local dentro de una transacción que se deshace:
-- no dejan datos. Cada comprobación imprime «OK …»; cualquier fallo detiene
-- el script con «FALLO: …».
-- Uso: bash supabase/tests/run.sh
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
begin;

-- Identificadores de prueba
\set ana   '''a0000000-0000-4000-8000-000000000001'''
\set bea   '''a0000000-0000-4000-8000-000000000002'''
\set carlos '''a0000000-0000-4000-8000-000000000003'''
\set admin '''a0000000-0000-4000-8000-000000000004'''
\set mod   '''a0000000-0000-4000-8000-000000000005'''

insert into auth.users (id, email, aud, role) values
  (:ana, 'ana@seguridad.test', 'authenticated', 'authenticated'),
  (:bea, 'bea@seguridad.test', 'authenticated', 'authenticated'),
  (:carlos, 'carlos@seguridad.test', 'authenticated', 'authenticated'),
  (:admin, 'admin@seguridad.test', 'authenticated', 'authenticated'),
  (:mod, 'mod@seguridad.test', 'authenticated', 'authenticated');

update public.profiles p set username = v.u, display_name = v.n, onboarded_at = now() - interval '2 days',
  created_at = now() - interval '2 days'
from (values (:ana::uuid, 'ana_seg', 'Ana'), (:bea::uuid, 'bea_seg', 'Bea'), (:carlos::uuid, 'carlos_seg', 'Carlos'),
             (:admin::uuid, 'admin_seg', 'Admin'), (:mod::uuid, 'mod_seg', 'Mod')) as v(id, u, n)
where p.id = v.id;
update public.profiles set role = 'admin' where id = :admin;
update public.profiles set role = 'moderator' where id = :mod;

do $$ begin
  if (select count(*) from public.profiles where username like '%_seg') <> 5 then raise exception 'FALLO: perfiles automáticos'; end if;
  raise notice 'OK perfiles creados por el trigger de registro';
end $$;

-- ============================================================ Fases 1–2
set local role anon;
do $$ begin
  perform 1 from public.profiles limit 1;
  raise exception 'FALLO: anónimo lee perfiles';
exception when insufficient_privilege then raise notice 'OK anónimo sin acceso a perfiles'; end $$;
do $$ begin
  if (select count(*) from public.categories) < 12 then raise exception 'FALLO: categorías públicas'; end if;
  raise notice 'OK anónimo ve los territorios (portada)';
end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :ana;
do $$ begin
  update public.profiles set role = 'admin' where id = auth.uid();
  raise exception 'FALLO: escalada de rol';
exception when insufficient_privilege then raise notice 'OK nadie puede ascenderse'; end $$;
do $$ declare n int; begin
  update public.profiles set bio = 'x' where username = 'bea_seg';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: edita perfil ajeno'; end if;
  raise notice 'OK no se editan perfiles ajenos';
end $$;
do $$ begin
  update public.profiles set username = '<script>' where id = auth.uid();
  raise exception 'FALLO: nombre de usuario inválido';
exception when check_violation then raise notice 'OK nombre de usuario validado'; end $$;
do $$ begin
  insert into storage.objects (bucket_id, name) values ('avatars', 'a0000000-0000-4000-8000-000000000002/x.webp');
  raise exception 'FALLO: avatar en carpeta ajena';
exception when insufficient_privilege then raise notice 'OK avatares aislados por carpeta'; end $$;
do $$ begin
  perform public.set_my_interests(array['astronomia','uap','misterios'], array['uap','astronomia','misterios','debate']);
  raise exception 'FALLO: más de 3 favoritos';
exception when check_violation then raise notice 'OK límite de favoritos'; end $$;
select public.set_my_interests(array['astronomia','uap','bioconstruccion'], array['uap']);
reset role;
set local request.jwt.claim.sub = '';

-- ============================================================ Fase 3: comunidad
set local role authenticated;
set local request.jwt.claim.sub = :ana;
do $$ begin
  perform public.create_post('Sin fuentes', 'Afirmo algo documentado.', 'documented', 'ciencia');
  raise exception 'FALLO: documentado sin fuentes';
exception when check_violation then raise notice 'OK lo documentado exige fuentes'; end $$;
do $$ begin
  perform public.create_post('Imagen ajena', 'Texto', 'opinion', 'ciencia', false, '{}', '{}',
    array['a0000000-0000-4000-8000-000000000002/robada.webp']);
  raise exception 'FALLO: imagen de otra carpeta';
exception when invalid_parameter_value then raise notice 'OK imágenes solo de la carpeta propia'; end $$;
select public.create_post('Hilo de prueba', 'Hola @bea_seg, ¿qué opinas?', 'opinion', 'ciencia', false, '{}', array['prueba','seguridad']) as post_id \gset
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :bea;
do $$ declare n int; begin
  update public.posts set body = 'hackeado' where title = 'Hilo de prueba';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: edita publicación ajena'; end if;
  raise notice 'OK no se editan publicaciones ajenas';
end $$;
insert into public.comments (post_id, author_id, body) values (:'post_id', :bea, 'Comentario de Bea');
insert into public.post_reactions (post_id, user_id, type) values (:'post_id', :bea, 'valuable');
do $$ begin
  if (select reaction_count from public.posts where title = 'Hilo de prueba') <> 1 then raise exception 'FALLO: contador de reacciones'; end if;
  if (select comment_count from public.posts where title = 'Hilo de prueba') <> 1 then raise exception 'FALLO: contador de comentarios'; end if;
  raise notice 'OK contadores de reacciones y comentarios';
end $$;
do $$ begin
  if not exists (select 1 from public.notifications where user_id = auth.uid() and type = 'mention') then
    raise exception 'FALLO: aviso de mención';
  end if;
  raise notice 'OK aviso de mención a Bea';
end $$;
insert into public.reports (reporter_id, target_type, target_id, reason) values (:bea, 'post', :'post_id', 'spam');
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :ana;
do $$ begin
  if not exists (select 1 from public.notifications where user_id = auth.uid() and type = 'comment') then
    raise exception 'FALLO: aviso de comentario al autor';
  end if;
  if (select count(*) from public.reports) <> 0 then raise exception 'FALLO: Ana ve denuncias ajenas'; end if;
  raise notice 'OK aviso de comentario y denuncias confidenciales';
end $$;
reset role;
set local request.jwt.claim.sub = '';

-- Cierre de conversación por el equipo
set local role authenticated;
set local request.jwt.claim.sub = :mod;
select public.mod_set_post_flags(:'post_id', true, false);
do $$ begin
  if (select count(*) from public.reports) < 1 then raise exception 'FALLO: el equipo no ve denuncias'; end if;
  raise notice 'OK el equipo ve las denuncias';
end $$;
reset role;
set local request.jwt.claim.sub = '';
set local role authenticated;
set local request.jwt.claim.sub = :bea;
do $$ begin
  insert into public.comments (post_id, author_id, body)
  select id, auth.uid(), 'otro' from public.posts where title = 'Hilo de prueba';
  raise exception 'FALLO: comenta en conversación cerrada';
exception when insufficient_privilege then raise notice 'OK conversación cerrada'; end $$;
reset role;
set local request.jwt.claim.sub = '';

-- Miembro restringido: lee y reacciona, no publica
update public.profiles set role = 'restricted' where id = :carlos;
set local role authenticated;
set local request.jwt.claim.sub = :carlos;
do $$ begin
  perform public.create_post('No debería', 'Texto', 'opinion', 'debate');
  raise exception 'FALLO: restringido publica';
exception when insufficient_privilege then raise notice 'OK miembro restringido no publica'; end $$;
insert into public.post_reactions (post_id, user_id, type) values (:'post_id', :carlos, 'curious');
reset role;
set local request.jwt.claim.sub = '';
update public.profiles set role = 'member' where id = :carlos;

-- ============================================================ Fase 4: conexiones y mensajes
set local role authenticated;
set local request.jwt.claim.sub = :ana;
insert into public.connections (requester_id, addressee_id, message) values (:ana, :bea, 'Hola');
do $$ begin
  perform public.start_conversation('a0000000-0000-4000-8000-000000000002');
  raise exception 'FALLO: conversación sin conexión';
exception when insufficient_privilege then raise notice 'OK solo se escribe a conexiones aceptadas'; end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :bea;
update public.connections set status = 'accepted' where requester_id = :ana and addressee_id = :bea;
select public.start_conversation(:ana) as convo_id \gset
insert into public.messages (conversation_id, sender_id, body) values (:'convo_id', :bea, 'Mensaje privado');
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :carlos;
do $$ begin
  if (select count(*) from public.messages) <> 0 then raise exception 'FALLO: tercero lee mensajes'; end if;
  if (select count(*) from public.connections) <> 0 then raise exception 'FALLO: tercero ve conexiones'; end if;
  if (select count(*) from public.notifications where user_id <> auth.uid()) <> 0 then raise exception 'FALLO: avisos ajenos'; end if;
  raise notice 'OK mensajes, conexiones y avisos privados';
end $$;
do $$ begin
  insert into public.messages (conversation_id, sender_id, body)
  select id, auth.uid(), 'intruso' from public.conversations limit 1;
  if found then raise exception 'FALLO: tercero escribe'; end if;
  raise notice 'OK un tercero no puede escribir en conversaciones ajenas';
exception when insufficient_privilege then raise notice 'OK un tercero no puede escribir en conversaciones ajenas'; end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :ana;
do $$ begin
  if (select count(*) from public.messages) <> 1 then raise exception 'FALLO: participante no lee'; end if;
  raise notice 'OK quien participa lee la conversación';
end $$;
insert into public.blocks (blocker_id, blocked_id) values (:ana, :bea);
do $$ begin
  if exists (select 1 from public.connections) then raise exception 'FALLO: el bloqueo no corta la conexión'; end if;
  if public.can_message((select id from public.conversations limit 1)) then raise exception 'FALLO: se puede escribir tras bloquear'; end if;
  raise notice 'OK bloquear corta conexión y mensajería';
end $$;
reset role;
set local request.jwt.claim.sub = '';
set local role authenticated;
set local request.jwt.claim.sub = :bea;
do $$ begin
  insert into public.connections (requester_id, addressee_id) values ('a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001');
  raise exception 'FALLO: solicitud a quien te bloqueó';
exception when insufficient_privilege then raise notice 'OK no se puede solicitar a quien te bloqueó'; end $$;
reset role;
set local request.jwt.claim.sub = '';

-- ============================================================ Fase 5: círculos y proyectos
set local role authenticated;
set local request.jwt.claim.sub = :ana;
select public.create_circle('Círculo privado de prueba', 'Solo miembros', 'private') as private_circle \gset
select public.create_circle('Círculo secreto de prueba', 'Por invitación', 'invite') as secret_circle \gset
select public.create_post('En el círculo', 'Contenido interno', 'opinion', null, false, '{}', '{}', '{}', :'private_circle') as circle_post \gset
insert into public.circle_messages (circle_id, sender_id, body) values (:'private_circle', :ana, 'Chat interno');
select public.create_project('Proyecto de prueba', 'Resumen', 'Descripción', array['Objetivo'], 'Ayuda', 'active', 'España', 'Asturias', array['bioconstruccion']) as project_id \gset
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :carlos;
do $$ begin
  if not exists (select 1 from public.circles where name = 'Círculo privado de prueba') then raise exception 'FALLO: el privado no aparece en el listado'; end if;
  if exists (select 1 from public.circles where name = 'Círculo secreto de prueba') then raise exception 'FALLO: el secreto es visible'; end if;
  if exists (select 1 from public.posts where title = 'En el círculo') then raise exception 'FALLO: publicación de círculo privado visible'; end if;
  if exists (select 1 from public.circle_messages) then raise exception 'FALLO: chat de círculo visible'; end if;
  raise notice 'OK privacidad de círculos privados y por invitación';
end $$;
do $$ begin
  if public.join_circle((select id from public.circles where name = 'Círculo privado de prueba')) <> 'requested' then
    raise exception 'FALLO: unirse a privado';
  end if;
  raise notice 'OK unirse a un círculo privado crea una solicitud';
end $$;
do $$ begin
  perform public.create_post('Intruso', 'Texto', 'opinion', null, false, '{}', '{}', '{}',
    (select id from public.circles where name = 'Círculo privado de prueba'));
  raise exception 'FALLO: publica sin ser miembro';
exception when insufficient_privilege then raise notice 'OK solo los miembros publican en un círculo'; end $$;
do $$ begin
  insert into public.project_messages (project_id, sender_id, body, is_update)
  select id, auth.uid(), 'Novedad falsa', true from public.projects where title = 'Proyecto de prueba';
  raise exception 'FALLO: novedad sin participar';
exception when insufficient_privilege then raise notice 'OK solo quien participa publica novedades'; end $$;
insert into public.project_messages (project_id, sender_id, body) values (:'project_id', :carlos, 'Pregunta abierta');
reset role;
set local request.jwt.claim.sub = '';

-- Las menciones en un círculo privado no avisan a quien no puede leerlo
set local role authenticated;
set local request.jwt.claim.sub = :ana;
insert into public.comments (post_id, author_id, body) values (:'circle_post', :ana, 'Aviso a @carlos_seg');
reset role;
set local request.jwt.claim.sub = '';
do $$ begin
  if exists (select 1 from public.notifications where user_id = 'a0000000-0000-4000-8000-000000000003' and type = 'mention') then
    raise exception 'FALLO: aviso de contenido privado a un no miembro';
  end if;
  raise notice 'OK los avisos no filtran contenido privado';
end $$;

-- ============================================================ Fase 6: administración
set local role authenticated;
set local request.jwt.claim.sub = :ana;
do $$ begin
  perform public.admin_set_role('a0000000-0000-4000-8000-000000000002', 'admin');
  raise exception 'FALLO: miembro cambia roles';
exception when insufficient_privilege then raise notice 'OK un miembro no puede usar funciones de administración'; end $$;
do $$ begin
  perform * from public.admin_stats();
  raise exception 'FALLO: miembro ve estadísticas';
exception when insufficient_privilege then raise notice 'OK estadísticas solo para el equipo'; end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :mod;
do $$ begin
  perform public.admin_set_status('a0000000-0000-4000-8000-000000000002', 'banned', 'prueba');
  raise exception 'FALLO: moderación expulsa';
exception when insufficient_privilege then raise notice 'OK moderación no puede expulsar'; end $$;
select public.admin_set_status(:bea, 'suspended', 'prueba');
do $$ begin
  if (select email from public.admin_list_members('bea_seg') limit 1) is not null then raise exception 'FALLO: moderación ve correos'; end if;
  raise notice 'OK moderación suspende y no ve correos';
end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :bea;
do $$ begin
  if (select count(*) from public.profiles where id <> auth.uid()) <> 0 then raise exception 'FALLO: suspendida ve perfiles'; end if;
  raise notice 'OK una cuenta suspendida queda aislada';
end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :admin;
do $$ begin
  if (select email from public.admin_list_members('bea_seg') limit 1) is null then raise exception 'FALLO: admin sin correo'; end if;
  raise notice 'OK administración ve el correo para contactar';
end $$;
reset role;
set local request.jwt.claim.sub = '';

-- Límite de frecuencia: 5 publicaciones cada 10 minutos
set local role authenticated;
set local request.jwt.claim.sub = :carlos;
select public.create_post(null, 'Ráfaga ' || g, 'opinion') from generate_series(1, 5) g;
do $$ begin
  perform public.create_post(null, 'Ráfaga 6', 'opinion');
  raise exception 'FALLO: sin límite de frecuencia';
exception when sqlstate 'P0429' then raise notice 'OK límite de frecuencia de publicaciones'; end $$;
reset role;
set local request.jwt.claim.sub = '';

-- Registro cerrado
update public.site_settings set registration_open = false;
do $$ begin
  insert into auth.users (id, email, aud, role) values (gen_random_uuid(), 'nuevo@seguridad.test', 'authenticated', 'authenticated');
  raise exception 'FALLO: registro cerrado no aplicado';
exception when sqlstate 'P0403' then raise notice 'OK registro cerrado también en la base de datos'; end $$;

rollback;
\echo '✓ Pruebas de seguridad completadas (los datos de prueba se han deshecho)'
