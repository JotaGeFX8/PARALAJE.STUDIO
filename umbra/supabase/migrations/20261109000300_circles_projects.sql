-- =============================================================================
-- Migración 0006 · Círculos, proyectos y Ágora
-- =============================================================================

create type public.circle_visibility as enum ('public', 'private', 'invite');
create type public.circle_role as enum ('owner', 'admin', 'member');
create type public.request_status as enum ('pending', 'accepted', 'declined');
create type public.project_status as enum ('idea', 'planning', 'active', 'paused', 'completed');
create type public.project_role as enum ('owner', 'collaborator');

-- -----------------------------------------------------------------------------
-- Imágenes de portada (círculos y proyectos): bucket público, carpeta propia
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "covers: subir a carpeta propia" on storage.objects for insert to authenticated
with check (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text and public.can_write());
create policy "covers: listar carpeta propia" on storage.objects for select to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "covers: borrar en carpeta propia" on storage.objects for delete to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- -----------------------------------------------------------------------------
-- Círculos
-- -----------------------------------------------------------------------------
create table public.circles (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 70),
  name             text not null check (char_length(name) between 3 and 80),
  description      text not null default '' check (char_length(description) <= 2000),
  visibility       public.circle_visibility not null default 'public',
  image_path       text check (image_path is null or image_path ~ '^[0-9a-f-]{36}/[\w.-]+$'),
  owner_id         uuid not null references public.profiles (id) on delete cascade,
  member_count     integer not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
create index circles_activity_idx on public.circles (last_activity_at desc);

create table public.circle_members (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      public.circle_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
create index circle_members_user_idx on public.circle_members (user_id);

create table public.circle_requests (
  id           uuid primary key default gen_random_uuid(),
  circle_id    uuid not null references public.circles (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  message      text not null default '' check (char_length(message) <= 300),
  status       public.request_status not null default 'pending',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  unique (circle_id, user_id)
);

create table public.circle_invites (
  id           uuid primary key default gen_random_uuid(),
  circle_id    uuid not null references public.circles (id) on delete cascade,
  invitee_id   uuid not null references public.profiles (id) on delete cascade,
  inviter_id   uuid references public.profiles (id) on delete set null,
  status       public.request_status not null default 'pending',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  unique (circle_id, invitee_id)
);

create table public.circle_messages (
  id         uuid primary key default gen_random_uuid(),
  circle_id  uuid not null references public.circles (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index circle_messages_idx on public.circle_messages (circle_id, created_at desc);

alter table public.posts
  add constraint posts_circle_fk foreign key (circle_id) references public.circles (id) on delete cascade;
alter table public.notifications
  add constraint notifications_circle_fk foreign key (circle_id) references public.circles (id) on delete cascade;

-- Rol del usuario actual en un círculo (null si no es miembro).
create or replace function public.circle_role_of(p_circle uuid)
returns public.circle_role
language sql stable security definer set search_path = ''
as $$ select role from public.circle_members where circle_id = p_circle and user_id = auth.uid() $$;

create or replace function public.is_circle_member(p_circle uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.circle_members where circle_id = p_circle and user_id = auth.uid()) $$;

create or replace function public.is_circle_admin(p_circle uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.circle_members
    where circle_id = p_circle and user_id = auth.uid() and role in ('owner', 'admin')
  )
$$;

-- Ver que el círculo existe: públicos y privados, para cualquier miembro activo;
-- los de invitación, solo para sus miembros e invitados.
create or replace function public.can_see_circle(p_circle uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_active_member() and exists (
    select 1 from public.circles c
    where c.id = p_circle
      and (
        c.visibility in ('public', 'private')
        or exists (select 1 from public.circle_members m where m.circle_id = c.id and m.user_id = auth.uid())
        or exists (select 1 from public.circle_invites i where i.circle_id = c.id and i.invitee_id = auth.uid() and i.status = 'pending')
      )
  )
$$;

-- Leer su contenido: públicos para todos los miembros activos; el resto, solo miembros.
create or replace function public.can_read_circle(p_circle uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_active_member() and exists (
    select 1 from public.circles c
    where c.id = p_circle
      and (
        c.visibility = 'public'
        or exists (select 1 from public.circle_members m where m.circle_id = c.id and m.user_id = auth.uid())
      )
  )
$$;

-- ¿Puede un usuario concreto leer una publicación? (para notificaciones)
create or replace function public.user_can_read_post(p_user uuid, p_post uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.posts p
    left join public.circles c on c.id = p.circle_id
    where p.id = p_post and p.deleted_at is null
      and (
        p.circle_id is null
        or c.visibility = 'public'
        or exists (select 1 from public.circle_members m where m.circle_id = p.circle_id and m.user_id = p_user)
      )
  )
$$;

-- -----------------------------------------------------------------------------
-- Proyectos
-- -----------------------------------------------------------------------------
create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 90),
  title             text not null check (char_length(title) between 3 and 100),
  summary           text not null default '' check (char_length(summary) <= 280),
  description       text not null default '' check (char_length(description) <= 10000),
  objectives        text[] not null default '{}' check (cardinality(objectives) <= 12),
  seeking           text not null default '' check (char_length(seeking) <= 600),
  status            public.project_status not null default 'idea',
  country           text check (country is null or char_length(country) between 2 and 60),
  region            text check (region is null or char_length(region) between 2 and 80),
  interests         text[] not null default '{}' check (cardinality(interests) <= 6),
  cover_path        text check (cover_path is null or cover_path ~ '^[0-9a-f-]{36}/[\w.-]+$'),
  owner_id          uuid not null references public.profiles (id) on delete cascade,
  participant_count integer not null default 0,
  last_activity_at  timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index projects_activity_idx on public.projects (last_activity_at desc);
create index projects_status_idx on public.projects (status);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.project_role not null default 'collaborator',
  joined_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index project_members_user_idx on public.project_members (user_id);

create table public.project_requests (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  message      text not null default '' check (char_length(message) <= 600),
  status       public.request_status not null default 'pending',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  unique (project_id, user_id)
);

create table public.project_messages (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 4000),
  is_update  boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index project_messages_idx on public.project_messages (project_id, created_at desc);

alter table public.notifications
  add constraint notifications_project_fk foreign key (project_id) references public.projects (id) on delete cascade;

create or replace function public.is_project_participant(p_project uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.project_members where project_id = p_project and user_id = auth.uid()) $$;

create or replace function public.is_project_owner(p_project uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.projects where id = p_project and owner_id = auth.uid()) $$;

-- -----------------------------------------------------------------------------
-- Visibilidad de publicaciones dentro de círculos (sustituye las políticas)
-- -----------------------------------------------------------------------------
drop policy "posts: lectura" on public.posts;
create policy "posts: lectura" on public.posts for select to authenticated
using (
  public.is_staff()
  or (deleted_at is null and public.is_active_member() and (circle_id is null or public.can_read_circle(circle_id)))
);

drop policy "posts: alta" on public.posts;
create policy "posts: alta" on public.posts for insert to authenticated
with check (
  author_id = auth.uid()
  and public.can_write()
  and (circle_id is null or (category_slug is null and public.is_circle_member(circle_id)))
  and (
    category_slug is null
    or exists (select 1 from public.categories c where c.slug = category_slug and not c.is_archived)
  )
);

-- Las notificaciones sobre publicaciones solo llegan a quien puede leerlas.
create or replace function public.notify(
  p_user uuid,
  p_actor uuid,
  p_type public.notification_type,
  p_post uuid default null,
  p_comment uuid default null,
  p_conversation uuid default null,
  p_circle uuid default null,
  p_project uuid default null,
  p_body text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prefs public.notification_prefs;
  allowed boolean := true;
begin
  if p_user is null or p_user = p_actor then
    return;
  end if;
  if p_post is not null and not public.user_can_read_post(p_user, p_post) then
    return;
  end if;
  if p_actor is not null and exists (
    select 1 from public.blocks b
    where (b.blocker_id = p_user and b.blocked_id = p_actor) or (b.blocker_id = p_actor and b.blocked_id = p_user)
  ) then
    return;
  end if;
  select * into prefs from public.notification_prefs where user_id = p_user;
  if found then
    allowed := case
      when p_type = 'comment' then prefs.comments
      when p_type = 'reply' then prefs.replies
      when p_type = 'mention' then prefs.mentions
      when p_type in ('connection_request', 'connection_accepted') then prefs.connections
      when p_type = 'message' then prefs.messages
      when p_type in ('circle_invite', 'circle_request', 'circle_approved') then prefs.circles
      when p_type in ('project_request', 'project_approved', 'project_update') then prefs.projects
      else true
    end;
  end if;
  if not allowed then
    return;
  end if;
  insert into public.notifications (user_id, actor_id, type, post_id, comment_id, conversation_id, circle_id, project_id, body)
  values (p_user, p_actor, p_type, p_post, p_comment, p_conversation, p_circle, p_project, left(coalesce(p_body, ''), 300));
end;
$$;
revoke all on function public.notify(uuid, uuid, public.notification_type, uuid, uuid, uuid, uuid, uuid, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Triggers: contadores, actividad y avisos
-- -----------------------------------------------------------------------------
create or replace function public.circle_members_count()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.circles set member_count = member_count + 1, last_activity_at = now() where id = new.circle_id;
  else
    update public.circles set member_count = greatest(member_count - 1, 0) where id = old.circle_id;
  end if;
  return null;
end;
$$;
create trigger circle_members_count after insert or delete on public.circle_members
for each row execute function public.circle_members_count();

create or replace function public.project_members_count()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.projects set participant_count = participant_count + 1, last_activity_at = now() where id = new.project_id;
  else
    update public.projects set participant_count = greatest(participant_count - 1, 0) where id = old.project_id;
  end if;
  return null;
end;
$$;
create trigger project_members_count after insert or delete on public.project_members
for each row execute function public.project_members_count();

create or replace function public.circle_activity()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.circle_id is not null then
    update public.circles set last_activity_at = now() where id = new.circle_id;
  end if;
  return null;
end;
$$;
create trigger posts_circle_activity after insert on public.posts
for each row execute function public.circle_activity();
create trigger circle_messages_activity after insert on public.circle_messages
for each row execute function public.circle_activity();

create or replace function public.circle_requests_notify()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_name text;
  admin record;
begin
  select name into v_name from public.circles where id = new.circle_id;
  if tg_op = 'INSERT' and new.status = 'pending' then
    for admin in select user_id from public.circle_members where circle_id = new.circle_id and role in ('owner', 'admin') loop
      perform public.notify(admin.user_id, new.user_id, 'circle_request', null, null, null, new.circle_id, null, v_name);
    end loop;
  elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status <> 'accepted' then
    perform public.notify(new.user_id, auth.uid(), 'circle_approved', null, null, null, new.circle_id, null, v_name);
  end if;
  return null;
end;
$$;
create trigger circle_requests_notify after insert or update on public.circle_requests
for each row execute function public.circle_requests_notify();

create or replace function public.circle_invites_notify()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.notify(new.invitee_id, new.inviter_id, 'circle_invite', null, null, null, new.circle_id, null,
    (select name from public.circles where id = new.circle_id));
  return null;
end;
$$;
create trigger circle_invites_notify after insert on public.circle_invites
for each row execute function public.circle_invites_notify();

create or replace function public.project_requests_notify()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  p public.projects;
begin
  select * into p from public.projects where id = new.project_id;
  if tg_op = 'INSERT' then
    perform public.notify(p.owner_id, new.user_id, 'project_request', null, null, null, null, p.id, p.title);
  elsif new.status = 'accepted' and old.status <> 'accepted' then
    perform public.notify(new.user_id, p.owner_id, 'project_approved', null, null, null, null, p.id, p.title);
  end if;
  return null;
end;
$$;
create trigger project_requests_notify after insert or update on public.project_requests
for each row execute function public.project_requests_notify();

create or replace function public.project_messages_after()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_title text;
  m record;
begin
  update public.projects set last_activity_at = now() where id = new.project_id returning title into v_title;
  if new.is_update then
    for m in select user_id from public.project_members where project_id = new.project_id and user_id <> new.sender_id loop
      perform public.notify(m.user_id, new.sender_id, 'project_update', null, null, null, null, new.project_id, v_title);
    end loop;
  end if;
  return null;
end;
$$;
create trigger project_messages_after after insert on public.project_messages
for each row execute function public.project_messages_after();

create or replace function public.projects_touch()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  new.objectives := array(select left(trim(o), 200) from unnest(new.objectives) as o where trim(o) <> '');
  return new;
end;
$$;
create trigger projects_touch before insert or update on public.projects
for each row execute function public.projects_touch();

-- -----------------------------------------------------------------------------
-- Privilegios y RLS
-- -----------------------------------------------------------------------------
revoke all on public.circles, public.circle_members, public.circle_requests, public.circle_invites,
  public.circle_messages, public.projects, public.project_members, public.project_requests, public.project_messages
  from anon, authenticated;

grant select on public.circles to authenticated;
grant update (name, description, visibility, image_path) on public.circles to authenticated;
grant delete on public.circles to authenticated;
grant select, delete on public.circle_members to authenticated;
grant select, insert, delete on public.circle_requests to authenticated;
grant select on public.circle_invites to authenticated;
grant select, insert on public.circle_messages to authenticated;
grant select on public.projects to authenticated;
grant update (title, summary, description, objectives, seeking, status, country, region, interests, cover_path)
  on public.projects to authenticated;
grant delete on public.projects to authenticated;
grant select, delete on public.project_members to authenticated;
grant select, insert, delete on public.project_requests to authenticated;
grant select, insert on public.project_messages to authenticated;

alter table public.circles          enable row level security;
alter table public.circle_members   enable row level security;
alter table public.circle_requests  enable row level security;
alter table public.circle_invites   enable row level security;
alter table public.circle_messages  enable row level security;
alter table public.projects         enable row level security;
alter table public.project_members  enable row level security;
alter table public.project_requests enable row level security;
alter table public.project_messages enable row level security;

-- Círculos
create policy "circles: lectura" on public.circles for select to authenticated
using (public.is_staff() or public.can_see_circle(id));
create policy "circles: edición por administración del círculo" on public.circles for update to authenticated
using (public.is_circle_admin(id))
with check (public.is_circle_admin(id));
create policy "circles: borrado por su creador" on public.circles for delete to authenticated
using (owner_id = auth.uid());

create policy "circle_members: lectura" on public.circle_members for select to authenticated
using (public.is_staff() or public.can_read_circle(circle_id) or user_id = auth.uid());
create policy "circle_members: salir o expulsar" on public.circle_members for delete to authenticated
using (
  (user_id = auth.uid() and role <> 'owner')
  or (public.is_circle_admin(circle_id) and role = 'member')
  or (public.circle_role_of(circle_id) = 'owner' and role = 'admin')
);

create policy "circle_requests: lectura" on public.circle_requests for select to authenticated
using (user_id = auth.uid() or public.is_circle_admin(circle_id));
create policy "circle_requests: solicitar" on public.circle_requests for insert to authenticated
with check (
  user_id = auth.uid() and status = 'pending' and public.is_active_member()
  and exists (select 1 from public.circles c where c.id = circle_id and c.visibility = 'private')
  and not public.is_circle_member(circle_id)
);
create policy "circle_requests: retirar" on public.circle_requests for delete to authenticated
using (user_id = auth.uid() and status = 'pending');

create policy "circle_invites: lectura" on public.circle_invites for select to authenticated
using (invitee_id = auth.uid() or public.is_circle_admin(circle_id));

create policy "circle_messages: lectura" on public.circle_messages for select to authenticated
using (public.is_circle_member(circle_id));
create policy "circle_messages: envío" on public.circle_messages for insert to authenticated
with check (sender_id = auth.uid() and public.can_write() and public.is_circle_member(circle_id));

-- Proyectos
create policy "projects: lectura" on public.projects for select to authenticated
using (public.is_active_member() or public.is_staff());
create policy "projects: edición por su creador" on public.projects for update to authenticated
using (owner_id = auth.uid() and public.can_write())
with check (owner_id = auth.uid());
create policy "projects: borrado por su creador" on public.projects for delete to authenticated
using (owner_id = auth.uid());

create policy "project_members: lectura" on public.project_members for select to authenticated
using (public.is_active_member() or public.is_staff());
create policy "project_members: salir o retirar" on public.project_members for delete to authenticated
using ((user_id = auth.uid() and role <> 'owner') or (public.is_project_owner(project_id) and role <> 'owner'));

create policy "project_requests: lectura" on public.project_requests for select to authenticated
using (user_id = auth.uid() or public.is_project_owner(project_id));
create policy "project_requests: solicitar" on public.project_requests for insert to authenticated
with check (
  user_id = auth.uid() and status = 'pending' and public.can_write()
  and not public.is_project_participant(project_id)
);
create policy "project_requests: retirar" on public.project_requests for delete to authenticated
using (user_id = auth.uid() and status = 'pending');

create policy "project_messages: lectura" on public.project_messages for select to authenticated
using (public.is_active_member() or public.is_staff());
create policy "project_messages: envío" on public.project_messages for insert to authenticated
with check (
  sender_id = auth.uid() and public.can_write()
  and (not is_update or public.is_project_participant(project_id))
);

-- -----------------------------------------------------------------------------
-- Funciones de aplicación: círculos
-- -----------------------------------------------------------------------------
create or replace function public.unique_slug(p_base text, p_table text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  base text := left(nullif(public.slugify(p_base), ''), 60);
  candidate text;
  taken boolean;
begin
  if base is null or char_length(base) < 3 then
    base := 'espacio';
  end if;
  candidate := base;
  for i in 1..20 loop
    execute format('select exists (select 1 from public.%I where slug = $1)', p_table) into taken using candidate;
    if not taken then
      return candidate;
    end if;
    candidate := base || '-' || substr(md5(random()::text), 1, 4);
  end loop;
  return base || '-' || substr(md5(clock_timestamp()::text), 1, 8);
end;
$$;

create or replace function public.create_circle(p_name text, p_description text, p_visibility public.circle_visibility, p_image_path text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.can_write() then
    raise exception 'Tu cuenta no puede crear círculos' using errcode = '42501';
  end if;
  if p_image_path is not null and p_image_path not like auth.uid()::text || '/%' then
    raise exception 'Imagen no válida' using errcode = '22023';
  end if;
  insert into public.circles (slug, name, description, visibility, image_path, owner_id)
  values (public.unique_slug(p_name, 'circles'), trim(p_name), trim(coalesce(p_description, '')), p_visibility, p_image_path, auth.uid())
  returning id into v_id;
  insert into public.circle_members (circle_id, user_id, role) values (v_id, auth.uid(), 'owner');
  return v_id;
end;
$$;

-- Unirse: inmediato en públicos; en privados crea una solicitud.
create or replace function public.join_circle(p_circle uuid, p_message text default '')
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  c public.circles;
begin
  if not public.is_active_member() then
    raise exception 'Cuenta no activa' using errcode = '42501';
  end if;
  select * into c from public.circles where id = p_circle;
  if c is null then
    raise exception 'El círculo no existe' using errcode = '22023';
  end if;
  if public.is_circle_member(p_circle) then
    return 'member';
  end if;
  if c.visibility = 'public' then
    insert into public.circle_members (circle_id, user_id) values (p_circle, auth.uid());
    return 'member';
  elsif c.visibility = 'private' then
    insert into public.circle_requests (circle_id, user_id, message)
    values (p_circle, auth.uid(), left(coalesce(p_message, ''), 300))
    on conflict (circle_id, user_id) do update set status = 'pending', message = excluded.message, created_at = now()
      where public.circle_requests.status = 'declined' and public.circle_requests.responded_at < now() - interval '30 days';
    return 'requested';
  else
    raise exception 'Este círculo es solo por invitación' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.respond_circle_request(p_request uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r public.circle_requests;
begin
  select * into r from public.circle_requests where id = p_request;
  if r is null or not public.is_circle_admin(r.circle_id) or r.status <> 'pending' then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  update public.circle_requests set status = case when p_accept then 'accepted'::public.request_status else 'declined' end,
    responded_at = now() where id = p_request;
  if p_accept then
    insert into public.circle_members (circle_id, user_id) values (r.circle_id, r.user_id) on conflict do nothing;
  end if;
end;
$$;

create or replace function public.invite_to_circle(p_circle uuid, p_username text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid;
begin
  if not public.is_circle_admin(p_circle) then
    raise exception 'Solo la administración del círculo puede invitar' using errcode = '42501';
  end if;
  select id into v_user from public.profiles
  where username = ltrim(trim(p_username), '@')::extensions.citext and status = 'active' and onboarded_at is not null;
  if v_user is null then
    raise exception 'No existe ese miembro' using errcode = '22023';
  end if;
  if exists (select 1 from public.circle_members where circle_id = p_circle and user_id = v_user) then
    raise exception 'Ya es miembro del círculo' using errcode = '22023';
  end if;
  if exists (select 1 from public.blocks b where (b.blocker_id = v_user and b.blocked_id = auth.uid()) or (b.blocker_id = auth.uid() and b.blocked_id = v_user)) then
    raise exception 'No es posible invitar a este miembro' using errcode = '42501';
  end if;
  insert into public.circle_invites (circle_id, invitee_id, inviter_id) values (p_circle, v_user, auth.uid())
  on conflict (circle_id, invitee_id) do update set status = 'pending', inviter_id = excluded.inviter_id, created_at = now();
end;
$$;

create or replace function public.respond_circle_invite(p_invite uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  i public.circle_invites;
begin
  select * into i from public.circle_invites where id = p_invite;
  if i is null or i.invitee_id <> auth.uid() or i.status <> 'pending' then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  update public.circle_invites set status = case when p_accept then 'accepted'::public.request_status else 'declined' end,
    responded_at = now() where id = p_invite;
  if p_accept then
    insert into public.circle_members (circle_id, user_id) values (i.circle_id, auth.uid()) on conflict do nothing;
  end if;
end;
$$;

create or replace function public.set_circle_role(p_circle uuid, p_user uuid, p_role public.circle_role)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if public.circle_role_of(p_circle) is distinct from 'owner' or p_role = 'owner' or p_user = auth.uid() then
    raise exception 'Solo quien creó el círculo puede cambiar roles' using errcode = '42501';
  end if;
  update public.circle_members set role = p_role where circle_id = p_circle and user_id = p_user;
end;
$$;

create or replace function public.delete_circle_message(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.circle_messages set deleted_at = now(), body = '[eliminado]'
  where id = p_id and deleted_at is null and (sender_id = auth.uid() or public.is_circle_admin(circle_id) or public.is_staff());
  if not found then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Funciones de aplicación: proyectos
-- -----------------------------------------------------------------------------
create or replace function public.create_project(
  p_title text, p_summary text, p_description text, p_objectives text[], p_seeking text,
  p_status public.project_status, p_country text, p_region text, p_interests text[], p_cover_path text default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.can_write() then
    raise exception 'Tu cuenta no puede crear proyectos' using errcode = '42501';
  end if;
  if p_cover_path is not null and p_cover_path not like auth.uid()::text || '/%' then
    raise exception 'Imagen no válida' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(coalesce(p_interests, '{}')) x where not exists (select 1 from public.interests i where i.slug = x)) then
    raise exception 'Interés no válido' using errcode = '22023';
  end if;
  insert into public.projects (slug, title, summary, description, objectives, seeking, status, country, region, interests, cover_path, owner_id)
  values (
    public.unique_slug(p_title, 'projects'), trim(p_title), trim(coalesce(p_summary, '')), trim(coalesce(p_description, '')),
    coalesce(p_objectives, '{}'), trim(coalesce(p_seeking, '')), p_status, nullif(trim(p_country), ''), nullif(trim(p_region), ''),
    coalesce(p_interests, '{}'), p_cover_path, auth.uid()
  )
  returning id into v_id;
  insert into public.project_members (project_id, user_id, role) values (v_id, auth.uid(), 'owner');
  return v_id;
end;
$$;

create or replace function public.respond_project_request(p_request uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r public.project_requests;
begin
  select * into r from public.project_requests where id = p_request;
  if r is null or not public.is_project_owner(r.project_id) or r.status <> 'pending' then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  update public.project_requests set status = case when p_accept then 'accepted'::public.request_status else 'declined' end,
    responded_at = now() where id = p_request;
  if p_accept then
    insert into public.project_members (project_id, user_id) values (r.project_id, r.user_id) on conflict do nothing;
  end if;
end;
$$;

create or replace function public.delete_project_message(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.project_messages set deleted_at = now(), body = '[eliminado]'
  where id = p_id and deleted_at is null and (sender_id = auth.uid() or public.is_project_owner(project_id) or public.is_staff());
  if not found then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Ágora: el listado admite «solo preguntas»
-- -----------------------------------------------------------------------------
drop function public.feed_posts(text, text, uuid, text, public.post_kind, uuid, text, boolean, integer, integer);

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
    p.id, p.title,
    left(regexp_replace(p.body, '[*_>`#]+', '', 'g'), 280),
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

-- -----------------------------------------------------------------------------
-- Actividad de la comunidad (para Explorar)
-- -----------------------------------------------------------------------------
create or replace function public.community_activity(p_limit integer default 12)
returns table (kind text, at timestamptz, ref text, title text, actor_username text, actor_name text, actor_avatar text)
language sql
stable
security invoker
set search_path = ''
as $$
  (
    select 'member', p.onboarded_at, p.username::text, null::text, p.username::text, coalesce(p.display_name, p.username::text), p.avatar_url
    from public.profiles p where p.onboarded_at is not null and p.status = 'active'
    order by p.onboarded_at desc limit 8
  )
  union all
  (
    select 'post', x.created_at, x.id::text, coalesce(x.title, left(x.body, 90)), a.username::text, coalesce(a.display_name, a.username::text), a.avatar_url
    from public.posts x join public.profiles a on a.id = x.author_id
    where x.deleted_at is null and x.circle_id is null
    order by x.created_at desc limit 8
  )
  union all
  (
    select 'project', x.created_at, x.slug, x.title, a.username::text, coalesce(a.display_name, a.username::text), a.avatar_url
    from public.projects x join public.profiles a on a.id = x.owner_id
    order by x.created_at desc limit 5
  )
  union all
  (
    select 'circle', x.created_at, x.slug, x.name, a.username::text, coalesce(a.display_name, a.username::text), a.avatar_url
    from public.circles x join public.profiles a on a.id = x.owner_id
    where x.visibility <> 'invite'
    order by x.created_at desc limit 5
  )
  order by 2 desc
  limit least(greatest(p_limit, 1), 30)
$$;

revoke all on function
  public.circle_role_of(uuid), public.is_circle_member(uuid), public.is_circle_admin(uuid), public.can_see_circle(uuid),
  public.can_read_circle(uuid), public.is_project_participant(uuid), public.is_project_owner(uuid),
  public.create_circle(text, text, public.circle_visibility, text), public.join_circle(uuid, text),
  public.respond_circle_request(uuid, boolean), public.invite_to_circle(uuid, text), public.respond_circle_invite(uuid, boolean),
  public.set_circle_role(uuid, uuid, public.circle_role), public.delete_circle_message(uuid),
  public.create_project(text, text, text, text[], text, public.project_status, text, text, text[], text),
  public.respond_project_request(uuid, boolean), public.delete_project_message(uuid),
  public.feed_posts(text, text, uuid, text, public.post_kind, uuid, text, boolean, integer, integer, boolean),
  public.community_activity(integer)
from public, anon;
grant execute on function
  public.circle_role_of(uuid), public.is_circle_member(uuid), public.is_circle_admin(uuid), public.can_see_circle(uuid),
  public.can_read_circle(uuid), public.is_project_participant(uuid), public.is_project_owner(uuid),
  public.create_circle(text, text, public.circle_visibility, text), public.join_circle(uuid, text),
  public.respond_circle_request(uuid, boolean), public.invite_to_circle(uuid, text), public.respond_circle_invite(uuid, boolean),
  public.set_circle_role(uuid, uuid, public.circle_role), public.delete_circle_message(uuid),
  public.create_project(text, text, text, text[], text, public.project_status, text, text, text[], text),
  public.respond_project_request(uuid, boolean), public.delete_project_message(uuid),
  public.feed_posts(text, text, uuid, text, public.post_kind, uuid, text, boolean, integer, integer, boolean),
  public.community_activity(integer)
to authenticated;
revoke all on function public.user_can_read_post(uuid, uuid), public.unique_slug(text, text) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.circle_messages, public.project_messages;
  end if;
end $$;
