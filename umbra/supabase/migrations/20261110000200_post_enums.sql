-- =============================================================================
-- Migración 0010 · Valores nuevos de enumeraciones.
-- Va en su propio archivo: PostgreSQL no permite usar un valor recién añadido
-- a un tipo enumerado dentro de la misma transacción.
-- =============================================================================

-- Clasificación epistémica ampliada: Hecho documentado, Hipótesis,
-- Interpretación, Opinión y Pregunta abierta («experience» queda como valor
-- heredado: la experiencia pasa a ser un tipo de publicación).
alter type public.post_kind add value if not exists 'interpretation';
alter type public.post_kind add value if not exists 'open_question';

-- Tipos de publicación
create type public.post_type as enum (
  'debate', 'question', 'research', 'discovery', 'experience', 'resource', 'poll', 'idea'
);
