-- =============================================================================
-- Migración 0012 · Enumeraciones de la biblioteca (en su propio archivo: un
-- valor añadido a un enum no se puede usar en la misma transacción).
-- =============================================================================
alter type public.report_target add value if not exists 'book';
alter type public.report_target add value if not exists 'book_recommendation';

create type public.book_level as enum ('intro', 'intermediate', 'advanced');
create type public.shelf_status as enum ('want', 'reading', 'read');
