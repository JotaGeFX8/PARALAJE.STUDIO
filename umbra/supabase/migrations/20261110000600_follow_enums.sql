-- =============================================================================
-- Migración 0014 · Tipos de aviso nuevos: seguidores y reacciones
-- (en su propio archivo: un valor nuevo de enum no se usa en la misma transacción).
-- =============================================================================
alter type public.notification_type add value if not exists 'follow';
alter type public.notification_type add value if not exists 'reaction';
