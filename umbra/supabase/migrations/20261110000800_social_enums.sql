-- =============================================================================
-- Migración 0016 · Publicaciones de fotos y exploraciones, y «me gusta»
-- (en su propio archivo: un valor nuevo de enum no se usa en la misma transacción).
-- =============================================================================
alter type public.post_type add value if not exists 'photo';
alter type public.post_type add value if not exists 'exploration';
alter type public.reaction_type add value if not exists 'like';
