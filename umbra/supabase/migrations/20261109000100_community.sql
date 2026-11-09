-- =============================================================================
-- Migración 0004 · Comunidad: publicaciones, etiquetas, comentarios, reacciones,
-- guardados, seguimiento, imágenes, bloqueos, denuncias y búsqueda.
-- =============================================================================

create extension if not exists unaccent with schema extensions;

-- Envoltorio inmutable de unaccent (necesario para columnas generadas e índices).
create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

-- Miembro activo y sin restricciones: puede crear contenido.
create or replace function public.can_write()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active' and p.role <> 'restricted'
  )
$$;
revoke all on function public.can_write() from public, anon;
grant execute on function public.can_write() to authenticated;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.post_kind as enum ('documented', 'hypothesis', 'opinion', 'experience');
create type public.reaction_type as enum ('valuable', 'curious', 'agree', 'needs_sources');
create type public.report_target as enum ('post', 'comment', 'profile', 'message', 'circle', 'project');
create type public.report_reason as enum (
  'spam', 'harassment', 'hate', 'illegal', 'personal_data', 'mislabeled', 'other'
);
create type public.report_status as enum ('open', 'resolved', 'dismissed');

-- -----------------------------------------------------------------------------
-- Bloqueos entre miembros
-- -----------------------------------------------------------------------------
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

-- ¿Existe un bloqueo en cualquier sentido entre el usuario actual y otro?
create or replace function public.is_blocked_with(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = p_other)
       or (b.blocker_id = p_other and b.blocked_id = auth.uid())
  )
$$;
revoke all on function public.is_blocked_with(uuid) from public, anon;
grant execute on function public.is_blocked_with(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Etiquetas
-- -----------------------------------------------------------------------------
create table public.tags (
  slug       text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 32),
  name       text not null check (char_length(name) between 2 and 32),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Normaliza un texto a slug: minúsculas, sin acentos, guiones.
create or replace function public.slugify(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(public.immutable_unaccent(coalesce(p, ''))), '[^a-z0-9]+', '-', 'g'))
$$;

-- -----------------------------------------------------------------------------
-- Publicaciones (foros, Ágora y, más adelante, círculos)
-- -----------------------------------------------------------------------------
create table public.posts (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid not null references public.profiles (id) on delete cascade,
  category_slug    text references public.categories (slug) on delete restrict,
  circle_id        uuid,  -- FK en la migración de círculos
  title            text check (title is null or char_length(title) between 3 and 160),
  body             text not null check (char_length(body) between 1 and 20000),
  kind             public.post_kind not null default 'opinion',
  is_question      boolean not null default false,
  sources          text[] not null default '{}' check (cardinality(sources) <= 12),
  image_paths      text[] not null default '{}' check (cardinality(image_paths) <= 4),
  comment_count    integer not null default 0,
  reaction_count   integer not null default 0,
  last_activity_at timestamptz not null default now(),
  is_locked        boolean not null default false,
  is_pinned        boolean not null default false,
  created_at       timestamptz not null default now(),
  edited_at        timestamptz,
  deleted_at       timestamptz,
  deleted_by       uuid references public.profiles (id) on delete set null,
  search           tsvector generated always as (
    setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
    setweight(to_tsvector('spanish', public.immutable_unaccent(body)), 'B')
  ) stored,
  -- Lo documentado se apoya en fuentes.
  constraint posts_documented_needs_sources check (kind <> 'documented' or cardinality(sources) >= 1),
  -- En los foros, toda publicación lleva título.
  constraint posts_forum_needs_title check (category_slug is null or title is not null)
);

create index posts_feed_idx on public.posts (created_at desc) where deleted_at is null;
create index posts_category_idx on public.posts (category_slug, created_at desc) where deleted_at is null;
create index posts_circle_idx on public.posts (circle_id, created_at desc) where deleted_at is null;
create index posts_author_idx on public.posts (author_id, created_at desc);
create index posts_activity_idx on public.posts (last_activity_at desc) where deleted_at is null;
create index posts_search_idx on public.posts using gin (search);

create table public.post_tags (
  post_id  uuid not null references public.posts (id) on delete cascade,
  tag_slug text not null references public.tags (slug) on delete cascade,
  primary key (post_id, tag_slug)
);
create index post_tags_tag_idx on public.post_tags (tag_slug);

-- -----------------------------------------------------------------------------
-- Comentarios en hilo
-- -----------------------------------------------------------------------------
create table public.comments (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.posts (id) on delete cascade,
  author_id      uuid not null references public.profiles (id) on delete cascade,
  parent_id      uuid references public.comments (id) on delete cascade,
  depth          smallint not null default 0 check (depth between 0 and 12),
  body           text not null check (char_length(body) between 1 and 5000),
  reaction_count integer not null default 0,
  created_at     timestamptz not null default now(),
  edited_at      timestamptz,
  deleted_at     timestamptz,
  deleted_by     uuid references public.profiles (id) on delete set null
);
create index comments_post_idx on public.comments (post_id, created_at);
create index comments_author_idx on public.comments (author_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Reacciones, guardados y seguimiento
-- -----------------------------------------------------------------------------
create table public.post_reactions (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       public.reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, type)
);
create index post_reactions_user_idx on public.post_reactions (user_id);

create table public.comment_reactions (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       public.reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id, type)
);
create index comment_reactions_user_idx on public.comment_reactions (user_id);

create table public.saved_posts (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  post_id    uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.post_follows (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  post_id    uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index post_follows_post_idx on public.post_follows (post_id);

-- -----------------------------------------------------------------------------
-- Denuncias (la gestión se completa en la migración de moderación)
-- -----------------------------------------------------------------------------
create table public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid references public.profiles (id) on delete set null,
  target_type     public.report_target not null,
  target_id       uuid not null,
  reason          public.report_reason not null,
  details         text not null default '' check (char_length(details) <= 1000),
  status          public.report_status not null default 'open',
  resolved_by     uuid references public.profiles (id) on delete set null,
  resolution_note text not null default '' check (char_length(resolution_note) <= 1000),
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  unique (reporter_id, target_type, target_id)
);
create index reports_status_idx on public.reports (status, created_at desc);

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

-- Las imágenes de una publicación deben estar en la carpeta de su autor.
create or replace function public.posts_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from unnest(new.image_paths) as p
    where p not like new.author_id::text || '/%' or p like '%..%'
  ) then
    raise exception 'Ruta de imagen no válida' using errcode = '22023';
  end if;
  new.sources := array(
    select left(trim(s), 500) from unnest(new.sources) as s where trim(s) <> ''
  );
  if tg_op = 'UPDATE' and (new.title is distinct from old.title or new.body is distinct from old.body) then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create trigger posts_validate
before insert or update on public.posts
for each row execute function public.posts_validate();

-- Quien publica sigue su propia conversación.
create or replace function public.posts_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.post_follows (user_id, post_id) values (new.author_id, new.id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger posts_after_insert
after insert on public.posts
for each row execute function public.posts_after_insert();

-- Profundidad del hilo y coherencia con la publicación.
create or replace function public.comments_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent record;
  post record;
begin
  select is_locked, deleted_at into post from public.posts where id = new.post_id;
  if post is null or post.deleted_at is not null then
    raise exception 'La publicación no existe' using errcode = '23503';
  end if;
  if post.is_locked then
    raise exception 'La conversación está cerrada' using errcode = '42501';
  end if;
  if new.parent_id is not null then
    select post_id, depth into parent from public.comments where id = new.parent_id;
    if parent is null or parent.post_id <> new.post_id then
      raise exception 'Respuesta no válida' using errcode = '22023';
    end if;
    new.depth := least(parent.depth + 1, 12);
  else
    new.depth := 0;
  end if;
  return new;
end;
$$;

create trigger comments_before_insert
before insert on public.comments
for each row execute function public.comments_before_insert();

-- Contadores, actividad y seguimiento automático al comentar.
create or replace function public.comments_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.posts
  set comment_count = comment_count + 1, last_activity_at = now()
  where id = new.post_id;
  insert into public.post_follows (user_id, post_id) values (new.author_id, new.post_id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger comments_after_insert
after insert on public.comments
for each row execute function public.comments_after_insert();

create or replace function public.comments_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.body is distinct from old.body and new.deleted_at is null then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create trigger comments_before_update
before update on public.comments
for each row execute function public.comments_before_update();

-- Contadores de reacciones.
create or replace function public.post_reactions_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set reaction_count = reaction_count + 1 where id = new.post_id;
  else
    update public.posts set reaction_count = greatest(reaction_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger post_reactions_count
after insert or delete on public.post_reactions
for each row execute function public.post_reactions_count();

create or replace function public.comment_reactions_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set reaction_count = reaction_count + 1 where id = new.comment_id;
  else
    update public.comments set reaction_count = greatest(reaction_count - 1, 0) where id = old.comment_id;
  end if;
  return null;
end;
$$;

create trigger comment_reactions_count
after insert or delete on public.comment_reactions
for each row execute function public.comment_reactions_count();

-- -----------------------------------------------------------------------------
-- Privilegios
-- -----------------------------------------------------------------------------
revoke all on public.tags, public.posts, public.post_tags, public.comments, public.post_reactions,
  public.comment_reactions, public.saved_posts, public.post_follows, public.blocks, public.reports
  from anon, authenticated;

grant select, insert on public.tags to authenticated;
grant select, insert on public.posts to authenticated;
grant update (title, body, kind, is_question, sources, image_paths, category_slug) on public.posts to authenticated;
grant select, insert, delete on public.post_tags to authenticated;
grant select, insert on public.comments to authenticated;
grant update (body) on public.comments to authenticated;
grant select, insert, delete on public.post_reactions, public.comment_reactions to authenticated;
grant select, insert, delete on public.saved_posts, public.post_follows to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant insert on public.reports to authenticated;
grant select on public.reports to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.tags              enable row level security;
alter table public.posts             enable row level security;
alter table public.post_tags         enable row level security;
alter table public.comments          enable row level security;
alter table public.post_reactions    enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.saved_posts       enable row level security;
alter table public.post_follows      enable row level security;
alter table public.blocks            enable row level security;
alter table public.reports           enable row level security;

-- Etiquetas
create policy "tags: lectura" on public.tags for select to authenticated
using (public.is_active_member());
create policy "tags: alta" on public.tags for insert to authenticated
with check (public.can_write() and created_by = auth.uid());

-- Publicaciones (la visibilidad de círculos se añade en su migración)
create policy "posts: lectura" on public.posts for select to authenticated
using (
  public.is_staff()
  or (deleted_at is null and circle_id is null and public.is_active_member())
);
create policy "posts: alta" on public.posts for insert to authenticated
with check (
  author_id = auth.uid()
  and public.can_write()
  and circle_id is null
  and (
    category_slug is null
    or exists (select 1 from public.categories c where c.slug = category_slug and not c.is_archived)
  )
);
create policy "posts: edición propia" on public.posts for update to authenticated
using (author_id = auth.uid() and deleted_at is null and not is_locked and public.can_write())
with check (author_id = auth.uid());

-- Etiquetas de publicación: visibles si la publicación lo es; las gestiona su autor.
create policy "post_tags: lectura" on public.post_tags for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id));
create policy "post_tags: alta" on public.post_tags for insert to authenticated
with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy "post_tags: baja" on public.post_tags for delete to authenticated
using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

-- Comentarios: visibles si la publicación lo es.
create policy "comments: lectura" on public.comments for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id));
create policy "comments: alta" on public.comments for insert to authenticated
with check (
  author_id = auth.uid()
  and public.can_write()
  and exists (select 1 from public.posts p where p.id = post_id and not p.is_locked)
);
create policy "comments: edición propia" on public.comments for update to authenticated
using (author_id = auth.uid() and deleted_at is null and public.can_write())
with check (author_id = auth.uid());

-- Reacciones
create policy "post_reactions: lectura" on public.post_reactions for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id));
create policy "post_reactions: alta propia" on public.post_reactions for insert to authenticated
with check (user_id = auth.uid() and public.is_active_member() and exists (select 1 from public.posts p where p.id = post_id));
create policy "post_reactions: baja propia" on public.post_reactions for delete to authenticated
using (user_id = auth.uid());

create policy "comment_reactions: lectura" on public.comment_reactions for select to authenticated
using (exists (select 1 from public.comments c where c.id = comment_id));
create policy "comment_reactions: alta propia" on public.comment_reactions for insert to authenticated
with check (user_id = auth.uid() and public.is_active_member() and exists (select 1 from public.comments c where c.id = comment_id and c.deleted_at is null));
create policy "comment_reactions: baja propia" on public.comment_reactions for delete to authenticated
using (user_id = auth.uid());

-- Guardados y seguimiento: solo los propios.
create policy "saved_posts: propios" on public.saved_posts for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id));
create policy "post_follows: propios" on public.post_follows for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id));

-- Bloqueos: cada cual gestiona los suyos.
create policy "blocks: propios" on public.blocks for all to authenticated
using (blocker_id = auth.uid())
with check (blocker_id = auth.uid() and public.is_active_member());

-- Denuncias: cualquiera activo puede denunciar; ve las suyas; el equipo, todas.
create policy "reports: alta" on public.reports for insert to authenticated
with check (reporter_id = auth.uid() and public.is_active_member() and status = 'open');
create policy "reports: lectura" on public.reports for select to authenticated
using (reporter_id = auth.uid() or public.is_staff());

-- -----------------------------------------------------------------------------
-- Funciones de aplicación
-- -----------------------------------------------------------------------------

-- Sustituye las etiquetas de una publicación (máx. 5). Crea las que no existan.
create or replace function public.set_post_tags(p_post uuid, p_tags text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  t text;
  s text;
  slugs text[] := '{}';
begin
  if not exists (select 1 from public.posts where id = p_post and author_id = auth.uid()) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  foreach t in array coalesce(p_tags, '{}') loop
    s := left(public.slugify(t), 32);
    if char_length(s) >= 2 and not (s = any (slugs)) then
      slugs := slugs || s;
      insert into public.tags (slug, name, created_by)
      values (s, left(trim(t), 32), auth.uid())
      on conflict (slug) do nothing;
    end if;
  end loop;
  if cardinality(slugs) > 5 then
    raise exception 'Máximo 5 etiquetas' using errcode = '23514';
  end if;
  delete from public.post_tags where post_id = p_post and not (tag_slug = any (slugs));
  insert into public.post_tags (post_id, tag_slug)
  select p_post, x from unnest(slugs) as x
  on conflict do nothing;
end;
$$;

-- Crea una publicación con sus etiquetas de forma atómica.
create or replace function public.create_post(
  p_title text,
  p_body text,
  p_kind public.post_kind,
  p_category text default null,
  p_is_question boolean default false,
  p_sources text[] default '{}',
  p_tags text[] default '{}',
  p_image_paths text[] default '{}',
  p_circle uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.posts (author_id, title, body, kind, category_slug, circle_id, is_question, sources, image_paths)
  values (
    auth.uid(), nullif(trim(p_title), ''), trim(p_body), p_kind, p_category, p_circle,
    coalesce(p_is_question, false), coalesce(p_sources, '{}'), coalesce(p_image_paths, '{}')
  )
  returning id into v_id;
  perform public.set_post_tags(v_id, p_tags);
  return v_id;
end;
$$;

-- Edita una publicación propia y sus etiquetas.
create or replace function public.update_post(
  p_id uuid,
  p_title text,
  p_body text,
  p_kind public.post_kind,
  p_is_question boolean,
  p_sources text[],
  p_tags text[],
  p_image_paths text[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.posts
  set title = nullif(trim(p_title), ''), body = trim(p_body), kind = p_kind,
      is_question = coalesce(p_is_question, false), sources = coalesce(p_sources, '{}'),
      image_paths = coalesce(p_image_paths, '{}')
  where id = p_id and author_id = auth.uid();
  if not found then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  perform public.set_post_tags(p_id, p_tags);
end;
$$;

-- Borrado lógico de una publicación (autor o equipo).
create or replace function public.delete_post(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.posts
  set deleted_at = now(), deleted_by = auth.uid()
  where id = p_id and deleted_at is null
    and (author_id = auth.uid() or public.is_staff());
  if not found then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
end;
$$;

-- Borrado lógico de un comentario: conserva el hilo, elimina el texto.
create or replace function public.delete_comment(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_post uuid;
begin
  update public.comments
  set deleted_at = now(), deleted_by = auth.uid(), body = '[eliminado]'
  where id = p_id and deleted_at is null
    and (author_id = auth.uid() or public.is_staff())
  returning post_id into v_post;
  if v_post is null then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  update public.posts set comment_count = greatest(comment_count - 1, 0) where id = v_post;
  delete from public.comment_reactions where comment_id = p_id;
end;
$$;

-- Columnas comunes de los listados de publicaciones.
create type public.post_list_item as (
  id uuid,
  title text,
  excerpt text,
  kind public.post_kind,
  is_question boolean,
  category_slug text,
  category_name text,
  circle_id uuid,
  author_id uuid,
  author_username text,
  author_name text,
  author_avatar text,
  tags text[],
  comment_count integer,
  reaction_count integer,
  image_count integer,
  is_pinned boolean,
  is_locked boolean,
  created_at timestamptz,
  last_activity_at timestamptz
);

-- Listado de publicaciones con filtros y las cuatro ordenaciones.
-- SECURITY INVOKER: las políticas RLS deciden qué se ve.
create or replace function public.feed_posts(
  p_scope text default 'all',      -- all | forum | agora | circle
  p_category text default null,
  p_circle uuid default null,
  p_tag text default null,
  p_kind public.post_kind default null,
  p_author uuid default null,
  p_sort text default 'recent',    -- recent | popular | commented | trending
  p_saved_only boolean default false,
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

-- Búsqueda de publicaciones: sin acentos, con prefijos ("cuant" encuentra "cuántica").
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

-- Estadísticas por territorio (solo lo visible para quien consulta).
create or replace function public.category_stats()
returns table (slug text, post_count bigint, last_activity_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.slug, count(p.id), max(p.last_activity_at)
  from public.categories c
  left join public.posts p on p.category_slug = c.slug and p.deleted_at is null and p.circle_id is null
  where not c.is_archived
  group by c.slug
$$;

-- Resumen de reacciones de una publicación y sus comentarios, con las propias.
create or replace function public.reaction_summary(p_post uuid)
returns table (target text, target_id uuid, type public.reaction_type, total bigint, mine boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select 'post', r.post_id, r.type, count(*), bool_or(r.user_id = auth.uid())
  from public.post_reactions r where r.post_id = p_post
  group by r.post_id, r.type
  union all
  select 'comment', r.comment_id, r.type, count(*), bool_or(r.user_id = auth.uid())
  from public.comment_reactions r
  join public.comments c on c.id = r.comment_id
  where c.post_id = p_post
  group by r.comment_id, r.type
$$;

-- Etiquetas más usadas en los últimos 30 días.
create or replace function public.trending_tags(p_limit integer default 12)
returns table (slug text, name text, uses bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.slug, t.name, count(*)
  from public.post_tags pt
  join public.posts p on p.id = pt.post_id and p.deleted_at is null and p.created_at > now() - interval '30 days'
  join public.tags t on t.slug = pt.tag_slug
  group by t.slug, t.name
  order by count(*) desc, t.slug
  limit least(greatest(p_limit, 1), 30)
$$;

revoke all on function public.set_post_tags(uuid, text[]) from public, anon;
revoke all on function public.create_post(text, text, public.post_kind, text, boolean, text[], text[], text[], uuid) from public, anon;
revoke all on function public.update_post(uuid, text, text, public.post_kind, boolean, text[], text[], text[]) from public, anon;
revoke all on function public.delete_post(uuid) from public, anon;
revoke all on function public.delete_comment(uuid) from public, anon;
revoke all on function public.feed_posts(text, text, uuid, text, public.post_kind, uuid, text, boolean, integer, integer) from public, anon;
revoke all on function public.search_posts(text, integer, integer) from public, anon;
revoke all on function public.category_stats() from public, anon;
revoke all on function public.reaction_summary(uuid) from public, anon;
revoke all on function public.trending_tags(integer) from public, anon;
grant execute on function
  public.set_post_tags(uuid, text[]),
  public.create_post(text, text, public.post_kind, text, boolean, text[], text[], text[], uuid),
  public.update_post(uuid, text, text, public.post_kind, boolean, text[], text[], text[]),
  public.delete_post(uuid),
  public.delete_comment(uuid),
  public.feed_posts(text, text, uuid, text, public.post_kind, uuid, text, boolean, integer, integer),
  public.search_posts(text, integer, integer),
  public.category_stats(),
  public.reaction_summary(uuid),
  public.trending_tags(integer)
to authenticated;

-- -----------------------------------------------------------------------------
-- Almacenamiento privado de imágenes de publicaciones (URLs firmadas)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "post-images: subir a carpeta propia"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.can_write()
);

create policy "post-images: lectura para miembros"
on storage.objects for select to authenticated
using (bucket_id = 'post-images' and public.is_active_member());

create policy "post-images: borrar en carpeta propia"
on storage.objects for delete to authenticated
using (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
