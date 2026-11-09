-- =============================================================================
-- Migración 0013 · Biblioteca: libros recomendados por los miembros.
-- Un libro aparece una sola vez (se detectan duplicados por título y autoría
-- normalizados o por ISBN); cada persona escribe una recomendación por libro,
-- con nivel y valoración; estanterías personales (quiero leerlo, leyendo, leído).
-- =============================================================================

create table public.books (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 120),
  title       text not null check (char_length(title) between 1 and 200),
  authors     text not null check (char_length(authors) between 2 and 200),
  year        smallint check (year between 0 and 2100),
  isbn        text check (isbn is null or isbn ~ '^(97[89])?\d{9}[\dX]$'),
  area_slug   text references public.interest_areas (slug) on delete set null,
  cover_path  text,
  created_by  uuid references public.profiles (id) on delete set null,
  rec_count   integer not null default 0,
  rating_sum  integer not null default 0,
  rating_count integer not null default 0,
  last_rec_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  -- Portada en la carpeta de quien creó la ficha (bucket «covers»)
  constraint books_cover_owner check (cover_path is null or split_part(cover_path, '/', 1) = created_by::text),
  search      tsvector generated always as (
    setweight(to_tsvector('spanish', public.immutable_unaccent(title)), 'A') ||
    setweight(to_tsvector('spanish', public.immutable_unaccent(authors)), 'B')
  ) stored
);
-- Duplicados: mismo título y autoría (sin tildes, sin mayúsculas, sin signos) o mismo ISBN
create unique index books_identity_idx on public.books (
  public.slugify(title), public.slugify(authors)
);
create unique index books_isbn_idx on public.books (isbn) where isbn is not null;
create index books_area_idx on public.books (area_slug, last_rec_at desc);
create index books_recent_idx on public.books (last_rec_at desc);
create index books_search_idx on public.books using gin (search);
create index books_title_trgm_idx on public.books using gin (public.immutable_unaccent(lower(title)) extensions.gin_trgm_ops);

create table public.book_topics (
  book_id  uuid not null references public.books (id) on delete cascade,
  topic_id bigint not null references public.topics (id) on delete cascade,
  primary key (book_id, topic_id)
);
create index book_topics_topic_idx on public.book_topics (topic_id);

create table public.book_recommendations (
  id           uuid primary key default gen_random_uuid(),
  book_id      uuid not null references public.books (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  body         text not null check (char_length(body) between 20 and 3000),
  level        public.book_level not null default 'intro',
  rating       smallint check (rating between 1 and 5),
  helpful_count integer not null default 0,
  created_at   timestamptz not null default now(),
  edited_at    timestamptz,
  unique (book_id, user_id)
);
create index book_recommendations_book_idx on public.book_recommendations (book_id, helpful_count desc, created_at desc);
create index book_recommendations_user_idx on public.book_recommendations (user_id, created_at desc);

create table public.book_recommendation_votes (
  recommendation_id uuid not null references public.book_recommendations (id) on delete cascade,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  created_at        timestamptz not null default now(),
  primary key (recommendation_id, user_id)
);

create table public.book_shelves (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  book_id    uuid not null references public.books (id) on delete cascade,
  status     public.shelf_status not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
create index book_shelves_book_idx on public.book_shelves (book_id, status);

-- -----------------------------------------------------------------------------
-- Contadores y límites
-- -----------------------------------------------------------------------------
create or replace function public.book_recommendations_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.books set rec_count = rec_count + 1,
      rating_sum = rating_sum + coalesce(new.rating, 0), rating_count = rating_count + (new.rating is not null)::int,
      last_rec_at = now()
    where id = new.book_id;
  elsif tg_op = 'UPDATE' then
    update public.books set
      rating_sum = rating_sum - coalesce(old.rating, 0) + coalesce(new.rating, 0),
      rating_count = rating_count - (old.rating is not null)::int + (new.rating is not null)::int
    where id = new.book_id;
  elsif tg_op = 'DELETE' then
    update public.books set rec_count = greatest(rec_count - 1, 0),
      rating_sum = rating_sum - coalesce(old.rating, 0), rating_count = greatest(rating_count - (old.rating is not null)::int, 0)
    where id = old.book_id;
  end if;
  return coalesce(new, old);
end;
$$;
create trigger book_recommendations_count after insert or update or delete on public.book_recommendations
for each row execute function public.book_recommendations_count();

create or replace function public.book_votes_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.book_recommendations set helpful_count = helpful_count + 1 where id = new.recommendation_id;
  else
    update public.book_recommendations set helpful_count = greatest(helpful_count - 1, 0) where id = old.recommendation_id;
  end if;
  return coalesce(new, old);
end;
$$;
create trigger book_votes_count after insert or delete on public.book_recommendation_votes
for each row execute function public.book_votes_count();

create or replace function public.book_recommendations_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.body is distinct from old.body or new.level is distinct from old.level or new.rating is distinct from old.rating then
      new.edited_at := now();
    end if;
    return new;
  end if;
  if not public.is_staff() then
    perform public.rate_check(
      (select count(*) from public.book_recommendations where user_id = new.user_id and created_at > now() - interval '1 day'),
      20, 'Has recomendado muchos libros hoy. Vuelve mañana.');
  end if;
  return new;
end;
$$;
create trigger book_recommendations_guard before insert or update on public.book_recommendations
for each row execute function public.book_recommendations_guard();

-- -----------------------------------------------------------------------------
-- Crear o reutilizar la ficha y guardar la recomendación propia, de una vez
-- -----------------------------------------------------------------------------
create or replace function public.recommend_book(
  p_title text,
  p_authors text,
  p_body text,
  p_level public.book_level,
  p_year smallint default null,
  p_isbn text default null,
  p_area text default null,
  p_topics bigint[] default '{}',
  p_cover_path text default null,
  p_rating smallint default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text := trim(regexp_replace(coalesce(p_title, ''), '\s+', ' ', 'g'));
  v_authors text := trim(regexp_replace(coalesce(p_authors, ''), '\s+', ' ', 'g'));
  v_isbn text := nullif(upper(regexp_replace(coalesce(p_isbn, ''), '[^0-9Xx]', '', 'g')), '');
  v_book public.books;
begin
  if not public.can_write() then
    raise exception 'Tu cuenta no puede recomendar libros' using errcode = '42501';
  end if;
  if char_length(v_title) < 1 or char_length(v_authors) < 2 then
    raise exception 'Indica título y autoría' using errcode = '22023';
  end if;
  if p_cover_path is not null and p_cover_path not like auth.uid()::text || '/%' then
    raise exception 'Imagen no válida' using errcode = '22023';
  end if;
  -- ¿Existe ya? Por ISBN o por título y autoría normalizados.
  select * into v_book from public.books b
  where (v_isbn is not null and b.isbn = v_isbn)
     or (public.slugify(b.title) = public.slugify(v_title) and public.slugify(b.authors) = public.slugify(v_authors))
  limit 1;
  if v_book.id is null then
    if (select count(*) from public.books where created_by = auth.uid() and created_at > now() - interval '1 day') >= 10
       and not public.is_staff() then
      raise exception 'Puedes añadir hasta 10 libros nuevos al día' using errcode = 'P0429';
    end if;
    insert into public.books (slug, title, authors, year, isbn, area_slug, cover_path, created_by)
    values (
      public.unique_slug(left(v_title || ' ' || split_part(v_authors, ',', 1), 100), 'books'),
      v_title, v_authors, p_year, v_isbn, nullif(p_area, ''), p_cover_path, auth.uid()
    )
    returning * into v_book;
    insert into public.book_topics (book_id, topic_id)
    select v_book.id, x from unnest(coalesce(p_topics, '{}')) x
    where exists (select 1 from public.topics t where t.id = x and t.status = 'approved')
    limit 6
    on conflict do nothing;
  end if;
  insert into public.book_recommendations (book_id, user_id, body, level, rating)
  values (v_book.id, auth.uid(), trim(p_body), coalesce(p_level, 'intro'), p_rating)
  on conflict (book_id, user_id) do update
    set body = excluded.body, level = excluded.level, rating = excluded.rating;
  return v_book.slug;
end;
$$;

-- Corrección de la ficha: quien la creó (si nadie más la ha recomendado) o el equipo
create or replace function public.update_book(
  p_book uuid, p_title text, p_authors text, p_year smallint default null, p_isbn text default null, p_area text default null,
  p_topics bigint[] default '{}', p_cover_path text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_book public.books;
begin
  select * into v_book from public.books where id = p_book;
  if v_book.id is null then
    raise exception 'El libro no existe' using errcode = '22023';
  end if;
  if not public.is_staff() and not (
    v_book.created_by = auth.uid() and public.can_write()
    and not exists (select 1 from public.book_recommendations r where r.book_id = p_book and r.user_id <> auth.uid())
  ) then
    raise exception 'Solo quien creó la ficha (mientras nadie más lo haya recomendado) o el equipo pueden corregirla' using errcode = '42501';
  end if;
  update public.books set
    title = trim(regexp_replace(p_title, '\s+', ' ', 'g')),
    authors = trim(regexp_replace(p_authors, '\s+', ' ', 'g')),
    year = p_year,
    isbn = nullif(upper(regexp_replace(coalesce(p_isbn, ''), '[^0-9Xx]', '', 'g')), ''),
    area_slug = nullif(p_area, ''),
    cover_path = case when p_cover_path is null then cover_path when p_cover_path = '' then null else p_cover_path end
  where id = p_book;
  delete from public.book_topics where book_id = p_book;
  insert into public.book_topics (book_id, topic_id)
  select p_book, x from unnest(coalesce(p_topics, '{}')) x
  where exists (select 1 from public.topics t where t.id = x and t.status = 'approved')
  limit 6
  on conflict do nothing;
  if public.is_staff() and v_book.created_by is distinct from auth.uid() then
    perform public.log_moderation('book:edit', 'book', p_book::text, p_title);
  end if;
end;
$$;

-- Tarjeta de libro para listados
create type public.book_card as (
  id uuid,
  slug text,
  title text,
  authors text,
  year smallint,
  area_slug text,
  area_name text,
  cover_path text,
  rec_count integer,
  avg_rating numeric,
  want_count bigint,
  topics text[],
  my_shelf public.shelf_status,
  my_rec boolean,
  last_rec_at timestamptz
);

create or replace function public.book_list(
  p_query text default null,
  p_area text default null,
  p_topic bigint default null,
  p_level public.book_level default null,
  p_shelf public.shelf_status default null,
  p_recommended_by uuid default null,
  p_sort text default 'recent',      -- recent | popular | rated
  p_limit integer default 24,
  p_offset integer default 0
)
returns setof public.book_card
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.slug, b.title, b.authors, b.year, b.area_slug, a.name, b.cover_path, b.rec_count,
    case when b.rating_count > 0 then round(b.rating_sum::numeric / b.rating_count, 1) end,
    (select count(*) from public.book_shelves s where s.book_id = b.id and s.status = 'want'),
    array(select t.name from public.book_topics bt join public.topics t on t.id = bt.topic_id where bt.book_id = b.id order by t.name limit 4),
    (select s.status from public.book_shelves s where s.book_id = b.id and s.user_id = auth.uid()),
    exists (select 1 from public.book_recommendations r where r.book_id = b.id and r.user_id = auth.uid()),
    b.last_rec_at
  from public.books b
  left join public.interest_areas a on a.slug = b.area_slug
  where public.is_active_member()
    and b.rec_count > 0
    and (coalesce(p_query, '') = '' or b.search @@ websearch_to_tsquery('spanish', public.immutable_unaccent(p_query))
         or public.immutable_unaccent(lower(b.title)) like '%' || public.immutable_unaccent(lower(p_query)) || '%'
         or public.immutable_unaccent(lower(b.authors)) like '%' || public.immutable_unaccent(lower(p_query)) || '%')
    and (p_area is null or b.area_slug = p_area)
    and (p_topic is null or exists (select 1 from public.book_topics bt where bt.book_id = b.id and bt.topic_id = p_topic))
    and (p_level is null or exists (select 1 from public.book_recommendations r where r.book_id = b.id and r.level = p_level))
    and (p_shelf is null or exists (select 1 from public.book_shelves s where s.book_id = b.id and s.user_id = auth.uid() and s.status = p_shelf))
    and (p_recommended_by is null or exists (
          select 1 from public.book_recommendations r
          where r.book_id = b.id and r.user_id = p_recommended_by
            and public.profile_section_visible(p_recommended_by, 'activity')))
  order by
    case when p_sort = 'popular' then b.rec_count end desc nulls last,
    case when p_sort = 'rated' then case when b.rating_count > 0 then b.rating_sum::numeric / b.rating_count end end desc nulls last,
    b.last_rec_at desc
  limit least(greatest(p_limit, 1), 60)
  offset greatest(p_offset, 0)
$$;

-- Autocompletado al recomendar: evita crear fichas duplicadas
create or replace function public.search_books(p_query text, p_limit integer default 6)
returns table (id uuid, slug text, title text, authors text, year smallint, rec_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.slug, b.title, b.authors, b.year, b.rec_count
  from public.books b, (select public.immutable_unaccent(lower(trim(coalesce(p_query, '')))) as v) q
  where public.is_active_member() and char_length(q.v) >= 2
    and (public.immutable_unaccent(lower(b.title)) like '%' || q.v || '%'
      or public.immutable_unaccent(lower(b.authors)) like '%' || q.v || '%'
      or (char_length(q.v) >= 4 and extensions.similarity(public.immutable_unaccent(lower(b.title)), q.v) > 0.3))
  order by (public.immutable_unaccent(lower(b.title)) like q.v || '%') desc, b.rec_count desc, b.title
  limit least(greatest(p_limit, 1), 12)
$$;

create or replace function public.set_book_shelf(p_book uuid, p_status public.shelf_status default null)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  if p_status is null then
    delete from public.book_shelves where user_id = auth.uid() and book_id = p_book;
  else
    insert into public.book_shelves (user_id, book_id, status) values (auth.uid(), p_book, p_status)
    on conflict (user_id, book_id) do update set status = excluded.status, updated_at = now();
  end if;
end;
$$;

-- Cuántas personas lo quieren leer, lo están leyendo o lo han leído (sin revelar quiénes)
create or replace function public.book_shelf_counts(p_book uuid)
returns table (want bigint, reading bigint, read bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) filter (where status = 'want'), count(*) filter (where status = 'reading'), count(*) filter (where status = 'read')
  from public.book_shelves
  where book_id = p_book and public.is_active_member()
$$;

-- Moderación
create or replace function public.mod_delete_book_recommendation(p_rec uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_title text;
begin
  perform public.require_staff();
  delete from public.book_recommendations r using public.books b
  where r.id = p_rec and b.id = r.book_id
  returning r.user_id, b.title into v_user, v_title;
  if v_user is null then
    raise exception 'La recomendación no existe' using errcode = '22023';
  end if;
  perform public.log_moderation('delete:book_recommendation', 'book_recommendation', p_rec::text, p_note);
  insert into public.notifications (user_id, type, body)
  values (v_user, 'moderation', left('El equipo ha retirado tu recomendación de «' || v_title || '». ' || coalesce(p_note, ''), 300));
end;
$$;

create or replace function public.mod_delete_book(p_book uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
begin
  perform public.require_staff();
  delete from public.books where id = p_book returning title into v_title;
  if v_title is null then
    raise exception 'El libro no existe' using errcode = '22023';
  end if;
  perform public.log_moderation('delete:book', 'book', p_book::text, coalesce(v_title, '') || ' · ' || coalesce(p_note, ''));
end;
$$;

-- Vista previa de denuncias: añade libros y recomendaciones
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
  elsif r.target_type = 'book' then
    return query select b.title, left(b.authors, 600), b.created_by, a.username::text, '/libros/' || b.slug
      from public.books b left join public.profiles a on a.id = b.created_by where b.id = r.target_id;
  elsif r.target_type = 'book_recommendation' then
    return query select 'Recomendación de «' || b.title || '»', left(x.body, 600), x.user_id, a.username::text, '/libros/' || b.slug || '#r-' || x.id::text
      from public.book_recommendations x join public.books b on b.id = x.book_id
      join public.profiles a on a.id = x.user_id where x.id = r.target_id;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Privilegios y RLS
-- -----------------------------------------------------------------------------
revoke all on public.books, public.book_topics, public.book_recommendations, public.book_recommendation_votes, public.book_shelves
  from anon, authenticated;
grant select on public.books, public.book_topics to authenticated;
grant select, insert, update, delete on public.book_recommendations to authenticated;
grant select, insert, delete on public.book_recommendation_votes to authenticated;
grant select, insert, update, delete on public.book_shelves to authenticated;
-- Solo se pueden modificar estos campos de la recomendación propia
revoke update on public.book_recommendations from authenticated;
grant update (body, level, rating) on public.book_recommendations to authenticated;

alter table public.books                     enable row level security;
alter table public.book_topics               enable row level security;
alter table public.book_recommendations      enable row level security;
alter table public.book_recommendation_votes enable row level security;
alter table public.book_shelves              enable row level security;

create policy "books: miembros" on public.books for select to authenticated using (public.is_active_member());
create policy "book_topics: miembros" on public.book_topics for select to authenticated using (public.is_active_member());
create policy "book_recommendations: miembros" on public.book_recommendations for select to authenticated
using (public.is_active_member() and not public.is_blocked_with(user_id));
create policy "book_recommendations: alta propia" on public.book_recommendations for insert to authenticated
with check (user_id = auth.uid() and public.can_write());
create policy "book_recommendations: edición propia" on public.book_recommendations for update to authenticated
using (user_id = auth.uid() and public.can_write()) with check (user_id = auth.uid());
create policy "book_recommendations: baja propia" on public.book_recommendations for delete to authenticated
using (user_id = auth.uid());
create policy "book_recommendation_votes: propios" on public.book_recommendation_votes for select to authenticated
using (user_id = auth.uid());
create policy "book_recommendation_votes: alta propia" on public.book_recommendation_votes for insert to authenticated
with check (
  user_id = auth.uid() and public.is_active_member()
  and not exists (select 1 from public.book_recommendations r where r.id = recommendation_id and r.user_id = auth.uid())
);
create policy "book_recommendation_votes: baja propia" on public.book_recommendation_votes for delete to authenticated
using (user_id = auth.uid());
create policy "book_shelves: propias" on public.book_shelves for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_active_member());

revoke all on function
  public.book_recommendations_count(), public.book_votes_count(), public.book_recommendations_guard(),
  public.recommend_book(text, text, text, public.book_level, smallint, text, text, bigint[], text, smallint),
  public.update_book(uuid, text, text, smallint, text, text, bigint[], text),
  public.book_list(text, text, bigint, public.book_level, public.shelf_status, uuid, text, integer, integer),
  public.search_books(text, integer), public.set_book_shelf(uuid, public.shelf_status), public.book_shelf_counts(uuid),
  public.mod_delete_book_recommendation(uuid, text), public.mod_delete_book(uuid, text)
from public, anon;
grant execute on function
  public.recommend_book(text, text, text, public.book_level, smallint, text, text, bigint[], text, smallint),
  public.update_book(uuid, text, text, smallint, text, text, bigint[], text),
  public.book_list(text, text, bigint, public.book_level, public.shelf_status, uuid, text, integer, integer),
  public.search_books(text, integer), public.set_book_shelf(uuid, public.shelf_status), public.book_shelf_counts(uuid),
  public.mod_delete_book_recommendation(uuid, text), public.mod_delete_book(uuid, text)
to authenticated;
