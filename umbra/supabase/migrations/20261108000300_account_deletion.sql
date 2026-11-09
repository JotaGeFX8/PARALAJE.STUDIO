-- =============================================================================
-- UMBRA · Migración 0003 · Eliminación de la propia cuenta (derecho de supresión)
-- =============================================================================
-- Borra el usuario de auth.users; el perfil e intereses caen en cascada.
-- Los avatares se borran desde la app antes de llamar a esta función.
-- =============================================================================

create or replace function public.delete_my_account(p_confirm_username text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  uname text;
begin
  if uid is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  select username::text into uname from public.profiles where id = uid;
  if uname is null or lower(uname) <> lower(coalesce(p_confirm_username, '')) then
    raise exception 'La confirmación no coincide' using errcode = '22023';
  end if;
  -- La cuenta del administrador principal no se puede autoeliminar por error.
  if (select role from public.profiles where id = uid) = 'admin'
     and (select count(*) from public.profiles where role = 'admin' and status = 'active') <= 1 then
    raise exception 'Eres el único administrador: transfiere el rol antes' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;
