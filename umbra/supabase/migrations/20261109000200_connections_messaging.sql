-- =============================================================================
-- Migración 0005 · Conexiones, descubrimiento, mensajería y notificaciones
-- =============================================================================

create type public.connection_status as enum ('pending', 'accepted', 'declined');
create type public.notification_type as enum (
  'comment', 'reply', 'mention',
  'connection_request', 'connection_accepted',
  'message',
  'circle_invite', 'circle_request', 'circle_approved',
  'project_request', 'project_approved', 'project_update',
  'moderation'
);

-- -----------------------------------------------------------------------------
-- Conexiones (una fila por pareja)
-- -----------------------------------------------------------------------------
create table public.connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status       public.connection_status not null default 'pending',
  message      text not null default '' check (char_length(message) <= 300),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  pair_low     uuid generated always as (least(requester_id, addressee_id)) stored,
  pair_high    uuid generated always as (greatest(requester_id, addressee_id)) stored,
  unique (pair_low, pair_high),
  check (requester_id <> addressee_id)
);
create index connections_addressee_idx on public.connections (addressee_id, status);
create index connections_requester_idx on public.connections (requester_id, status);

-- Perfiles descartados en «Descubrir» (no se vuelven a proponer en 30 días).
create table public.member_skips (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  skipped_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skipped_id)
);

-- ¿Hay conexión aceptada entre el usuario actual y otro?
create or replace function public.is_connected_with(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.connections c
    where c.status = 'accepted'
      and c.pair_low = least(auth.uid(), p_other)
      and c.pair_high = greatest(auth.uid(), p_other)
  )
$$;

-- -----------------------------------------------------------------------------
-- Conversaciones privadas (dos personas) y mensajes
-- -----------------------------------------------------------------------------
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_low        uuid not null references public.profiles (id) on delete cascade,
  user_high       uuid not null references public.profiles (id) on delete cascade,
  low_read_at     timestamptz not null default now(),
  high_read_at    timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (user_low, user_high),
  check (user_low < user_high)
);
create index conversations_low_idx on public.conversations (user_low, last_message_at desc);
create index conversations_high_idx on public.conversations (user_high, last_message_at desc);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 4000),
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index messages_conversation_idx on public.messages (conversation_id, created_at desc);

create or replace function public.is_conversation_member(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation and auth.uid() in (c.user_low, c.user_high)
  )
$$;

-- Se puede escribir si hay conexión aceptada y ningún bloqueo.
create or replace function public.can_message(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation
      and auth.uid() in (c.user_low, c.user_high)
      and public.can_write()
      and public.is_connected_with(case when c.user_low = auth.uid() then c.user_high else c.user_low end)
      and not public.is_blocked_with(case when c.user_low = auth.uid() then c.user_high else c.user_low end)
  )
$$;

-- -----------------------------------------------------------------------------
-- Notificaciones y preferencias
-- -----------------------------------------------------------------------------
create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  actor_id        uuid references public.profiles (id) on delete cascade,
  type            public.notification_type not null,
  post_id         uuid references public.posts (id) on delete cascade,
  comment_id      uuid references public.comments (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete cascade,
  circle_id       uuid,  -- FK en la migración de círculos
  project_id      uuid,  -- FK en la migración de proyectos
  body            text not null default '' check (char_length(body) <= 300),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

create table public.notification_prefs (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  comments    boolean not null default true,
  replies     boolean not null default true,
  mentions    boolean not null default true,
  connections boolean not null default true,
  messages    boolean not null default true,
  circles     boolean not null default true,
  projects    boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- Crea una notificación respetando bloqueos y preferencias. Uso interno (triggers).
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

-- Menciones @usuario (máx. 10 por texto).
create or replace function public.notify_mentions(p_text text, p_actor uuid, p_post uuid, p_comment uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  for uid in
    select distinct p.id
    from (select (regexp_matches(coalesce(p_text, ''), '@([A-Za-z0-9_]{3,24})', 'g'))[1] as uname limit 10) m
    join public.profiles p on p.username = m.uname::extensions.citext
    where p.status = 'active' and p.onboarded_at is not null
  loop
    perform public.notify(uid, p_actor, 'mention', p_post, p_comment, null, null, null, p_body);
  end loop;
end;
$$;
revoke all on function public.notify_mentions(text, uuid, uuid, uuid, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Triggers de notificación sobre la comunidad
-- -----------------------------------------------------------------------------
create or replace function public.comments_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_parent_author uuid;
  f record;
begin
  select coalesce(title, left(body, 80)) into v_title from public.posts where id = new.post_id;
  if new.parent_id is not null then
    select author_id into v_parent_author from public.comments where id = new.parent_id;
    perform public.notify(v_parent_author, new.author_id, 'reply', new.post_id, new.id, null, null, null, v_title);
  end if;
  for f in
    select user_id from public.post_follows
    where post_id = new.post_id and user_id <> new.author_id and user_id is distinct from v_parent_author
    limit 500
  loop
    perform public.notify(f.user_id, new.author_id, 'comment', new.post_id, new.id, null, null, null, v_title);
  end loop;
  perform public.notify_mentions(new.body, new.author_id, new.post_id, new.id, v_title);
  return null;
end;
$$;

create trigger comments_notify
after insert on public.comments
for each row execute function public.comments_notify();

create or replace function public.posts_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify_mentions(new.body, new.author_id, new.id, null, coalesce(new.title, left(new.body, 80)));
  return null;
end;
$$;

create trigger posts_notify
after insert on public.posts
for each row execute function public.posts_notify();

-- -----------------------------------------------------------------------------
-- Triggers de conexiones, bloqueos y mensajes
-- -----------------------------------------------------------------------------
create or replace function public.connections_before()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    new.responded_at := now();
  end if;
  return new;
end;
$$;

create trigger connections_before
before update on public.connections
for each row execute function public.connections_before();

create or replace function public.connections_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify(new.addressee_id, new.requester_id, 'connection_request', null, null, null, null, null, new.message);
  elsif new.status = 'accepted' and old.status <> 'accepted' then
    perform public.notify(new.requester_id, new.addressee_id, 'connection_accepted');
  end if;
  return null;
end;
$$;

create trigger connections_notify
after insert or update on public.connections
for each row execute function public.connections_notify();

-- Bloquear elimina la conexión existente.
create or replace function public.blocks_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.connections
  where pair_low = least(new.blocker_id, new.blocked_id)
    and pair_high = greatest(new.blocker_id, new.blocked_id);
  return null;
end;
$$;

create trigger blocks_after_insert
after insert on public.blocks
for each row execute function public.blocks_after_insert();

create or replace function public.messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.conversations;
  recipient uuid;
begin
  select * into c from public.conversations where id = new.conversation_id;
  recipient := case when c.user_low = new.sender_id then c.user_high else c.user_low end;
  update public.conversations
  set last_message_at = new.created_at,
      low_read_at  = case when user_low = new.sender_id then new.created_at else low_read_at end,
      high_read_at = case when user_high = new.sender_id then new.created_at else high_read_at end
  where id = new.conversation_id;
  -- Un único aviso pendiente por conversación.
  if not exists (
    select 1 from public.notifications
    where user_id = recipient and type = 'message' and conversation_id = new.conversation_id and read_at is null
  ) then
    perform public.notify(recipient, new.sender_id, 'message', null, null, new.conversation_id, null, null, left(new.body, 120));
  end if;
  return null;
end;
$$;

create trigger messages_after_insert
after insert on public.messages
for each row execute function public.messages_after_insert();

-- -----------------------------------------------------------------------------
-- Privilegios y RLS
-- -----------------------------------------------------------------------------
revoke all on public.connections, public.member_skips, public.conversations, public.messages,
  public.notifications, public.notification_prefs from anon, authenticated;

grant select, insert, delete on public.connections to authenticated;
grant update (status) on public.connections to authenticated;
grant select, insert, delete on public.member_skips to authenticated;
grant select on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select, insert, update on public.notification_prefs to authenticated;

alter table public.connections        enable row level security;
alter table public.member_skips       enable row level security;
alter table public.conversations      enable row level security;
alter table public.messages           enable row level security;
alter table public.notifications      enable row level security;
alter table public.notification_prefs enable row level security;

create policy "connections: participantes" on public.connections for select to authenticated
using (auth.uid() in (requester_id, addressee_id));

create policy "connections: solicitar" on public.connections for insert to authenticated
with check (
  requester_id = auth.uid()
  and status = 'pending'
  and public.can_write()
  and not public.is_blocked_with(addressee_id)
  and exists (
    select 1 from public.profiles p
    where p.id = addressee_id and p.status = 'active' and p.onboarded_at is not null
  )
);

create policy "connections: responder" on public.connections for update to authenticated
using (addressee_id = auth.uid() and status = 'pending')
with check (addressee_id = auth.uid() and status in ('accepted', 'declined'));

-- Quien solicita puede cancelar si sigue pendiente; quien recibe puede borrar
-- (también un rechazo); cualquiera de los dos puede deshacer una conexión aceptada.
create policy "connections: retirar" on public.connections for delete to authenticated
using (
  (requester_id = auth.uid() and status = 'pending')
  or addressee_id = auth.uid()
  or (status = 'accepted' and auth.uid() in (requester_id, addressee_id))
);

create policy "member_skips: propios" on public.member_skips for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "conversations: participantes" on public.conversations for select to authenticated
using (auth.uid() in (user_low, user_high));

create policy "messages: lectura" on public.messages for select to authenticated
using (public.is_conversation_member(conversation_id));

create policy "messages: envío" on public.messages for insert to authenticated
with check (sender_id = auth.uid() and public.can_message(conversation_id));

create policy "notifications: propias" on public.notifications for select to authenticated
using (user_id = auth.uid());
create policy "notifications: marcar leídas" on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
create policy "notifications: borrar" on public.notifications for delete to authenticated
using (user_id = auth.uid());

create policy "notification_prefs: propias" on public.notification_prefs for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Funciones de aplicación
-- -----------------------------------------------------------------------------

-- Abre (o recupera) la conversación con otra persona conectada.
create or replace function public.start_conversation(p_other uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or p_other = auth.uid() then
    raise exception 'No válido' using errcode = '22023';
  end if;
  if not public.is_connected_with(p_other) or public.is_blocked_with(p_other) then
    raise exception 'Solo puedes escribir a tus conexiones' using errcode = '42501';
  end if;
  select id into v_id from public.conversations
  where user_low = least(auth.uid(), p_other) and user_high = greatest(auth.uid(), p_other);
  if v_id is null then
    insert into public.conversations (user_low, user_high)
    values (least(auth.uid(), p_other), greatest(auth.uid(), p_other))
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set low_read_at  = case when user_low = auth.uid() then now() else low_read_at end,
      high_read_at = case when user_high = auth.uid() then now() else high_read_at end
  where id = p_conversation and auth.uid() in (user_low, user_high);
  update public.notifications set read_at = now()
  where user_id = auth.uid() and conversation_id = p_conversation and read_at is null;
end;
$$;

create or replace function public.delete_message(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.messages set deleted_at = now(), body = '[eliminado]'
  where id = p_id and sender_id = auth.uid() and deleted_at is null;
  if not found then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
end;
$$;

-- Bandeja de conversaciones con no leídos.
create or replace function public.my_conversations()
returns table (
  id uuid, other_id uuid, other_username text, other_name text, other_avatar text,
  last_body text, last_sender uuid, last_message_at timestamptz, unread bigint, can_write boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.id, o.id, o.username::text, coalesce(o.display_name, o.username::text), o.avatar_url,
    m.body, m.sender_id, c.last_message_at,
    (select count(*) from public.messages x
      where x.conversation_id = c.id and x.sender_id <> auth.uid()
        and x.created_at > case when c.user_low = auth.uid() then c.low_read_at else c.high_read_at end),
    public.can_message(c.id)
  from public.conversations c
  join public.profiles o on o.id = case when c.user_low = auth.uid() then c.user_high else c.user_low end
  left join lateral (
    select body, sender_id from public.messages where conversation_id = c.id order by created_at desc limit 1
  ) m on true
  where auth.uid() in (c.user_low, c.user_high)
  order by c.last_message_at desc
  limit 100
$$;

-- Contadores para la navegación.
create or replace function public.my_unread_counts()
returns table (messages bigint, notifications bigint, requests bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (select count(*) from public.messages x
      join public.conversations c on c.id = x.conversation_id
      where auth.uid() in (c.user_low, c.user_high) and x.sender_id <> auth.uid()
        and x.created_at > case when c.user_low = auth.uid() then c.low_read_at else c.high_read_at end),
    (select count(*) from public.notifications n where n.user_id = auth.uid() and n.read_at is null and n.type <> 'message'),
    (select count(*) from public.connections k where k.addressee_id = auth.uid() and k.status = 'pending')
$$;

-- Tarjetas de miembro con afinidad y estado de conexión.
create type public.member_card as (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  looking_for text,
  country text,
  region text,
  availability public.chat_availability,
  personal_projects text,
  shared_count integer,
  shared_interests text[],
  interests text[],
  connection text   -- none | sent | received | connected
);

create or replace function public.member_card_for(p_id uuid)
returns public.member_card
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id, p.username::text, coalesce(p.display_name, p.username::text), p.avatar_url, p.bio, p.looking_for,
    p.country, p.region, p.availability, p.personal_projects,
    (select count(*)::int from public.profile_interests a
      join public.profile_interests b on b.interest_slug = a.interest_slug and b.profile_id = auth.uid()
      where a.profile_id = p.id),
    array(select i.name from public.profile_interests a
      join public.profile_interests b on b.interest_slug = a.interest_slug and b.profile_id = auth.uid()
      join public.interests i on i.slug = a.interest_slug
      where a.profile_id = p.id order by i.position),
    array(select i.name from public.profile_interests a
      join public.interests i on i.slug = a.interest_slug
      where a.profile_id = p.id order by a.is_favorite desc, i.position limit 8),
    coalesce((
      select case
        when k.status = 'accepted' then 'connected'
        when k.requester_id = auth.uid() then 'sent'
        when k.status = 'pending' then 'received'
        else 'none' end
      from public.connections k
      where k.pair_low = least(auth.uid(), p.id) and k.pair_high = greatest(auth.uid(), p.id)
    ), 'none')
  from public.profiles p
  where p.id = p_id
$$;

-- Buscador de miembros con filtros.
create or replace function public.search_members(
  p_query text default null,
  p_interests text[] default null,
  p_country text default null,
  p_region text default null,
  p_availability public.chat_availability default null,
  p_with_projects boolean default false,
  p_limit integer default 20,
  p_offset integer default 0
)
returns setof public.member_card
language sql
stable
security invoker
set search_path = ''
as $$
  select mc.*
  from public.profiles p
  cross join lateral public.member_card_for(p.id) as mc
  where p.onboarded_at is not null and p.status = 'active' and p.id <> auth.uid()
    and not public.is_blocked_with(p.id)
    and (coalesce(p_query, '') = '' or public.immutable_unaccent(
          coalesce(p.username::text, '') || ' ' || coalesce(p.display_name, '') || ' ' || p.bio || ' ' ||
          p.looking_for || ' ' || p.personal_projects
        ) ilike '%' || public.immutable_unaccent(p_query) || '%')
    and (p_interests is null or cardinality(p_interests) = 0 or exists (
          select 1 from public.profile_interests pi where pi.profile_id = p.id and pi.interest_slug = any (p_interests)))
    and (coalesce(p_country, '') = '' or lower(public.immutable_unaccent(p.country)) = lower(public.immutable_unaccent(p_country)))
    and (coalesce(p_region, '') = '' or public.immutable_unaccent(coalesce(p.region, '')) ilike '%' || public.immutable_unaccent(p_region) || '%')
    and (p_availability is null or p.availability = p_availability)
    and (not coalesce(p_with_projects, false) or p.personal_projects <> '')
  order by mc.shared_count desc, p.onboarded_at desc
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0)
$$;

-- «Descubrir»: personas afines sin conexión ni descarte reciente.
create or replace function public.discover_members(p_limit integer default 12)
returns setof public.member_card
language sql
stable
security invoker
set search_path = ''
as $$
  select mc.*
  from public.profiles p
  cross join lateral public.member_card_for(p.id) as mc
  where p.onboarded_at is not null and p.status = 'active' and p.id <> auth.uid()
    and p.availability <> 'closed'
    and not public.is_blocked_with(p.id)
    and not exists (
      select 1 from public.connections k
      where k.pair_low = least(auth.uid(), p.id) and k.pair_high = greatest(auth.uid(), p.id))
    and not exists (
      select 1 from public.member_skips s
      where s.user_id = auth.uid() and s.skipped_id = p.id and s.created_at > now() - interval '30 days')
  order by mc.shared_count desc, (p.availability = 'open') desc, p.onboarded_at desc
  limit least(greatest(p_limit, 1), 30)
$$;

-- Países declarados (para el filtro).
create or replace function public.member_countries()
returns table (country text, members bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select initcap(lower(trim(p.country))), count(*)
  from public.profiles p
  where p.onboarded_at is not null and p.status = 'active' and coalesce(trim(p.country), '') <> ''
  group by initcap(lower(trim(p.country)))
  order by count(*) desc, 1
  limit 100
$$;

revoke all on function public.is_connected_with(uuid), public.is_conversation_member(uuid), public.can_message(uuid),
  public.start_conversation(uuid), public.mark_conversation_read(uuid), public.delete_message(uuid),
  public.my_conversations(), public.my_unread_counts(), public.member_card_for(uuid),
  public.search_members(text, text[], text, text, public.chat_availability, boolean, integer, integer),
  public.discover_members(integer), public.member_countries()
  from public, anon;
grant execute on function public.is_connected_with(uuid), public.is_conversation_member(uuid), public.can_message(uuid),
  public.start_conversation(uuid), public.mark_conversation_read(uuid), public.delete_message(uuid),
  public.my_conversations(), public.my_unread_counts(), public.member_card_for(uuid),
  public.search_members(text, text[], text, text, public.chat_availability, boolean, integer, integer),
  public.discover_members(integer), public.member_countries()
  to authenticated;

-- -----------------------------------------------------------------------------
-- Tiempo real: mensajes y notificaciones (respetan RLS)
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages, public.notifications;
  end if;
end $$;
