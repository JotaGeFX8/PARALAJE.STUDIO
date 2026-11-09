-- =============================================================================
-- Migración 0011 · Siete foros con normas y subcategorías, tipos de publicación,
-- clasificación ampliada, encuestas, archivos adjuntos y etiquetas moderadas.
-- Los doce territorios anteriores pasan a ser subcategorías de los foros.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Foros
-- -----------------------------------------------------------------------------
create table public.forums (
  slug        text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name        text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 400),
  rules       text not null default '' check (char_length(rules) <= 4000),
  position    smallint not null default 0,
  is_archived boolean not null default false,
  created_at  timestamptz not null default now()
);

insert into public.forums (slug, name, description, rules, position) values
  ('universo', 'Universo',
   'Cosmos, astronomía, exploración espacial y los fenómenos del cielo que aún no tienen explicación.',
   E'Distingue observación, hipótesis y especulación.\nEn fenómenos aéreos, aporta fecha, lugar aproximado y datos; nunca datos personales de testigos.\nLas imágenes deben ser propias o citar su origen.', 1),
  ('ciencia', 'Ciencia',
   'Física, química, biología y salud con método: qué sabemos, cómo lo sabemos y qué falta por saber.',
   E'Cita estudios o fuentes primarias cuando afirmes datos.\nMarca las hipótesis como tales.\nNada de consejos médicos personalizados: comparte información, no diagnósticos.', 2),
  ('historia', 'Historia y culturas',
   'Civilizaciones, arqueología, tradiciones y símbolos, leídos con sus fuentes y en su contexto.',
   E'Diferencia fuentes primarias, interpretaciones y leyendas.\nRespeto a todas las culturas y creencias.\nSin negacionismo de crímenes históricos documentados.', 3),
  ('conciencia', 'Conciencia y pensamiento',
   'Mente, percepción, filosofía y ética: las grandes preguntas, con argumentos.',
   E'Las experiencias personales valen como experiencias: no las presentes como verdades universales.\nCritica ideas, no a personas.\nSin promesas terapéuticas ni consejos médicos.', 4),
  ('tecnologia', 'Tecnología y futuro',
   'Inteligencia artificial, software libre, hardware y cómo la técnica cambia la vida diaria.',
   E'Sin promoción comercial ni enlaces de afiliación.\nComparte código y recursos con su licencia.\nExplica los riesgos cuando hables de seguridad o privacidad.', 5),
  ('naturaleza', 'Naturaleza y vida práctica',
   'Campo, huerta, bioconstrucción, autosuficiencia y saberes útiles para vivir con autonomía.',
   E'Seguridad primero: en construcción, electricidad, setas o plantas medicinales, indica riesgos y fuentes.\nSin venta de animales ni de productos.\nRespeta la normativa local y la propiedad ajena.', 6),
  ('agora', 'Ágora',
   'La plaza abierta: presentaciones, ideas sueltas, preguntas rápidas y conversación libre.',
   E'Tema libre, con respeto.\nSi tu tema encaja en otro foro, mejor publícalo allí.\nNada de spam ni de cadenas.', 7);

-- -----------------------------------------------------------------------------
-- Subcategorías: los territorios pertenecen ahora a un foro
-- -----------------------------------------------------------------------------
alter table public.categories add column forum_slug text references public.forums (slug) on delete restrict;
update public.categories set forum_slug = case slug
  when 'universo' then 'universo'
  when 'misterios' then 'universo'
  when 'ciencia' then 'ciencia'
  when 'historia' then 'historia'
  when 'simbolismo' then 'historia'
  when 'conciencia' then 'conciencia'
  when 'tecnologia' then 'tecnologia'
  when 'autosuficiencia' then 'naturaleza'
  when 'bioconstruccion' then 'naturaleza'
  when 'vida-rural' then 'naturaleza'
  when 'supervivencia' then 'naturaleza'
  else 'agora'
end;
update public.categories c set name = d.name, description = d.description, position = d.position
from (values
  ('universo', 'Astronomía y cosmología', 'Observación, astrofísica, cosmología y el lugar que ocupamos en el cielo.', 1),
  ('misterios', 'Fenómenos inexplicados', 'Casos abiertos, UAP y fenómenos sin explicación consensuada.', 3),
  ('ciencia', 'Física y química', 'De las partículas a las moléculas: teoría, experimentos y límites del conocimiento.', 1),
  ('historia', 'Historia y civilizaciones', 'Grandes civilizaciones, épocas y lectura crítica de las fuentes.', 1),
  ('simbolismo', 'Sociedades y simbolismo', 'Tradiciones discretas, iconografía y su contexto histórico.', 4),
  ('conciencia', 'Mente y conciencia', 'Percepción, conciencia, sueños y estados de la mente.', 1),
  ('tecnologia', 'Tecnología e inteligencia artificial', 'IA, software libre, hardware y su impacto social.', 1),
  ('vida-rural', 'Naturaleza y vida rural', 'Campo, huerta, ganadería y vida en el territorio.', 1),
  ('autosuficiencia', 'Autosuficiencia', 'Energía, agua, alimentos y autonomía doméstica.', 2),
  ('bioconstruccion', 'Bioconstrucción', 'Tierra, madera, paja, diseño bioclimático y permacultura.', 3),
  ('supervivencia', 'Saberes prácticos y supervivencia', 'Oficios, primeros auxilios, orientación y saberes útiles.', 4),
  ('debate', 'Debate libre', 'Cualquier tema, con argumentos y respeto.', 1)
) as d(slug, name, description, position)
where c.slug = d.slug;
insert into public.categories (slug, name, description, position, forum_slug) values
  ('exploracion-espacial', 'Exploración espacial', 'Misiones, cohetes, satélites y el futuro fuera de la Tierra.', 2, 'universo'),
  ('biologia', 'Biología y origen de la vida', 'Evolución, genética, ecosistemas y las preguntas sobre el origen de la vida.', 2, 'ciencia'),
  ('salud', 'Cuerpo y salud', 'Fisiología, nutrición y salud con base científica. Sin consejos médicos personalizados.', 3, 'ciencia'),
  ('arqueologia', 'Arqueología', 'Yacimientos, métodos de datación y hallazgos, siempre con sus fuentes.', 2, 'historia'),
  ('tradiciones', 'Tradiciones y espiritualidad', 'Mitos, ritos y tradiciones ancestrales en su contexto cultural.', 3, 'historia'),
  ('filosofia', 'Filosofía y ética', 'Corrientes, autores y dilemas morales.', 2, 'conciencia'),
  ('futuro', 'Futuro y sociedad', 'Cómo la técnica cambia el trabajo, la política y la vida diaria.', 2, 'tecnologia'),
  ('presentaciones', 'Presentaciones', 'Preséntate y cuenta qué te trae por aquí.', 2, 'agora'),
  ('sugerencias', 'Sugerencias para la comunidad', 'Ideas para mejorar la plataforma y la convivencia.', 3, 'agora')
on conflict (slug) do nothing;
alter table public.categories alter column forum_slug set not null;
create index categories_forum_idx on public.categories (forum_slug, position);

-- -----------------------------------------------------------------------------
-- Publicaciones: foro, tipo y clasificación
-- -----------------------------------------------------------------------------
alter table public.posts
  add column forum_slug text references public.forums (slug) on delete restrict,
  add column post_type public.post_type not null default 'debate';

update public.posts p set forum_slug = c.forum_slug from public.categories c where c.slug = p.category_slug;
update public.posts set forum_slug = 'agora' where forum_slug is null and circle_id is null;
update public.posts set post_type = case
  when is_question then 'question'::public.post_type
  when kind = 'experience' then 'experience'::public.post_type
  else 'debate'::public.post_type
end;
update public.posts set kind = 'opinion' where kind = 'experience';
update public.posts set kind = 'open_question' where is_question and kind = 'opinion';

alter table public.posts drop constraint posts_forum_needs_title;
alter table public.posts
  add constraint posts_title_outside_agora check (forum_slug is null or forum_slug = 'agora' or title is not null),
  add constraint posts_forum_or_circle check ((circle_id is null) <> (forum_slug is null));
create index posts_forum_idx on public.posts (forum_slug, created_at desc) where deleted_at is null;
create index posts_unanswered_idx on public.posts (created_at desc) where deleted_at is null and comment_count = 0;

-- Coherencia: la subcategoría pertenece al foro; «pregunta» se deriva del tipo.
create or replace function public.posts_classify()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_forum text;
begin
  if new.category_slug is not null then
    select c.forum_slug into v_forum from public.categories c where c.slug = new.category_slug;
    if v_forum is null then
      raise exception 'Subcategoría no válida' using errcode = '22023';
    end if;
    if new.forum_slug is null and new.circle_id is null then
      new.forum_slug := v_forum;
    elsif new.forum_slug is distinct from v_forum then
      raise exception 'La subcategoría no pertenece a ese foro' using errcode = '22023';
    end if;
  end if;
  if new.kind = 'experience' then
    new.kind := 'opinion'; -- valor heredado: la experiencia es ahora un tipo de publicación
  end if;
  new.is_question := new.post_type = 'question';
  return new;
end;
$$;

create trigger posts_classify
before insert or update on public.posts
for each row execute function public.posts_classify();

grant update (post_type) on public.posts to authenticated;

drop policy "posts: alta" on public.posts;
create policy "posts: alta" on public.posts for insert to authenticated
with check (
  author_id = auth.uid()
  and public.can_write()
  and (circle_id is null or (category_slug is null and forum_slug is null and public.is_circle_member(circle_id)))
  and (forum_slug is null or exists (select 1 from public.forums f where f.slug = forum_slug and not f.is_archived))
  and (category_slug is null or exists (select 1 from public.categories c where c.slug = category_slug and not c.is_archived))
);

-- -----------------------------------------------------------------------------
-- Encuestas
-- -----------------------------------------------------------------------------
create table public.polls (
  post_id    uuid primary key references public.posts (id) on delete cascade,
  multiple   boolean not null default false,
  closes_at  timestamptz,
  created_at timestamptz not null default now()
);

create table public.poll_options (
  id       bigint generated always as identity primary key,
  post_id  uuid not null references public.polls (post_id) on delete cascade,
  position smallint not null check (position between 1 and 10),
  label    text not null check (char_length(label) between 1 and 120),
  unique (post_id, position)
);

create table public.poll_votes (
  post_id    uuid not null references public.polls (post_id) on delete cascade,
  option_id  bigint not null references public.poll_options (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, option_id, user_id)
);
create index poll_votes_user_idx on public.poll_votes (user_id);
create index poll_votes_option_idx on public.poll_votes (option_id);

-- Crea la encuesta de una publicación propia (una sola vez).
create or replace function public.set_post_poll(p_post uuid, p_options text[], p_multiple boolean, p_closes timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_labels text[];
begin
  if not exists (select 1 from public.posts where id = p_post and author_id = auth.uid() and post_type = 'poll') then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if exists (select 1 from public.polls where post_id = p_post) then
    raise exception 'La encuesta ya existe' using errcode = '23505';
  end if;
  select array_agg(l order by ord) into v_labels
  from (
    select left(trim(o), 120) as l, min(ord) as ord
    from unnest(coalesce(p_options, '{}')) with ordinality as x(o, ord)
    where trim(o) <> ''
    group by left(trim(o), 120)
  ) d;
  if coalesce(cardinality(v_labels), 0) < 2 or cardinality(v_labels) > 10 then
    raise exception 'Una encuesta lleva de 2 a 10 opciones distintas' using errcode = '23514';
  end if;
  if p_closes is not null and (p_closes <= now() or p_closes > now() + interval '90 days') then
    raise exception 'El cierre debe estar entre ahora y 90 días' using errcode = '22023';
  end if;
  insert into public.polls (post_id, multiple, closes_at) values (p_post, coalesce(p_multiple, false), p_closes);
  insert into public.poll_options (post_id, position, label)
  select p_post, ord::smallint, l from unnest(v_labels) with ordinality as x(l, ord);
end;
$$;

-- Voto (o cambio de voto). Un array vacío retira el voto.
create or replace function public.vote_poll(p_post uuid, p_options bigint[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_poll public.polls;
  v_ids bigint[];
begin
  if not public.is_active_member() then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  select * into v_poll from public.polls where post_id = p_post;
  if v_poll.post_id is null or not public.user_can_read_post(auth.uid(), p_post) then
    raise exception 'Encuesta no disponible' using errcode = '22023';
  end if;
  if v_poll.closes_at is not null and v_poll.closes_at <= now() then
    raise exception 'La encuesta está cerrada' using errcode = '22023';
  end if;
  if exists (select 1 from public.posts where id = p_post and is_locked) then
    raise exception 'La conversación está cerrada' using errcode = '22023';
  end if;
  select coalesce(array_agg(distinct x), '{}') into v_ids from unnest(coalesce(p_options, '{}')) x;
  if cardinality(v_ids) > 1 and not v_poll.multiple then
    raise exception 'Elige una sola opción' using errcode = '22023';
  end if;
  if (select count(*) from public.poll_options o where o.post_id = p_post and o.id = any (v_ids)) <> cardinality(v_ids) then
    raise exception 'Opción no válida' using errcode = '22023';
  end if;
  delete from public.poll_votes where post_id = p_post and user_id = auth.uid();
  insert into public.poll_votes (post_id, option_id, user_id)
  select p_post, x, auth.uid() from unnest(v_ids) x;
end;
$$;

-- Resultados agregados: nadie ve quién votó qué.
create or replace function public.poll_results(p_post uuid)
returns table (option_id bigint, label text, pos smallint, votes bigint, mine boolean, voters bigint,
               multiple boolean, closes_at timestamptz, closed boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, o.label, o.position,
    (select count(*) from public.poll_votes v where v.option_id = o.id),
    exists (select 1 from public.poll_votes v where v.option_id = o.id and v.user_id = auth.uid()),
    (select count(distinct v.user_id) from public.poll_votes v where v.post_id = p_post),
    pl.multiple, pl.closes_at,
    (pl.closes_at is not null and pl.closes_at <= now())
  from public.poll_options o
  join public.polls pl on pl.post_id = o.post_id
  where o.post_id = p_post and public.is_active_member() and public.user_can_read_post(auth.uid(), p_post)
  order by o.position
$$;

create or replace function public.close_poll(p_post uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.polls pl set closes_at = now()
  where pl.post_id = p_post
    and (pl.closes_at is null or pl.closes_at > now())
    and (exists (select 1 from public.posts p where p.id = p_post and p.author_id = auth.uid()) or public.is_staff());
  if not found then
    raise exception 'Sin permiso o ya cerrada' using errcode = '42501';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Archivos adjuntos (bucket privado; descarga con URL firmada)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-files', 'post-files', false, 10485760, array[
  'application/pdf', 'text/plain', 'text/markdown', 'text/csv', 'application/epub+zip',
  'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table public.post_attachments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  path       text not null unique check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.[a-z0-9]{2,5}$'),
  name       text not null check (char_length(name) between 1 and 160),
  mime       text not null check (char_length(mime) <= 120),
  size       integer not null check (size between 1 and 10485760),
  created_at timestamptz not null default now()
);
create index post_attachments_post_idx on public.post_attachments (post_id);

create or replace function public.post_attachments_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if split_part(new.path, '/', 1) <> new.author_id::text then
    raise exception 'Ruta de archivo no válida' using errcode = '22023';
  end if;
  if (select count(*) from public.post_attachments where post_id = new.post_id) >= 3 then
    raise exception 'Máximo 3 archivos por publicación' using errcode = '23514';
  end if;
  if not public.is_staff() and (
    select count(*) from public.post_attachments where author_id = new.author_id and created_at > now() - interval '1 day'
  ) >= 20 then
    raise exception 'Has llegado al límite de 20 archivos al día' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
create trigger post_attachments_guard before insert on public.post_attachments
for each row execute function public.post_attachments_guard();

create policy "post-files: subir a carpeta propia"
on storage.objects for insert to authenticated
with check (bucket_id = 'post-files' and (storage.foldername(name))[1] = (select auth.uid())::text and public.can_write());

-- Se pueden descargar los archivos propios y los adjuntos de publicaciones que se pueden leer.
create policy "post-files: lectura"
on storage.objects for select to authenticated
using (
  bucket_id = 'post-files'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.post_attachments a
      join public.posts p on p.id = a.post_id
      where a.path = objects.name
    )
  )
);

create policy "post-files: borrar en carpeta propia"
on storage.objects for delete to authenticated
using (bucket_id = 'post-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- -----------------------------------------------------------------------------
-- Etiquetas moderadas: bloqueo, fusión y vínculo con el catálogo
-- -----------------------------------------------------------------------------
alter table public.tags
  add column status text not null default 'active' check (status in ('active', 'blocked')),
  add column merged_into text references public.tags (slug) on delete set null,
  add column topic_id bigint references public.topics (id) on delete set null;
update public.tags t set topic_id = tp.id from public.topics tp where tp.slug = t.slug and tp.status = 'approved';

create or replace function public.set_post_tags(p_post uuid, p_tags text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  t text;
  s text;
  v_tag public.tags;
  slugs text[] := '{}';
begin
  if not exists (select 1 from public.posts where id = p_post and author_id = auth.uid()) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  foreach t in array coalesce(p_tags, '{}') loop
    s := left(public.slugify(t), 32);
    if char_length(s) >= 2 then
      select * into v_tag from public.tags where slug = s;
      if v_tag.slug is not null and v_tag.merged_into is not null then
        s := v_tag.merged_into;
        select * into v_tag from public.tags where slug = s;
      end if;
      if v_tag.status = 'blocked' then
        raise exception 'La etiqueta «%» no está permitida', trim(t) using errcode = '23514';
      end if;
      if not (s = any (slugs)) then
        slugs := slugs || s;
        if v_tag.slug is null then
          insert into public.tags (slug, name, created_by, topic_id)
          values (s, left(trim(t), 32), auth.uid(), (select tp.id from public.topics tp where tp.slug = s and tp.status = 'approved'))
          on conflict (slug) do nothing;
        end if;
      end if;
    end if;
    v_tag := null;
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

-- Sugerencias para el editor: etiquetas en uso y temas del catálogo
create or replace function public.suggest_tags(p_query text, p_limit integer default 8)
returns table (slug text, name text, uses bigint, source text)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (select public.slugify(coalesce(p_query, '')) as v),
  used as (
    select t.slug, t.name, (select count(*) from public.post_tags pt where pt.tag_slug = t.slug) as uses, 'tag'::text as source
    from public.tags t, q
    where t.status = 'active' and t.merged_into is null and char_length(q.v) >= 1 and t.slug like q.v || '%'
  ),
  cat as (
    select left(tp.slug, 32), left(tp.name, 32), 0::bigint, 'topic'::text
    from public.topics tp, q
    where tp.status = 'approved' and tp.merged_into is null and char_length(q.v) >= 2
      and (tp.slug like q.v || '%' or tp.slug like '%-' || q.v || '%')
      and not exists (select 1 from public.tags t where t.slug = left(tp.slug, 32))
  )
  select * from (select * from used union all select * from cat) x
  where public.is_active_member()
  order by (x.source = 'tag') desc, x.uses desc, char_length(x.slug), x.slug
  limit least(greatest(p_limit, 1), 20)
$$;

create or replace function public.admin_tag_list(p_query text default null, p_limit integer default 100)
returns table (slug text, name text, status text, merged_into text, topic_id bigint, topic_name text, uses bigint, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select t.slug, t.name, t.status, t.merged_into, t.topic_id, tp.name,
    (select count(*) from public.post_tags pt where pt.tag_slug = t.slug), t.created_at
  from public.tags t
  left join public.topics tp on tp.id = t.topic_id
  where public.is_staff()
    and (coalesce(p_query, '') = '' or t.slug like '%' || public.slugify(p_query) || '%')
  order by 7 desc, t.slug
  limit least(greatest(p_limit, 1), 300)
$$;

create or replace function public.admin_update_tag(p_slug text, p_name text, p_status text, p_topic bigint default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  if p_status not in ('active', 'blocked') then
    raise exception 'Estado no válido' using errcode = '22023';
  end if;
  update public.tags set name = left(trim(p_name), 32), status = p_status, topic_id = p_topic where slug = p_slug;
  if not found then
    raise exception 'La etiqueta no existe' using errcode = '22023';
  end if;
  if p_status = 'blocked' then
    delete from public.post_tags where tag_slug = p_slug;
  end if;
  perform public.log_moderation('tag:' || p_status, 'tag', p_slug, p_name);
end;
$$;

create or replace function public.admin_merge_tags(p_from text, p_into text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  if p_from = p_into or not exists (select 1 from public.tags where slug = p_into and status = 'active' and merged_into is null) then
    raise exception 'Elige una etiqueta de destino activa y distinta' using errcode = '22023';
  end if;
  insert into public.post_tags (post_id, tag_slug)
  select post_id, p_into from public.post_tags where tag_slug = p_from
  on conflict do nothing;
  delete from public.post_tags where tag_slug = p_from;
  update public.tags set merged_into = p_into where slug = p_from;
  update public.tags set merged_into = p_into where merged_into = p_from;
  perform public.log_moderation('tag:merge', 'tag', p_from, 'en ' || p_into);
end;
$$;

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
  join public.tags t on t.slug = pt.tag_slug and t.status = 'active'
  group by t.slug, t.name
  order by count(*) desc, t.slug
  limit least(greatest(p_limit, 1), 30)
$$;

-- -----------------------------------------------------------------------------
-- Crear y editar publicaciones (foro, subcategoría, tipo y encuesta)
-- -----------------------------------------------------------------------------
drop function public.create_post(text, text, public.post_kind, text, boolean, text[], text[], text[], uuid);
create or replace function public.create_post(
  p_title text,
  p_body text,
  p_kind public.post_kind,
  p_forum text default null,
  p_category text default null,
  p_type public.post_type default 'debate',
  p_sources text[] default '{}',
  p_tags text[] default '{}',
  p_image_paths text[] default '{}',
  p_circle uuid default null,
  p_poll_options text[] default null,
  p_poll_multiple boolean default false,
  p_poll_closes timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_type public.post_type := coalesce(p_type, 'debate');
begin
  if v_type = 'poll' and coalesce(cardinality(p_poll_options), 0) < 2 then
    raise exception 'Una encuesta necesita al menos dos opciones' using errcode = '23514';
  end if;
  insert into public.posts (author_id, title, body, kind, forum_slug, category_slug, circle_id, post_type, sources, image_paths)
  values (
    auth.uid(), nullif(trim(p_title), ''), trim(p_body), p_kind,
    case when p_circle is null then
      coalesce(nullif(p_forum, ''), (select c.forum_slug from public.categories c where c.slug = nullif(p_category, '')), 'agora')
    end,
    case when p_circle is null then nullif(p_category, '') end,
    p_circle, v_type, coalesce(p_sources, '{}'), coalesce(p_image_paths, '{}')
  )
  returning id into v_id;
  perform public.set_post_tags(v_id, p_tags);
  if v_type = 'poll' then
    perform public.set_post_poll(v_id, p_poll_options, p_poll_multiple, p_poll_closes);
  end if;
  return v_id;
end;
$$;

drop function public.update_post(uuid, text, text, public.post_kind, boolean, text[], text[], text[]);
create or replace function public.update_post(
  p_id uuid,
  p_title text,
  p_body text,
  p_kind public.post_kind,
  p_type public.post_type,
  p_category text,
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
  update public.posts p
  set title = nullif(trim(p_title), ''), body = trim(p_body), kind = p_kind,
      -- Una encuesta sigue siéndolo; no se convierte en encuesta al editar.
      post_type = case
        when exists (select 1 from public.polls pl where pl.post_id = p.id) then 'poll'::public.post_type
        when p_type = 'poll' then p.post_type
        else coalesce(p_type, p.post_type)
      end,
      category_slug = case when p.circle_id is null then nullif(p_category, '') else null end,
      sources = coalesce(p_sources, '{}'),
      image_paths = coalesce(p_image_paths, '{}')
  where p.id = p_id and p.author_id = auth.uid();
  if not found then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  perform public.set_post_tags(p_id, p_tags);
end;
$$;

-- -----------------------------------------------------------------------------
-- Listados: foro, tipo, encuesta, adjuntos y filtro «Sin responder»
-- -----------------------------------------------------------------------------
alter type public.post_list_item
  add attribute forum_slug text,
  add attribute forum_name text,
  add attribute post_type public.post_type,
  add attribute has_poll boolean,
  add attribute attachment_count integer;

drop function public.feed_posts(text, text, uuid, text, public.post_kind, uuid, text, boolean, integer, integer, boolean);
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
  where p.deleted_at is null
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

-- Actividad por foro y subcategoría
create or replace function public.forum_stats()
returns table (forum_slug text, category_slug text, post_count bigint, unanswered bigint, last_activity_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.forum_slug, p.category_slug, count(*), count(*) filter (where p.comment_count = 0), max(p.last_activity_at)
  from public.posts p
  where p.deleted_at is null and p.circle_id is null
  group by p.forum_slug, p.category_slug
$$;

-- -----------------------------------------------------------------------------
-- Gestión de foros y subcategorías (administración)
-- -----------------------------------------------------------------------------
create or replace function public.admin_save_forum(
  p_slug text, p_name text, p_description text, p_rules text, p_position smallint, p_archived boolean
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
  if v_slug = 'agora' and coalesce(p_archived, false) then
    raise exception 'El Ágora no se puede archivar' using errcode = '22023';
  end if;
  insert into public.forums (slug, name, description, rules, position, is_archived)
  values (v_slug, trim(p_name), trim(coalesce(p_description, '')), trim(coalesce(p_rules, '')), coalesce(p_position, 99), coalesce(p_archived, false))
  on conflict (slug) do update
    set name = excluded.name, description = excluded.description, rules = excluded.rules,
        position = excluded.position, is_archived = excluded.is_archived;
  perform public.log_moderation('forum', 'forum', v_slug, p_name);
end;
$$;

drop function public.admin_save_category(text, text, text, smallint, boolean);
create or replace function public.admin_save_category(
  p_slug text, p_name text, p_description text, p_position smallint, p_archived boolean, p_forum text
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
  if exists (select 1 from public.forums where slug = v_slug) then
    raise exception 'Ese identificador ya lo usa un foro' using errcode = '23505';
  end if;
  if not exists (select 1 from public.forums where slug = p_forum) then
    raise exception 'Foro no válido' using errcode = '22023';
  end if;
  insert into public.categories (slug, name, description, position, is_archived, forum_slug)
  values (v_slug, trim(p_name), trim(coalesce(p_description, '')), coalesce(p_position, 99), coalesce(p_archived, false), p_forum)
  on conflict (slug) do update
    set name = excluded.name, description = excluded.description,
        position = excluded.position, is_archived = excluded.is_archived, forum_slug = excluded.forum_slug;
  -- Mover una subcategoría de foro mueve también sus publicaciones.
  update public.posts set forum_slug = p_forum
  where category_slug = v_slug and forum_slug is distinct from p_forum and circle_id is null;
  perform public.log_moderation('category', 'category', v_slug, p_name);
end;
$$;

-- -----------------------------------------------------------------------------
-- Privilegios y RLS
-- -----------------------------------------------------------------------------
revoke all on public.forums, public.polls, public.poll_options, public.poll_votes, public.post_attachments from anon, authenticated;
grant select on public.forums to anon, authenticated;
grant select on public.polls, public.poll_options, public.poll_votes to authenticated;
grant select, insert, delete on public.post_attachments to authenticated;

alter table public.forums           enable row level security;
alter table public.polls            enable row level security;
alter table public.poll_options     enable row level security;
alter table public.poll_votes       enable row level security;
alter table public.post_attachments enable row level security;

create policy "forums: lectura" on public.forums for select to anon, authenticated using (true);
create policy "polls: si se lee la publicación" on public.polls for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id));
create policy "poll_options: si se lee la publicación" on public.poll_options for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id));
create policy "poll_votes: solo los propios" on public.poll_votes for select to authenticated
using (user_id = auth.uid());
create policy "post_attachments: si se lee la publicación" on public.post_attachments for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id));
create policy "post_attachments: alta en publicación propia" on public.post_attachments for insert to authenticated
with check (
  author_id = auth.uid() and public.can_write()
  and exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid() and p.deleted_at is null)
);
create policy "post_attachments: baja propia" on public.post_attachments for delete to authenticated
using (author_id = auth.uid());

revoke all on function
  public.posts_classify(), public.post_attachments_guard(),
  public.set_post_poll(uuid, text[], boolean, timestamptz), public.vote_poll(uuid, bigint[]), public.poll_results(uuid),
  public.close_poll(uuid), public.set_post_tags(uuid, text[]), public.suggest_tags(text, integer),
  public.admin_tag_list(text, integer), public.admin_update_tag(text, text, text, bigint), public.admin_merge_tags(text, text),
  public.trending_tags(integer),
  public.create_post(text, text, public.post_kind, text, text, public.post_type, text[], text[], text[], uuid, text[], boolean, timestamptz),
  public.update_post(uuid, text, text, public.post_kind, public.post_type, text, text[], text[], text[]),
  public.feed_posts(text, text, text, uuid, text, public.post_kind, public.post_type, uuid, text, boolean, boolean, integer, integer),
  public.search_posts(text, integer, integer), public.forum_stats(),
  public.admin_save_forum(text, text, text, text, smallint, boolean),
  public.admin_save_category(text, text, text, smallint, boolean, text)
from public, anon;
grant execute on function
  public.set_post_poll(uuid, text[], boolean, timestamptz), public.vote_poll(uuid, bigint[]), public.poll_results(uuid),
  public.close_poll(uuid), public.set_post_tags(uuid, text[]), public.suggest_tags(text, integer),
  public.admin_tag_list(text, integer), public.admin_update_tag(text, text, text, bigint), public.admin_merge_tags(text, text),
  public.trending_tags(integer),
  public.create_post(text, text, public.post_kind, text, text, public.post_type, text[], text[], text[], uuid, text[], boolean, timestamptz),
  public.update_post(uuid, text, text, public.post_kind, public.post_type, text, text[], text[], text[]),
  public.feed_posts(text, text, text, uuid, text, public.post_kind, public.post_type, uuid, text, boolean, boolean, integer, integer),
  public.search_posts(text, integer, integer), public.forum_stats(),
  public.admin_save_forum(text, text, text, text, smallint, boolean),
  public.admin_save_category(text, text, text, smallint, boolean, text)
to authenticated;
