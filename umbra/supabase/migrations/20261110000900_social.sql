-- =============================================================================
-- Migración 0017 · Red social: seguir personas, publicaciones de fotos en
-- carrusel (hasta 10), destino personal (perfil), ámbito, visibilidad
-- (miembros, seguidores o conexiones), borradores, «me gusta» con aviso y
-- avisos de nuevos seguidores. Seguir ≠ conectar: seguir es unilateral.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Seguir personas
-- -----------------------------------------------------------------------------
create table public.member_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followed_id uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);
create index member_follows_followed_idx on public.member_follows (followed_id, created_at desc);

alter table public.notification_prefs
  add column follows boolean not null default true,
  add column reactions boolean not null default true;

-- Avisos: se añaden seguidores y reacciones a las preferencias
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
      when p_type = 'follow' then prefs.follows
      when p_type = 'reaction' then prefs.reactions
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

create or replace function public.member_follows_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_blocked_with(new.followed_id) then
    raise exception 'No puedes seguir a esta persona' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = new.followed_id and status = 'active' and onboarded_at is not null) then
    raise exception 'Perfil no disponible' using errcode = '22023';
  end if;
  if not public.is_staff() then
    perform public.rate_check(
      (select count(*) from public.member_follows where follower_id = new.follower_id and created_at > now() - interval '1 day'),
      200, 'Has seguido a muchas personas hoy. Vuelve mañana.');
  end if;
  return new;
end;
$$;
create trigger member_follows_guard before insert on public.member_follows
for each row execute function public.member_follows_guard();

create or replace function public.member_follows_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Un aviso por persona: si deja de seguir y vuelve a seguir el mismo día, no se repite.
  if not exists (
    select 1 from public.notifications n
    where n.user_id = new.followed_id and n.actor_id = new.follower_id and n.type = 'follow' and n.created_at > now() - interval '1 day'
  ) then
    perform public.notify(new.followed_id, new.follower_id, 'follow', null, null, null, null, null, 'empezó a seguirte');
  end if;
  return null;
end;
$$;
create trigger member_follows_notify after insert on public.member_follows
for each row execute function public.member_follows_notify();

-- Bloquear deja de seguir en ambos sentidos
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
  delete from public.member_follows
  where (follower_id = new.blocker_id and followed_id = new.blocked_id)
     or (follower_id = new.blocked_id and followed_id = new.blocker_id);
  return null;
end;
$$;

-- -----------------------------------------------------------------------------
-- Publicaciones: fotos en carrusel, destino personal, ámbito, visibilidad y borradores
-- -----------------------------------------------------------------------------
alter table public.posts drop constraint posts_image_paths_check;
alter table public.posts drop constraint posts_forum_or_circle;
alter table public.posts drop constraint posts_body_check;
alter table public.posts
  add column area_slug text references public.interest_areas (slug) on delete set null,
  add column audience text not null default 'members' check (audience in ('members', 'followers', 'connections')),
  add column is_draft boolean not null default false,
  -- Descripción de las fotos para lectores de pantalla
  add column image_alt text not null default '' check (char_length(image_alt) <= 300),
  add constraint posts_image_paths_check check (cardinality(image_paths) <= 10),
  -- Una publicación va a un foro, a un círculo o al perfil (ninguno de los dos)
  add constraint posts_one_destination check (circle_id is null or forum_slug is null),
  -- Solo las publicaciones del perfil eligen su público; foros y círculos tienen sus propias reglas
  add constraint posts_audience_personal check (audience = 'members' or (forum_slug is null and circle_id is null)),
  -- El texto puede faltar si hay fotos (pie de foto opcional)
  add constraint posts_body_check check (char_length(body) <= 20000 and (char_length(body) >= 1 or cardinality(image_paths) >= 1));
create index posts_personal_idx on public.posts (author_id, created_at desc) where deleted_at is null and not is_draft;
grant update (area_slug, audience, is_draft, image_alt) on public.posts to authenticated;

-- Recuentos (siempre visibles) y relación con quien consulta
create or replace function public.follow_stats(p_profile uuid)
returns table (followers bigint, following bigint, i_follow boolean, follows_me boolean, posts bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.member_follows f join public.profiles p on p.id = f.follower_id and p.status = 'active' where f.followed_id = p_profile),
    (select count(*) from public.member_follows f join public.profiles p on p.id = f.followed_id and p.status = 'active' where f.follower_id = p_profile),
    exists (select 1 from public.member_follows where follower_id = auth.uid() and followed_id = p_profile),
    exists (select 1 from public.member_follows where follower_id = p_profile and followed_id = auth.uid()),
    (select count(*) from public.posts x where x.author_id = p_profile and x.deleted_at is null and not x.is_draft and x.circle_id is null
       and public.user_can_read_post(auth.uid(), x.id))
  where public.is_active_member()
$$;

-- Listas de seguidores y seguidos (respetan la privacidad del apartado «Red»)
create or replace function public.follow_list(p_profile uuid, p_kind text, p_limit integer default 50, p_offset integer default 0)
returns table (id uuid, username text, display_name text, avatar_url text, i_follow boolean, followed_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username::text, coalesce(p.display_name, p.username::text), p.avatar_url,
    exists (select 1 from public.member_follows m where m.follower_id = auth.uid() and m.followed_id = p.id),
    f.created_at
  from public.member_follows f
  join public.profiles p on p.id = case when p_kind = 'followers' then f.follower_id else f.followed_id end
  where (case when p_kind = 'followers' then f.followed_id else f.follower_id end) = p_profile
    and p_kind in ('followers', 'following')
    and p.status = 'active' and p.onboarded_at is not null
    and not public.is_blocked_with(p.id)
    and public.profile_section_visible(p_profile, 'network')
  order by f.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0)
$$;


-- ¿Puede una persona leer una publicación? (avisos, encuestas, comentarios)
create or replace function public.user_can_read_post(p_user uuid, p_post uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.posts p
    left join public.circles c on c.id = p.circle_id
    where p.id = p_post and p.deleted_at is null
      and (p.author_id = p_user or not p.is_draft)
      and (
        p.circle_id is null
        or c.visibility = 'public'
        or exists (select 1 from public.circle_members m where m.circle_id = p.circle_id and m.user_id = p_user)
      )
      and (
        p.author_id = p_user
        or p.audience = 'members'
        or (p.audience = 'followers' and exists (select 1 from public.member_follows f where f.follower_id = p_user and f.followed_id = p.author_id))
        or (p.audience = 'connections' and exists (
              select 1 from public.connections k
              where k.status = 'accepted' and k.pair_low = least(p_user, p.author_id) and k.pair_high = greatest(p_user, p.author_id)))
      )
  )
$$;

drop policy "posts: lectura" on public.posts;
create policy "posts: lectura" on public.posts for select to authenticated
using (
  (author_id = auth.uid() and deleted_at is null)
  or (public.is_staff() and not is_draft)
  or (
    deleted_at is null and not is_draft and public.is_active_member()
    and (circle_id is null or public.can_read_circle(circle_id))
    and (
      audience = 'members'
      or (audience = 'followers' and exists (select 1 from public.member_follows f where f.follower_id = auth.uid() and f.followed_id = author_id))
      or (audience = 'connections' and public.is_connected_with(author_id))
    )
  )
);

-- Listados sin borradores
create or replace function public.feed_posts(
  p_scope text default 'all',        -- all (foros) | circle
  p_forum text default null,
  p_category text default null,
  p_circle uuid default null,
  p_tag text default null,
  p_kind public.post_kind default null,
  p_type public.post_type default null,
  p_author uuid default null,
  p_sort text default 'recent',
  p_saved_only boolean default false,
  p_unanswered boolean default false,
  p_limit integer default 20,
  p_offset integer default 0
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
    p.created_at, p.last_activity_at,
    p.forum_slug, f.name, p.post_type,
    exists (select 1 from public.polls pl where pl.post_id = p.id),
    (select count(*)::int from public.post_attachments pa where pa.post_id = p.id)
  from public.posts p
  join public.profiles a on a.id = p.author_id
  left join public.categories c on c.slug = p.category_slug
  left join public.forums f on f.slug = p.forum_slug
  where p.deleted_at is null and not p.is_draft
    and ((p_scope = 'circle' and p.circle_id = p_circle) or (p_scope <> 'circle' and p.circle_id is null))
    and (p_forum is null or p.forum_slug = p_forum)
    and (p_category is null or p.category_slug = p_category)
    and (p_tag is null or exists (select 1 from public.post_tags t where t.post_id = p.id and t.tag_slug = p_tag))
    and (p_kind is null or p.kind = p_kind)
    and (p_type is null or p.post_type = p_type)
    and (p_author is null or p.author_id = p_author)
    and (not p_unanswered or p.comment_count = 0)
    and (not p_saved_only or exists (
      select 1 from public.saved_posts s where s.post_id = p.id and s.user_id = auth.uid()))
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.author_id)
         or (b.blocked_id = auth.uid() and b.blocker_id = p.author_id))
  order by
    case when p_forum is not null or p_category is not null or p_scope = 'circle' then p.is_pinned else false end desc,
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
    p.created_at, p.last_activity_at,
    p.forum_slug, f.name, p.post_type,
    exists (select 1 from public.polls pl where pl.post_id = p.id),
    (select count(*)::int from public.post_attachments pa where pa.post_id = p.id)
  from public.posts p
  join public.profiles a on a.id = p.author_id
  left join public.categories c on c.slug = p.category_slug
  left join public.forums f on f.slug = p.forum_slug
  where p.deleted_at is null and not p.is_draft and p.search @@ q
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.author_id)
         or (b.blocked_id = auth.uid() and b.blocker_id = p.author_id))
  order by ts_rank(p.search, q) desc, p.created_at desc
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
end;
$$;


-- Inicio: publicaciones de quien sigues (y las propias) o «Para ti» (seguidos,
-- intereses y descubrimiento, con decaimiento temporal)
create or replace function public.home_feed(p_mode text default 'for_you', p_limit integer default 12, p_offset integer default 0)
returns setof public.post_list_item
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (select auth.uid() as uid),
  followed as (select followed_id from public.member_follows where follower_id = (select uid from me)),
  my_areas as (
    select distinct t.area_slug from public.profile_topics pt join public.topics t on t.id = pt.topic_id
    where pt.profile_id = (select uid from me)
  )
  select
    p.id, p.title, public.post_excerpt(p.body),
    p.kind, p.is_question, p.category_slug, c.name, p.circle_id,
    p.author_id, a.username::text, coalesce(a.display_name, a.username::text), a.avatar_url,
    coalesce((select array_agg(t.tag_slug order by t.tag_slug) from public.post_tags t where t.post_id = p.id), '{}'),
    p.comment_count, p.reaction_count, cardinality(p.image_paths), p.is_pinned, p.is_locked,
    p.created_at, p.last_activity_at,
    p.forum_slug, f.name, p.post_type,
    exists (select 1 from public.polls pl where pl.post_id = p.id),
    (select count(*)::int from public.post_attachments pa where pa.post_id = p.id)
  from public.posts p
  join public.profiles a on a.id = p.author_id
  left join public.categories c on c.slug = p.category_slug
  left join public.forums f on f.slug = p.forum_slug
  where p.deleted_at is null and not p.is_draft and p.circle_id is null
    and (p_mode <> 'following' or p.author_id = (select uid from me) or p.author_id in (select followed_id from followed))
    and (p_mode <> 'for_you' or p.created_at > now() - interval '120 days')
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.author_id)
         or (b.blocked_id = auth.uid() and b.blocker_id = p.author_id))
  order by
    case when p_mode = 'for_you' then
      (1
        + 2.0 * (p.author_id in (select followed_id from followed))::int
        + 1.0 * (coalesce(p.area_slug, '') in (select area_slug from my_areas))::int
        + 0.6 * (cardinality(p.image_paths) > 0)::int)
      * (p.reaction_count + 2 * p.comment_count + 3)::float
      / power(extract(epoch from (now() - p.created_at)) / 3600.0 + 2, 1.25)
    end desc nulls last,
    p.created_at desc
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0)
$$;

-- -----------------------------------------------------------------------------
-- «Me gusta»: aviso a quien publicó (agrupado: uno por persona y publicación)
-- -----------------------------------------------------------------------------
create or replace function public.post_like_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type = 'like' and not exists (
    select 1 from public.notifications n
    where n.actor_id = new.user_id and n.post_id = new.post_id and n.type = 'reaction'
  ) then
    perform public.notify((select author_id from public.posts where id = new.post_id), new.user_id, 'reaction', new.post_id,
      null, null, null, null, 'le ha gustado tu publicación');
  end if;
  return null;
end;
$$;
create trigger post_like_notify after insert on public.post_reactions
for each row execute function public.post_like_notify();

-- -----------------------------------------------------------------------------
-- Privilegios y RLS
-- -----------------------------------------------------------------------------
revoke all on public.member_follows from anon, authenticated;
grant select, insert, delete on public.member_follows to authenticated;
alter table public.member_follows enable row level security;
create policy "member_follows: propias" on public.member_follows for select to authenticated
using (follower_id = auth.uid() or followed_id = auth.uid());
create policy "member_follows: seguir" on public.member_follows for insert to authenticated
with check (follower_id = auth.uid() and public.is_active_member());
create policy "member_follows: dejar de seguir" on public.member_follows for delete to authenticated
using (follower_id = auth.uid());

revoke all on function
  public.member_follows_guard(), public.member_follows_notify(), public.post_like_notify(),
  public.follow_stats(uuid), public.follow_list(uuid, text, integer, integer),
  public.home_feed(text, integer, integer)
from public, anon;
grant execute on function
  public.follow_stats(uuid), public.follow_list(uuid, text, integer, integer), public.home_feed(text, integer, integer)
to authenticated;
