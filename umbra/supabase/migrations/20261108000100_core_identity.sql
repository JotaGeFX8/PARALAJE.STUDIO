-- =============================================================================
-- UMBRA · Migración 0001 · Identidad, perfiles, intereses y categorías
-- =============================================================================
-- Ejecutar en Supabase → SQL Editor (o con `supabase db push`).
-- Todas las tablas tienen Row Level Security activado. Nada es legible sin
-- sesión: el contenido de la comunidad es exclusivo para miembros.
-- =============================================================================

create extension if not exists citext with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'moderator', 'member', 'restricted');
create type public.account_status as enum ('active', 'suspended', 'banned');
create type public.chat_availability as enum ('open', 'sometimes', 'closed');

-- -----------------------------------------------------------------------------
-- Intereses (catálogo cerrado, gestionado por administración)
-- -----------------------------------------------------------------------------
create table public.interests (
  slug        text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name        text not null check (char_length(name) between 2 and 60),
  position    smallint not null default 0,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Categorías del foro (Comunidad)
-- -----------------------------------------------------------------------------
create table public.categories (
  slug         text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name         text not null check (char_length(name) between 2 and 80),
  description  text not null default '' check (char_length(description) <= 400),
  position     smallint not null default 0,
  is_archived  boolean not null default false,
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  username           extensions.citext unique
                       check (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  display_name       text check (char_length(display_name) between 1 and 60),
  bio                text not null default '' check (char_length(bio) <= 600),
  avatar_url         text check (avatar_url is null or avatar_url ~ '^https?://'),
  -- Ubicación aproximada y opcional. Nunca coordenadas.
  country            text check (country is null or char_length(country) between 2 and 60),
  region             text check (region is null or char_length(region) between 2 and 80),
  languages          text[] not null default '{}' check (cardinality(languages) <= 10),
  looking_for        text not null default '' check (char_length(looking_for) <= 400),
  personal_projects  text not null default '' check (char_length(personal_projects) <= 600),
  availability       public.chat_availability not null default 'sometimes',
  role               public.user_role not null default 'member',
  status             public.account_status not null default 'active',
  onboarded_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index profiles_onboarded_idx on public.profiles (onboarded_at desc) where onboarded_at is not null;
create index profiles_country_idx on public.profiles (country) where country is not null;

create table public.profile_interests (
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  interest_slug text not null references public.interests (slug) on delete cascade,
  is_favorite   boolean not null default false,
  created_at    timestamptz not null default now(),
  primary key (profile_id, interest_slug)
);
create index profile_interests_interest_idx on public.profile_interests (interest_slug);

-- -----------------------------------------------------------------------------
-- Funciones auxiliares
-- -----------------------------------------------------------------------------

-- Rol del usuario actual. SECURITY DEFINER para evitar recursión en RLS.
create or replace function public.current_role_name()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'moderator')
      and p.status = 'active'
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
  )
$$;

-- Miembro activo: con sesión, cuenta activa.
create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
  )
$$;

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();

-- Crea el perfil vacío al registrarse un usuario en Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Defensa en profundidad: aunque los privilegios de columna ya lo impiden,
-- solo administración puede cambiar rol o estado de una cuenta.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Solo administración puede modificar rol o estado'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileged
before update on public.profiles
for each row execute function public.guard_profile_privileged_columns();

-- -----------------------------------------------------------------------------
-- Privilegios de columna: un usuario solo puede editar sus campos públicos.
-- -----------------------------------------------------------------------------
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (
  username, display_name, bio, avatar_url, country, region, languages,
  looking_for, personal_projects, availability, onboarded_at
) on public.profiles to authenticated;

revoke all on public.profile_interests from anon, authenticated;
grant select, insert, update, delete on public.profile_interests to authenticated;

revoke all on public.interests from anon, authenticated;
grant select on public.interests to authenticated;

-- Las categorías pueden mostrarse en la portada pública (solo nombres).
revoke all on public.categories from anon, authenticated;
grant select on public.categories to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.profile_interests enable row level security;
alter table public.interests         enable row level security;
alter table public.categories        enable row level security;

-- Perfiles: visibles para miembros activos. Las cuentas suspendidas o
-- expulsadas solo son visibles para sí mismas y para el equipo.
create policy "profiles: miembros ven perfiles activos"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.is_staff()
  or (status = 'active' and public.is_active_member())
);

-- Las cuentas suspendidas no pueden modificar su perfil.
create policy "profiles: cada cual edita el suyo"
on public.profiles for update to authenticated
using (id = auth.uid() and public.is_active_member())
with check (id = auth.uid());

create policy "profiles: administración edita cualquiera"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Intereses de perfil
create policy "profile_interests: lectura para miembros"
on public.profile_interests for select to authenticated
using (profile_id = auth.uid() or public.is_active_member());

create policy "profile_interests: alta propia"
on public.profile_interests for insert to authenticated
with check (profile_id = auth.uid() and public.is_active_member());

create policy "profile_interests: edición propia"
on public.profile_interests for update to authenticated
using (profile_id = auth.uid() and public.is_active_member())
with check (profile_id = auth.uid());

create policy "profile_interests: baja propia"
on public.profile_interests for delete to authenticated
using (profile_id = auth.uid() and public.is_active_member());

-- Catálogos
create policy "interests: lectura"
on public.interests for select to authenticated
using (true);

create policy "categories: lectura pública de no archivadas"
on public.categories for select to anon
using (not is_archived);

create policy "categories: lectura para miembros y equipo"
on public.categories for select to authenticated
using (not is_archived or public.is_staff());

-- Límite razonable de intereses por persona (anti-abuso).
create or replace function public.limit_profile_interests()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.profile_interests
      where profile_id = new.profile_id and interest_slug <> new.interest_slug) >= 24 then
    raise exception 'Máximo 24 intereses por perfil' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger profile_interests_limit
before insert on public.profile_interests
for each row execute function public.limit_profile_interests();

-- Guarda de una vez (atómicamente) los intereses del usuario actual.
-- SECURITY INVOKER: se aplican las políticas RLS de quien llama.
create or replace function public.set_my_interests(p_interests text[], p_favorites text[] default '{}')
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  p_interests := coalesce(p_interests, '{}');
  p_favorites := coalesce(p_favorites, '{}');
  if cardinality(p_interests) > 24 then
    raise exception 'Máximo 24 intereses' using errcode = '23514';
  end if;
  if cardinality(p_favorites) > 3 then
    raise exception 'Máximo 3 favoritos' using errcode = '23514';
  end if;

  delete from public.profile_interests
  where profile_id = uid and not (interest_slug = any (p_interests));

  insert into public.profile_interests (profile_id, interest_slug, is_favorite)
  select uid, s, s = any (p_favorites)
  from unnest(p_interests) as s
  on conflict (profile_id, interest_slug) do update set is_favorite = excluded.is_favorite;
end;
$$;

revoke all on function public.set_my_interests(text[], text[]) from public, anon;
grant execute on function public.set_my_interests(text[], text[]) to authenticated;

-- Las funciones auxiliares no deben ser invocables sin sesión.
revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_active_member() from public, anon;
revoke all on function public.current_role_name() from public, anon;
grant execute on function public.is_staff(), public.is_admin(), public.is_active_member(),
  public.current_role_name() to authenticated;

-- -----------------------------------------------------------------------------
-- Datos de catálogo
-- -----------------------------------------------------------------------------
insert into public.interests (slug, name, position) values
  ('fisica-cuantica',       'Ciencia y física cuántica',            1),
  ('astronomia',            'Astronomía y universo',                2),
  ('conciencia',            'Conciencia y filosofía',               3),
  ('civilizaciones',        'Civilizaciones antiguas',              4),
  ('historia',              'Historia y arqueología',               5),
  ('sociedades-discretas',  'Masonería y sociedades discretas',     6),
  ('misterios',             'Misterios y fenómenos inexplicados',   7),
  ('uap',                   'UAP',                                  8),
  ('ia-tecnologia',         'Inteligencia artificial y tecnología', 9),
  ('autosuficiencia',       'Autosuficiencia y supervivencia',     10),
  ('bioconstruccion',       'Bioconstrucción y permacultura',      11),
  ('agricultura',           'Agricultura y ganadería',             12),
  ('energias-alternativas', 'Energías alternativas',               13),
  ('vida-rural',            'Naturaleza y vida rural',             14),
  ('psicologia',            'Psicología y desarrollo personal',    15),
  ('debate',                'Debates libres',                      16),
  ('proyectos',             'Proyectos colaborativos',             17),
  ('amistad',               'Relaciones humanas y nuevas amistades', 18);

insert into public.categories (slug, name, description, position) values
  ('universo',        'Universo y astronomía',             'Cosmología, observación, astrofísica y el lugar que ocupamos en el cielo.', 1),
  ('ciencia',         'Ciencia y física cuántica',         'Física, química, biología y los límites del conocimiento científico.', 2),
  ('conciencia',      'Conciencia y filosofía',            'Mente, percepción, ética y las grandes preguntas.', 3),
  ('historia',        'Historia y civilizaciones',         'Arqueología, culturas antiguas y lectura crítica de las fuentes.', 4),
  ('misterios',       'Misterios y fenómenos inexplicados','Casos abiertos, UAP y fenómenos sin explicación consensuada.', 5),
  ('simbolismo',      'Sociedades y simbolismo',           'Masonería, tradiciones discretas, iconografía y su contexto histórico.', 6),
  ('tecnologia',      'Tecnología e inteligencia artificial','IA, software libre, hardware y el impacto social de la técnica.', 7),
  ('autosuficiencia', 'Autosuficiencia',                   'Energía, agua, alimentos y autonomía doméstica.', 8),
  ('bioconstruccion', 'Bioconstrucción',                   'Tierra, madera, paja, diseño bioclimático y permacultura.', 9),
  ('vida-rural',      'Naturaleza y vida rural',           'Campo, huerta, ganadería y vida en el territorio.', 10),
  ('supervivencia',   'Supervivencia y conocimientos prácticos','Oficios, primeros auxilios, orientación y saberes útiles.', 11),
  ('debate',          'Debate libre',                      'Cualquier tema, con argumentos y respeto.', 12);
