-- =============================================================================
-- Migración 0007 · Administración, moderación, límites y antispam
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Configuración general (una sola fila)
-- -----------------------------------------------------------------------------
create table public.site_settings (
  id                boolean primary key default true check (id),
  registration_open boolean not null default true,
  welcome_message   text not null default '' check (char_length(welcome_message) <= 600),
  updated_at        timestamptz not null default now(),
  updated_by        uuid references public.profiles (id) on delete set null
);
insert into public.site_settings (id) values (true) on conflict do nothing;

revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
alter table public.site_settings enable row level security;
create policy "site_settings: lectura" on public.site_settings for select to anon, authenticated using (true);

-- Con el registro cerrado, Supabase Auth no puede crear usuarios nuevos.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce((select registration_open from public.site_settings where id), true) then
    raise exception 'El registro está cerrado temporalmente' using errcode = 'P0403';
  end if;
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Registro de acciones de moderación (auditoría)
-- -----------------------------------------------------------------------------
create table public.moderation_actions (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null check (char_length(action) between 2 and 40),
  target_type text not null check (char_length(target_type) between 2 and 20),
  target_id   text not null,
  note        text not null default '' check (char_length(note) <= 1000),
  created_at  timestamptz not null default now()
);
create index moderation_actions_idx on public.moderation_actions (created_at desc);

revoke all on public.moderation_actions from anon, authenticated;
grant select on public.moderation_actions to authenticated;
alter table public.moderation_actions enable row level security;
create policy "moderation_actions: equipo" on public.moderation_actions for select to authenticated
using (public.is_staff());

create or replace function public.log_moderation(p_action text, p_type text, p_id text, p_note text default '')
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.moderation_actions (actor_id, action, target_type, target_id, note)
  values (auth.uid(), p_action, p_type, p_id, left(coalesce(p_note, ''), 1000))
$$;
revoke all on function public.log_moderation(text, text, text, text) from public, anon, authenticated;

create or replace function public.require_staff()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Solo el equipo de moderación puede hacer esto' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo la administración puede hacer esto' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.require_staff(), public.require_admin() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Usuarios
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_role(p_user uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  if p_user = auth.uid() then
    raise exception 'No puedes cambiar tu propio rol' using errcode = '42501';
  end if;
  update public.profiles set role = p_role where id = p_user;
  if not found then
    raise exception 'El usuario no existe' using errcode = '22023';
  end if;
  perform public.log_moderation('role:' || p_role::text, 'profile', p_user::text, '');
end;
$$;

-- Moderación puede suspender y reactivar a miembros; solo administración expulsa
-- o actúa sobre cuentas del equipo.
create or replace function public.admin_set_status(p_user uuid, p_status public.account_status, p_reason text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.profiles;
begin
  perform public.require_staff();
  select * into target from public.profiles where id = p_user;
  if target is null then
    raise exception 'El usuario no existe' using errcode = '22023';
  end if;
  if p_user = auth.uid() then
    raise exception 'No puedes cambiar el estado de tu propia cuenta' using errcode = '42501';
  end if;
  if not public.is_admin() and (p_status = 'banned' or target.role in ('admin', 'moderator')) then
    raise exception 'Solo la administración puede expulsar o actuar sobre el equipo' using errcode = '42501';
  end if;
  update public.profiles set status = p_status where id = p_user;
  perform public.log_moderation('status:' || p_status::text, 'profile', p_user::text, p_reason);
  insert into public.notifications (user_id, actor_id, type, body)
  values (p_user, null, 'moderation',
    left(case p_status
      when 'active' then 'Tu cuenta vuelve a estar activa.'
      when 'suspended' then 'Tu cuenta ha sido suspendida. ' || coalesce(p_reason, '')
      else 'Tu cuenta ha sido cerrada. ' || coalesce(p_reason, '') end, 300));
end;
$$;

-- Listado de miembros para el panel (el correo solo lo ve administración).
create or replace function public.admin_list_members(
  p_query text default null,
  p_role public.user_role default null,
  p_status public.account_status default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid, username text, display_name text, avatar_url text, email text,
  role public.user_role, status public.account_status, created_at timestamptz, onboarded_at timestamptz,
  posts bigint, reports_against bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  return query
  select p.id, p.username::text, p.display_name, p.avatar_url,
    case when public.is_admin() then u.email::text else null end,
    p.role, p.status, p.created_at, p.onboarded_at,
    (select count(*) from public.posts x where x.author_id = p.id and x.deleted_at is null),
    (select count(*) from public.reports r where r.target_type = 'profile' and r.target_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  where (coalesce(p_query, '') = '' or p.username::text ilike '%' || p_query || '%'
         or coalesce(p.display_name, '') ilike '%' || p_query || '%'
         or (public.is_admin() and u.email ilike '%' || p_query || '%'))
    and (p_role is null or p.role = p_role)
    and (p_status is null or p.status = p_status)
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
end;
$$;

-- -----------------------------------------------------------------------------
-- Contenido
-- -----------------------------------------------------------------------------
create or replace function public.mod_delete_post(p_post uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author uuid;
  v_title text;
begin
  perform public.require_staff();
  update public.posts set deleted_at = now(), deleted_by = auth.uid()
  where id = p_post and deleted_at is null
  returning author_id, coalesce(title, left(body, 80)) into v_author, v_title;
  if v_author is null then
    raise exception 'La publicación no existe o ya estaba eliminada' using errcode = '22023';
  end if;
  perform public.log_moderation('delete', 'post', p_post::text, p_note);
  insert into public.notifications (user_id, type, body)
  values (v_author, 'moderation', left('Se ha retirado tu publicación «' || v_title || '». ' || coalesce(p_note, ''), 300));
end;
$$;

create or replace function public.mod_delete_comment(p_comment uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author uuid;
begin
  perform public.require_staff();
  select author_id into v_author from public.comments where id = p_comment and deleted_at is null;
  if v_author is null then
    raise exception 'El comentario no existe o ya estaba eliminado' using errcode = '22023';
  end if;
  perform public.delete_comment(p_comment);
  perform public.log_moderation('delete', 'comment', p_comment::text, p_note);
  insert into public.notifications (user_id, type, body)
  values (v_author, 'moderation', left('Se ha retirado uno de tus comentarios. ' || coalesce(p_note, ''), 300));
end;
$$;

create or replace function public.mod_delete_message(p_message uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  update public.messages set deleted_at = now(), body = '[eliminado]' where id = p_message and deleted_at is null;
  if not found then
    update public.circle_messages set deleted_at = now(), body = '[eliminado]' where id = p_message and deleted_at is null;
  end if;
  if not found then
    update public.project_messages set deleted_at = now(), body = '[eliminado]' where id = p_message and deleted_at is null;
  end if;
  perform public.log_moderation('delete', 'message', p_message::text, p_note);
end;
$$;

create or replace function public.mod_set_post_flags(p_post uuid, p_locked boolean, p_pinned boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  update public.posts set is_locked = coalesce(p_locked, is_locked), is_pinned = coalesce(p_pinned, is_pinned)
  where id = p_post;
  perform public.log_moderation('flags', 'post', p_post::text,
    'cerrada=' || coalesce(p_locked::text, '-') || ' fijada=' || coalesce(p_pinned::text, '-'));
end;
$$;

-- Reclasificar una aportación mal etiquetada (p. ej., hipótesis presentada como hecho).
create or replace function public.mod_reclassify_post(p_post uuid, p_kind public.post_kind, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author uuid;
  v_title text;
begin
  perform public.require_staff();
  update public.posts set kind = p_kind where id = p_post
  returning author_id, coalesce(title, left(body, 80)) into v_author, v_title;
  if v_author is null then
    raise exception 'La publicación no existe' using errcode = '22023';
  end if;
  perform public.log_moderation('reclassify:' || p_kind::text, 'post', p_post::text, p_note);
  insert into public.notifications (user_id, type, post_id, body)
  values (v_author, 'moderation', p_post,
    left('El equipo ha reclasificado tu publicación «' || v_title || '». ' || coalesce(p_note, ''), 300));
end;
$$;

create or replace function public.mod_delete_circle(p_circle uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  delete from public.circles where id = p_circle;
  perform public.log_moderation('delete', 'circle', p_circle::text, p_note);
end;
$$;

create or replace function public.mod_delete_project(p_project uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  delete from public.projects where id = p_project;
  perform public.log_moderation('delete', 'project', p_project::text, p_note);
end;
$$;

-- -----------------------------------------------------------------------------
-- Denuncias
-- -----------------------------------------------------------------------------

-- Vista previa del contenido denunciado (solo para el equipo). El equipo solo
-- puede leer un mensaje privado si ha sido denunciado.
create or replace function public.report_target_preview(p_report uuid)
returns table (title text, body text, author_id uuid, author_username text, link text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.reports;
begin
  perform public.require_staff();
  select * into r from public.reports where id = p_report;
  if r is null then
    return;
  end if;
  if r.target_type = 'post' then
    return query select coalesce(p.title, 'Publicación'), left(p.body, 600), p.author_id, a.username::text, '/p/' || p.id::text
      from public.posts p join public.profiles a on a.id = p.author_id where p.id = r.target_id;
  elsif r.target_type = 'comment' then
    return query select 'Comentario'::text, left(c.body, 600), c.author_id, a.username::text, '/p/' || c.post_id::text || '#c-' || c.id::text
      from public.comments c join public.profiles a on a.id = c.author_id where c.id = r.target_id;
  elsif r.target_type = 'profile' then
    return query select coalesce(p.display_name, p.username::text), left(p.bio, 600), p.id, p.username::text, '/miembros/' || p.username::text
      from public.profiles p where p.id = r.target_id;
  elsif r.target_type = 'message' then
    return query
      select 'Mensaje privado'::text, left(m.body, 600), m.sender_id, a.username::text, null::text
        from public.messages m join public.profiles a on a.id = m.sender_id where m.id = r.target_id
      union all
      select 'Mensaje de círculo'::text, left(m.body, 600), m.sender_id, a.username::text, '/circulos/' || m.circle_id::text || '?ver=chat'
        from public.circle_messages m join public.profiles a on a.id = m.sender_id where m.id = r.target_id
      union all
      select 'Mensaje de proyecto'::text, left(m.body, 600), m.sender_id, a.username::text, '/proyectos/' || m.project_id::text
        from public.project_messages m join public.profiles a on a.id = m.sender_id where m.id = r.target_id;
  elsif r.target_type = 'circle' then
    return query select c.name, left(c.description, 600), c.owner_id, a.username::text, '/circulos/' || c.slug
      from public.circles c join public.profiles a on a.id = c.owner_id where c.id = r.target_id;
  elsif r.target_type = 'project' then
    return query select p.title, left(p.summary || ' ' || p.description, 600), p.owner_id, a.username::text, '/proyectos/' || p.slug
      from public.projects p join public.profiles a on a.id = p.owner_id where p.id = r.target_id;
  end if;
end;
$$;

create or replace function public.mod_resolve_report(p_report uuid, p_status public.report_status, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  if p_status = 'open' then
    raise exception 'Estado no válido' using errcode = '22023';
  end if;
  update public.reports
  set status = p_status, resolved_by = auth.uid(), resolution_note = left(coalesce(p_note, ''), 1000), resolved_at = now()
  where id = p_report;
  perform public.log_moderation('report:' || p_status::text, 'report', p_report::text, p_note);
end;
$$;

-- -----------------------------------------------------------------------------
-- Categorías y configuración
-- -----------------------------------------------------------------------------
create or replace function public.admin_save_category(
  p_slug text, p_name text, p_description text, p_position smallint, p_archived boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text := public.slugify(p_slug);
begin
  perform public.require_admin();
  if char_length(v_slug) < 2 then
    raise exception 'Identificador no válido' using errcode = '22023';
  end if;
  insert into public.categories (slug, name, description, position, is_archived)
  values (v_slug, trim(p_name), trim(coalesce(p_description, '')), coalesce(p_position, 99), coalesce(p_archived, false))
  on conflict (slug) do update
    set name = excluded.name, description = excluded.description,
        position = excluded.position, is_archived = excluded.is_archived;
  perform public.log_moderation('category', 'category', v_slug, p_name);
end;
$$;

create or replace function public.admin_update_settings(p_registration_open boolean, p_welcome text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  update public.site_settings
  set registration_open = p_registration_open, welcome_message = left(trim(coalesce(p_welcome, '')), 600),
      updated_at = now(), updated_by = auth.uid()
  where id;
  perform public.log_moderation('settings', 'site', 'general', case when p_registration_open then 'registro abierto' else 'registro cerrado' end);
end;
$$;

create or replace function public.admin_stats()
returns table (
  members bigint, members_week bigint, posts bigint, posts_week bigint, comments bigint,
  open_reports bigint, circles bigint, projects bigint, suspended bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  return query select
    (select count(*) from public.profiles where onboarded_at is not null),
    (select count(*) from public.profiles where onboarded_at > now() - interval '7 days'),
    (select count(*) from public.posts where deleted_at is null),
    (select count(*) from public.posts where deleted_at is null and created_at > now() - interval '7 days'),
    (select count(*) from public.comments where deleted_at is null),
    (select count(*) from public.reports where status = 'open'),
    (select count(*) from public.circles),
    (select count(*) from public.projects),
    (select count(*) from public.profiles where status <> 'active');
end;
$$;

-- -----------------------------------------------------------------------------
-- Límites de frecuencia y antispam (el equipo queda exento)
-- -----------------------------------------------------------------------------
create or replace function public.rate_check(p_count bigint, p_max integer, p_message text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_count >= p_max then
    raise exception '%', p_message using errcode = 'P0429';
  end if;
end;
$$;

create or replace function public.rate_limit_posts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_age interval;
  links integer;
begin
  if public.is_staff() then return new; end if;
  perform public.rate_check(
    (select count(*) from public.posts where author_id = new.author_id and created_at > now() - interval '10 minutes'),
    5, 'Has publicado mucho en poco tiempo. Espera unos minutos.');
  perform public.rate_check(
    (select count(*) from public.posts where author_id = new.author_id and created_at > now() - interval '1 day'),
    30, 'Has alcanzado el límite diario de publicaciones.');
  if exists (
    select 1 from public.posts
    where author_id = new.author_id and body = new.body and deleted_at is null and created_at > now() - interval '1 day'
  ) then
    raise exception 'Ya has publicado este mismo texto hoy.' using errcode = 'P0429';
  end if;
  select now() - created_at into account_age from public.profiles where id = new.author_id;
  links := (select count(*) from regexp_matches(new.body, 'https?://', 'g'));
  if account_age < interval '1 day' and links > 2 then
    raise exception 'Durante su primer día, las cuentas nuevas pueden incluir hasta 2 enlaces por publicación.' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
create trigger posts_rate_limit before insert on public.posts
for each row execute function public.rate_limit_posts();

create or replace function public.rate_limit_comments()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if public.is_staff() then return new; end if;
  perform public.rate_check(
    (select count(*) from public.comments where author_id = new.author_id and created_at > now() - interval '10 minutes'),
    20, 'Estás comentando muy rápido. Espera unos minutos.');
  return new;
end;
$$;
create trigger comments_rate_limit before insert on public.comments
for each row execute function public.rate_limit_comments();

create or replace function public.rate_limit_messages()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if public.is_staff() then return new; end if;
  perform public.rate_check(
    (select count(*) from public.messages where sender_id = new.sender_id and created_at > now() - interval '5 minutes'),
    30, 'Demasiados mensajes seguidos. Espera un momento.');
  return new;
end;
$$;
create trigger messages_rate_limit before insert on public.messages
for each row execute function public.rate_limit_messages();

create or replace function public.rate_limit_group_messages()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  n bigint;
begin
  if public.is_staff() then return new; end if;
  if tg_table_name = 'circle_messages' then
    select count(*) into n from public.circle_messages where sender_id = new.sender_id and created_at > now() - interval '5 minutes';
  else
    select count(*) into n from public.project_messages where sender_id = new.sender_id and created_at > now() - interval '5 minutes';
  end if;
  perform public.rate_check(n, 30, 'Demasiados mensajes seguidos. Espera un momento.');
  return new;
end;
$$;
create trigger circle_messages_rate_limit before insert on public.circle_messages
for each row execute function public.rate_limit_group_messages();
create trigger project_messages_rate_limit before insert on public.project_messages
for each row execute function public.rate_limit_group_messages();

create or replace function public.rate_limit_social()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  n bigint;
  who uuid;
begin
  if public.is_staff() then return new; end if;
  if tg_table_name = 'connections' then
    who := new.requester_id;
    select count(*) into n from public.connections where requester_id = who and created_at > now() - interval '1 day';
    perform public.rate_check(n, 30, 'Has enviado muchas solicitudes hoy. Vuelve mañana.');
  elsif tg_table_name = 'reports' then
    select count(*) into n from public.reports where reporter_id = new.reporter_id and created_at > now() - interval '1 day';
    perform public.rate_check(n, 20, 'Has enviado muchas denuncias hoy. El equipo ya las está revisando.');
  elsif tg_table_name = 'circles' then
    select count(*) into n from public.circles where owner_id = new.owner_id and created_at > now() - interval '1 day';
    perform public.rate_check(n, 5, 'Puedes crear hasta 5 círculos al día.');
  elsif tg_table_name = 'projects' then
    select count(*) into n from public.projects where owner_id = new.owner_id and created_at > now() - interval '1 day';
    perform public.rate_check(n, 5, 'Puedes publicar hasta 5 proyectos al día.');
  elsif tg_table_name = 'circle_invites' then
    select count(*) into n from public.circle_invites where inviter_id = new.inviter_id and created_at > now() - interval '1 day';
    perform public.rate_check(n, 50, 'Has enviado muchas invitaciones hoy.');
  end if;
  return new;
end;
$$;
create trigger connections_rate_limit before insert on public.connections for each row execute function public.rate_limit_social();
create trigger reports_rate_limit before insert on public.reports for each row execute function public.rate_limit_social();
create trigger circles_rate_limit before insert on public.circles for each row execute function public.rate_limit_social();
create trigger projects_rate_limit before insert on public.projects for each row execute function public.rate_limit_social();
create trigger circle_invites_rate_limit before insert on public.circle_invites for each row execute function public.rate_limit_social();

-- -----------------------------------------------------------------------------
-- Extractos: conservan los guiones bajos (nombres de usuario) y quitan marcas
-- -----------------------------------------------------------------------------
create or replace function public.post_excerpt(p_body text)
returns text
language sql
immutable
set search_path = ''
as $$ select left(regexp_replace(regexp_replace(p_body, '(\*\*|\*|`|^>\s?|^#+\s?)', '', 'gn'), '\s+', ' ', 'g'), 280) $$;

create or replace function public.feed_posts(
  p_scope text default 'all',
  p_category text default null,
  p_circle uuid default null,
  p_tag text default null,
  p_kind public.post_kind default null,
  p_author uuid default null,
  p_sort text default 'recent',
  p_saved_only boolean default false,
  p_limit integer default 20,
  p_offset integer default 0,
  p_questions_only boolean default false
)
returns setof public.post_list_item
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id, p.title, public.post_excerpt(p.body),
    p.kind, p.is_question, p.category_slug, c.name, p.circle_id,
    p.author_id, a.username::text, coalesce(a.display_name, a.username::text), a.avatar_url,
    coalesce((select array_agg(t.tag_slug order by t.tag_slug) from public.post_tags t where t.post_id = p.id), '{}'),
    p.comment_count, p.reaction_count, cardinality(p.image_paths), p.is_pinned, p.is_locked,
    p.created_at, p.last_activity_at
  from public.posts p
  join public.profiles a on a.id = p.author_id
  left join public.categories c on c.slug = p.category_slug
  where p.deleted_at is null
    and (
      (p_scope = 'all' and p.circle_id is null)
      or (p_scope = 'forum' and p.category_slug is not null and p.circle_id is null)
      or (p_scope = 'agora' and p.category_slug is null and p.circle_id is null)
      or (p_scope = 'circle' and p.circle_id = p_circle)
    )
    and (p_category is null or p.category_slug = p_category)
    and (p_tag is null or exists (select 1 from public.post_tags t where t.post_id = p.id and t.tag_slug = p_tag))
    and (p_kind is null or p.kind = p_kind)
    and (p_author is null or p.author_id = p_author)
    and (not p_questions_only or p.is_question)
    and (not p_saved_only or exists (
      select 1 from public.saved_posts s where s.post_id = p.id and s.user_id = auth.uid()))
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.author_id)
         or (b.blocked_id = auth.uid() and b.blocker_id = p.author_id))
  order by
    case when p_category is not null or p_scope = 'circle' then p.is_pinned else false end desc,
    case when p_sort = 'popular' then p.reaction_count end desc nulls last,
    case when p_sort = 'commented' then p.comment_count end desc nulls last,
    case when p_sort = 'trending' then
      (p.reaction_count + 2 * p.comment_count + 1)::float
        / power(extract(epoch from (now() - p.created_at)) / 3600.0 + 2, 1.5)
    end desc nulls last,
    p.created_at desc
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0)
$$;

create or replace function public.search_posts(p_query text, p_limit integer default 20, p_offset integer default 0)
returns setof public.post_list_item
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  q tsquery;
begin
  select to_tsquery('spanish', string_agg(quote_literal(w) || ':*', ' & '))
  into q
  from (
    select w from regexp_split_to_table(lower(public.immutable_unaccent(coalesce(p_query, ''))), '[^a-z0-9]+') as w
    where char_length(w) >= 2
    limit 8
  ) words;
  if q is null then
    return;
  end if;
  return query
  select
    p.id, p.title, public.post_excerpt(p.body),
    p.kind, p.is_question, p.category_slug, c.name, p.circle_id,
    p.author_id, a.username::text, coalesce(a.display_name, a.username::text), a.avatar_url,
    coalesce((select array_agg(t.tag_slug order by t.tag_slug) from public.post_tags t where t.post_id = p.id), '{}'),
    p.comment_count, p.reaction_count, cardinality(p.image_paths), p.is_pinned, p.is_locked,
    p.created_at, p.last_activity_at
  from public.posts p
  join public.profiles a on a.id = p.author_id
  left join public.categories c on c.slug = p.category_slug
  where p.deleted_at is null and p.search @@ q
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.author_id)
         or (b.blocked_id = auth.uid() and b.blocker_id = p.author_id))
  order by ts_rank(p.search, q) desc, p.created_at desc
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
end;
$$;

-- -----------------------------------------------------------------------------
-- Permisos de ejecución
-- -----------------------------------------------------------------------------
revoke all on function
  public.admin_set_role(uuid, public.user_role),
  public.admin_set_status(uuid, public.account_status, text),
  public.admin_list_members(text, public.user_role, public.account_status, integer, integer),
  public.mod_delete_post(uuid, text), public.mod_delete_comment(uuid, text), public.mod_delete_message(uuid, text),
  public.mod_set_post_flags(uuid, boolean, boolean), public.mod_reclassify_post(uuid, public.post_kind, text),
  public.mod_delete_circle(uuid, text), public.mod_delete_project(uuid, text),
  public.report_target_preview(uuid), public.mod_resolve_report(uuid, public.report_status, text),
  public.admin_save_category(text, text, text, smallint, boolean), public.admin_update_settings(boolean, text),
  public.admin_stats()
from public, anon;
grant execute on function
  public.admin_set_role(uuid, public.user_role),
  public.admin_set_status(uuid, public.account_status, text),
  public.admin_list_members(text, public.user_role, public.account_status, integer, integer),
  public.mod_delete_post(uuid, text), public.mod_delete_comment(uuid, text), public.mod_delete_message(uuid, text),
  public.mod_set_post_flags(uuid, boolean, boolean), public.mod_reclassify_post(uuid, public.post_kind, text),
  public.mod_delete_circle(uuid, text), public.mod_delete_project(uuid, text),
  public.report_target_preview(uuid), public.mod_resolve_report(uuid, public.report_status, text),
  public.admin_save_category(text, text, text, smallint, boolean), public.admin_update_settings(boolean, text),
  public.admin_stats()
to authenticated;
revoke all on function public.rate_check(bigint, integer, text), public.post_excerpt(text) from anon;
