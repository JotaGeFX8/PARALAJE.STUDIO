-- =============================================================================
-- Migración 0008 · Protección de rol y estado compatible con la moderación
-- =============================================================================
-- La protección anterior solo dejaba cambiar rol/estado a administración, lo que
-- impedía que el equipo de moderación suspendiera cuentas con admin_set_status.
-- Ahora se bloquea cualquier cambio DIRECTO hecho por un usuario de la API
-- (rol «authenticated»); los cambios a través de las funciones autorizadas
-- (SECURITY DEFINER, que comprueban el rol) o desde el panel de Supabase pasan.
-- La función es SECURITY INVOKER para que current_user refleje quién actúa.

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and current_user in ('authenticated', 'anon') then
    raise exception 'Solo el equipo puede modificar rol o estado' using errcode = '42501';
  end if;
  return new;
end;
$$;
