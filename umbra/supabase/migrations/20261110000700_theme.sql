-- =============================================================================
-- Migración 0015 · Tema visual elegido por cada persona (claro, oscuro o automático)
-- =============================================================================
alter table public.user_settings
  add column theme text not null default 'light' check (theme in ('light', 'dark', 'system'));
