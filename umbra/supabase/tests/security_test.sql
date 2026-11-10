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
  perform public.set_my_topics((select jsonb_agg(jsonb_build_object('topic_id', id, 'relation', 'interested', 'is_primary', true))
    from (select id from public.topics where status = 'approved' order by id limit 6) t));
  raise exception 'FALLO: más de 5 temas principales';
exception when check_violation then raise notice 'OK límite de 5 temas principales'; end $$;
select public.set_my_topics(jsonb_build_array(
  jsonb_build_object('topic_id', (select id from public.topics where slug = 'astronomia'), 'relation', 'learning', 'is_primary', true),
  jsonb_build_object('topic_id', (select id from public.topics where slug = 'uap'), 'relation', 'interested', 'is_primary', false),
  jsonb_build_object('topic_id', (select id from public.topics where slug = 'bioconstruccion'), 'relation', 'interested', 'is_primary', false)));
reset role;
set local request.jwt.claim.sub = '';

-- ============================================================ V2: catálogo y privacidad por apartado
-- Bea: ubicación privada e intereses solo para conexiones
set local role authenticated;
set local request.jwt.claim.sub = :bea;
update public.profiles set country = 'España', region = 'Asturias', bio = 'Hola' where id = auth.uid();
insert into public.profile_privacy (profile_id, location, interests) values (auth.uid(), 'private', 'connections');
select public.set_my_topics(jsonb_build_array(
  jsonb_build_object('topic_id', (select id from public.topics where slug = 'astronomia'), 'relation', 'can_teach', 'is_primary', true)));
select public.set_my_goals(array['learn', 'debate']::public.user_goal[]);
do $$ begin
  update public.profiles set cover_path = 'a0000000-0000-4000-8000-000000000001/x.webp' where id = auth.uid();
  raise exception 'FALLO: portada de carpeta ajena';
exception when check_violation then raise notice 'OK la portada solo puede ser un archivo propio'; end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :ana;
do $$ begin
  perform country from public.profiles where username = 'bea_seg';
  raise exception 'FALLO: lectura directa de la ubicación';
exception when insufficient_privilege then raise notice 'OK los datos personales no se leen directamente de la tabla de perfiles'; end $$;
do $$ begin
  if (select country from public.profile_view('bea_seg')) is not null then raise exception 'FALLO: ubicación privada visible'; end if;
  if (select bio from public.profile_view('bea_seg')) <> 'Hola' then raise exception 'FALLO: presentación pública oculta'; end if;
  if (select country from public.member_card_for('a0000000-0000-4000-8000-000000000002')) is not null then raise exception 'FALLO: ubicación en tarjeta'; end if;
  raise notice 'OK privacidad por apartado: la ubicación privada no se muestra';
end $$;
do $$ begin
  if exists (select 1 from public.profile_topics_for('a0000000-0000-4000-8000-000000000002')) then raise exception 'FALLO: intereses solo-conexiones visibles'; end if;
  if exists (select 1 from public.profile_topics where profile_id = 'a0000000-0000-4000-8000-000000000002') then raise exception 'FALLO: tabla de temas sin privacidad'; end if;
  if exists (select 1 from public.profile_goals_for('a0000000-0000-4000-8000-000000000002')) then raise exception 'FALLO: objetivos visibles'; end if;
  raise notice 'OK intereses y objetivos «solo conexiones» ocultos para quien no es conexión';
end $$;
do $$ declare n int; begin
  update public.profile_privacy set location = 'public' where profile_id = 'a0000000-0000-4000-8000-000000000002';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: cambia la privacidad ajena'; end if;
  raise notice 'OK nadie cambia la privacidad de otra persona';
end $$;
do $$ begin
  insert into public.profile_goals (profile_id, goal) values ('a0000000-0000-4000-8000-000000000002', 'learn');
  raise exception 'FALLO: objetivos ajenos';
exception when insufficient_privilege then raise notice 'OK nadie escribe objetivos ajenos'; end $$;
-- Ana propone un tema: queda pendiente y solo lo ven ella y el equipo
select public.propose_topic('Relojería de sol', 'ingenieria');
do $$ begin
  if (select status from public.topics where slug = 'relojeria-de-sol') <> 'pending' then raise exception 'FALLO: propuesta no pendiente'; end if;
  if public.propose_topic('Relojería  de sol', 'ingenieria') <> (select id from public.topics where slug = 'relojeria-de-sol') then
    raise exception 'FALLO: propuesta duplicada';
  end if;
  raise notice 'OK las propuestas quedan pendientes y no se duplican';
end $$;
do $$ begin
  perform public.admin_review_topic((select id from public.topics where slug = 'relojeria-de-sol'), true, null);
  raise exception 'FALLO: miembro aprueba temas';
exception when insufficient_privilege then raise notice 'OK solo el equipo aprueba temas'; end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :carlos;
do $$ begin
  if exists (select 1 from public.topics where slug = 'relojeria-de-sol') then raise exception 'FALLO: propuesta ajena visible'; end if;
  if exists (select 1 from public.search_topics('relojeria')) then raise exception 'FALLO: propuesta ajena en el buscador'; end if;
  raise notice 'OK las propuestas pendientes no se ven fuera';
end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :mod;
do $$ begin
  perform public.admin_merge_topics((select id from public.topics where slug = 'relojeria-de-sol'), (select id from public.topics where slug = 'astronomia'));
  raise exception 'FALLO: moderación fusiona';
exception when insufficient_privilege then raise notice 'OK fusionar temas es solo de administración'; end $$;
select public.admin_review_topic((select id from public.topics where slug = 'relojeria-de-sol'), true, null);
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :carlos;
do $$ begin
  if not exists (select 1 from public.search_topics('relojeria')) then raise exception 'FALLO: aprobado no visible'; end if;
  raise notice 'OK un tema aprobado aparece en el buscador';
end $$;
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
  perform public.create_post(p_title => 'Imagen ajena', p_body => 'Texto', p_kind => 'opinion', p_forum => 'ciencia',
    p_image_paths => array['a0000000-0000-4000-8000-000000000002/robada.webp']);
  raise exception 'FALLO: imagen de otra carpeta';
exception when invalid_parameter_value then raise notice 'OK imágenes solo de la carpeta propia'; end $$;
select public.create_post(p_title => 'Hilo de prueba', p_body => 'Hola @bea_seg, ¿qué opinas?', p_kind => 'opinion',
  p_forum => 'ciencia', p_tags => array['prueba','seguridad']) as post_id \gset
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

-- ============================================================ V2: foros, encuestas, adjuntos y etiquetas
set local role authenticated;
set local request.jwt.claim.sub = :ana;
do $$ begin
  perform public.create_post(p_title => null, p_body => 'Sin título', p_kind => 'opinion', p_forum => 'ciencia');
  raise exception 'FALLO: foro sin título';
exception when check_violation then raise notice 'OK fuera del Ágora el título es obligatorio'; end $$;
do $$ begin
  perform public.create_post(p_title => 'Mal sitio', p_body => 'Texto', p_kind => 'opinion', p_forum => 'ciencia', p_category => 'bioconstruccion');
  raise exception 'FALLO: subcategoría de otro foro';
exception when invalid_parameter_value then raise notice 'OK la subcategoría pertenece a su foro'; end $$;
do $$ declare v uuid; begin
  v := public.create_post(p_title => 'Sobre adobe', p_body => 'Muros de tierra cruda', p_kind => 'opinion', p_category => 'bioconstruccion');
  if (select forum_slug from public.posts where id = v) <> 'naturaleza' then
    raise exception 'FALLO: foro deducido';
  end if;
  raise notice 'OK el foro se deduce de la subcategoría';
end $$;
select public.create_post(p_title => '¿Qué observamos?', p_body => 'Elige una', p_kind => 'open_question', p_forum => 'universo',
  p_type => 'poll', p_poll_options => array['Luna', 'Saturno', 'Luna']) as poll_post \gset
do $$ begin
  if (select count(*) from public.poll_options o join public.posts p on p.id = o.post_id where p.title = '¿Qué observamos?') <> 2 then
    raise exception 'FALLO: opciones duplicadas';
  end if;
  raise notice 'OK las opciones repetidas de una encuesta se unifican';
end $$;
insert into public.post_attachments (post_id, author_id, path, name, mime, size)
values (:'poll_post', :ana, 'a0000000-0000-4000-8000-000000000001/a0000000-0000-4000-8000-0000000000aa.pdf', 'carta.pdf', 'application/pdf', 1000);
do $$ begin
  insert into public.post_attachments (post_id, author_id, path, name, mime, size)
  select id, auth.uid(), 'a0000000-0000-4000-8000-000000000002/a0000000-0000-4000-8000-0000000000bb.pdf', 'x.pdf', 'application/pdf', 10
  from public.posts where title = '¿Qué observamos?';
  raise exception 'FALLO: adjunto de carpeta ajena';
exception when invalid_parameter_value then raise notice 'OK los adjuntos solo pueden ser archivos propios'; end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :bea;
do $$ begin
  perform public.vote_poll((select id from public.posts where title = '¿Qué observamos?'),
    (select array_agg(id) from public.poll_options o where o.post_id = (select id from public.posts where title = '¿Qué observamos?')));
  raise exception 'FALLO: dos votos en respuesta única';
exception when invalid_parameter_value then raise notice 'OK una encuesta de respuesta única admite un solo voto'; end $$;
select public.vote_poll(:'poll_post', array[(select min(id) from public.poll_options where post_id = :'poll_post')]);
do $$ begin
  insert into public.post_attachments (post_id, author_id, path, name, mime, size)
  select id, auth.uid(), 'a0000000-0000-4000-8000-000000000002/a0000000-0000-4000-8000-0000000000cc.pdf', 'y.pdf', 'application/pdf', 10
  from public.posts where title = '¿Qué observamos?';
  raise exception 'FALLO: adjunto en publicación ajena';
exception when insufficient_privilege then raise notice 'OK nadie adjunta archivos a publicaciones ajenas'; end $$;
do $$ begin
  insert into storage.objects (bucket_id, name) values ('post-files', 'a0000000-0000-4000-8000-000000000001/z.pdf');
  raise exception 'FALLO: archivo en carpeta ajena';
exception when insufficient_privilege then raise notice 'OK archivos aislados por carpeta'; end $$;
do $$ begin
  if (select count(*) from public.post_attachments a join public.posts p on p.id = a.post_id where p.title = '¿Qué observamos?') <> 1 then
    raise exception 'FALLO: adjunto no visible';
  end if;
  raise notice 'OK quien lee la publicación ve sus adjuntos';
end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :ana;
do $$ begin
  if exists (select 1 from public.poll_votes) then raise exception 'FALLO: votos ajenos visibles'; end if;
  if (select sum(votes) from public.poll_results((select id from public.posts where title = '¿Qué observamos?'))) <> 1 then
    raise exception 'FALLO: recuento';
  end if;
  raise notice 'OK votos anónimos: solo se ven los totales';
end $$;
select public.close_poll(:'poll_post');
do $$ begin
  perform public.admin_update_tag('prueba', 'prueba', 'blocked');
  raise exception 'FALLO: miembro modera etiquetas';
exception when insufficient_privilege then raise notice 'OK solo el equipo modera etiquetas'; end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :bea;
do $$ begin
  perform public.vote_poll((select id from public.posts where title = '¿Qué observamos?'), '{}');
  raise exception 'FALLO: vota en encuesta cerrada';
exception when invalid_parameter_value then raise notice 'OK no se vota en una encuesta cerrada'; end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :mod;
select public.admin_update_tag('seguridad', 'seguridad', 'blocked');
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :ana;
do $$ begin
  perform public.create_post(p_title => 'Con etiqueta bloqueada', p_body => 'Probando etiquetas', p_kind => 'opinion', p_forum => 'agora', p_tags => array['Seguridad']);
  raise exception 'FALLO: etiqueta bloqueada aceptada';
exception when check_violation then raise notice 'OK una etiqueta bloqueada no se puede usar'; end $$;
reset role;
set local request.jwt.claim.sub = '';

-- ============================================================ Biblioteca
set local role authenticated;
set local request.jwt.claim.sub = :ana;
do $$ begin
  insert into public.books (slug, title, authors) values ('libro-directo', 'Libro directo', 'Nadie');
  raise exception 'FALLO: alta directa de libros';
exception when insufficient_privilege then raise notice 'OK los libros solo se crean con una recomendación'; end $$;
select public.recommend_book(p_title => 'Lectura segura', p_authors => 'Autoría de prueba', p_body => 'Un clásico de la divulgación que cambia la forma de mirar el cielo.', p_level => 'intro', p_rating => 5::smallint) as book_slug \gset
do $$ begin
  if public.recommend_book(p_title => 'LECTURA SEGURA', p_authors => 'autoria  de prueba', p_body => 'Lo releo y lo vuelvo a recomendar, sigue vigente.', p_level => 'intro')
     <> (select slug from public.books where title = 'Lectura segura') then
    raise exception 'FALLO: ficha duplicada';
  end if;
  if (select rec_count from public.books where title = 'Lectura segura') <> 1 then raise exception 'FALLO: recomendación duplicada'; end if;
  raise notice 'OK sin fichas duplicadas y una recomendación por persona';
end $$;
do $$ begin
  perform public.recommend_book(p_title => 'Otro', p_authors => 'Alguien', p_body => 'Portada robada de otra carpeta de usuario.', p_level => 'intro',
    p_cover_path => 'a0000000-0000-4000-8000-000000000002/libro.webp');
  raise exception 'FALLO: portada ajena';
exception when invalid_parameter_value then raise notice 'OK la portada de un libro es un archivo propio'; end $$;
select public.set_book_shelf((select id from public.books where title = 'Lectura segura'), 'want');
do $$ begin
  insert into public.book_recommendation_votes (recommendation_id, user_id)
  select id, auth.uid() from public.book_recommendations where user_id = auth.uid() limit 1;
  raise exception 'FALLO: voto a la propia recomendación';
exception when insufficient_privilege then raise notice 'OK nadie se vota a sí mismo como útil'; end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :bea;
do $$ declare n int; begin
  if exists (select 1 from public.book_shelves) then raise exception 'FALLO: estantería ajena visible'; end if;
  if (select want from public.book_shelf_counts((select id from public.books where title = 'Lectura segura'))) <> 1 then raise exception 'FALLO: totales'; end if;
  update public.book_recommendations set body = 'Texto cambiado por otra persona, no debería poder.' where user_id <> auth.uid();
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: edita recomendación ajena'; end if;
  raise notice 'OK estanterías privadas (solo totales) y recomendaciones ajenas protegidas';
end $$;
do $$ begin
  perform public.update_book((select id from public.books where title = 'Lectura segura'), 'Lectura segura 2', 'Autoría de prueba');
  raise exception 'FALLO: corrige ficha ajena';
exception when insufficient_privilege then raise notice 'OK solo quien creó la ficha o el equipo la corrigen'; end $$;
insert into public.book_recommendation_votes (recommendation_id, user_id)
select id, auth.uid() from public.book_recommendations where book_id = (select id from public.books where title = 'Lectura segura');
do $$ begin
  if (select helpful_count from public.book_recommendations where book_id = (select id from public.books where title = 'Lectura segura')) <> 1 then
    raise exception 'FALLO: contador de útiles';
  end if;
  raise notice 'OK contador de «Me ha sido útil»';
end $$;
reset role;
set local request.jwt.claim.sub = '';

-- ============================================================ Red social: seguir, públicos y borradores
set local role authenticated;
set local request.jwt.claim.sub = :bea;
insert into public.posts (author_id, body, kind, post_type, image_paths, audience)
values (:bea, 'Solo para quien me sigue', 'opinion', 'photo', array['a0000000-0000-4000-8000-000000000002/f.webp'], 'followers');
insert into public.posts (author_id, body, kind, post_type, is_draft) values (:bea, 'Borrador secreto de Bea', 'opinion', 'debate', true);
do $$ begin
  insert into public.posts (author_id, body, kind, forum_slug, audience) values (auth.uid(), 'En un foro solo para seguidores', 'opinion', 'agora', 'followers');
  raise exception 'FALLO: foro con público restringido';
exception when check_violation then raise notice 'OK solo las publicaciones del perfil eligen su público'; end $$;
reset role;
set local request.jwt.claim.sub = '';

set local role authenticated;
set local request.jwt.claim.sub = :carlos;
do $$ begin
  if exists (select 1 from public.posts where body = 'Solo para quien me sigue') then raise exception 'FALLO: visible sin seguir'; end if;
  if exists (select 1 from public.posts where body = 'Borrador secreto de Bea') then raise exception 'FALLO: borrador ajeno visible'; end if;
  raise notice 'OK publicaciones para seguidores y borradores ocultos a terceros';
end $$;
insert into public.member_follows (follower_id, followed_id) values (:carlos, :bea);
do $$ begin
  if not exists (select 1 from public.posts where body = 'Solo para quien me sigue') then raise exception 'FALLO: seguidor no la ve'; end if;
  if exists (select 1 from public.posts where body = 'Borrador secreto de Bea') then raise exception 'FALLO: borrador visible al seguidor'; end if;
  if (select followers from public.follow_stats('a0000000-0000-4000-8000-000000000002')) < 1 then raise exception 'FALLO: recuento'; end if;
  raise notice 'OK al seguir se ve lo publicado para seguidores (nunca los borradores)';
end $$;
do $$ begin
  insert into public.member_follows (follower_id, followed_id) values ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002');
  raise exception 'FALLO: seguir en nombre de otra persona';
exception when insufficient_privilege then raise notice 'OK nadie sigue en nombre de otra persona'; end $$;
reset role;
set local request.jwt.claim.sub = '';

-- Miembro restringido: lee y reacciona, no publica
update public.profiles set role = 'restricted' where id = :carlos;
set local role authenticated;
set local request.jwt.claim.sub = :carlos;
do $$ begin
  perform public.create_post(p_title => 'No debería', p_body => 'Texto', p_kind => 'opinion', p_forum => 'agora');
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
select public.create_post(p_title => 'En el círculo', p_body => 'Contenido interno', p_kind => 'opinion', p_circle => :'private_circle') as circle_post \gset
insert into public.circle_messages (circle_id, sender_id, body) values (:'private_circle', :ana, 'Chat interno');
select public.create_project('Proyecto de prueba', 'Resumen', 'Descripción', array['Objetivo'], 'Ayuda', 'active', 'España', 'Asturias',
  'arquitectura', array[(select id from public.topics where slug = 'bioconstruccion')]) as project_id \gset
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
  perform public.create_post(p_title => 'Intruso', p_body => 'Texto', p_kind => 'opinion',
    p_circle => (select id from public.circles where name = 'Círculo privado de prueba'));
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
