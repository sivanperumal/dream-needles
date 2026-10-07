-- 0001 · Extensions and immutable helpers
-- pg_trgm: trigram similarity for partial and typo-tolerant search.
-- unaccent: accent-insensitive matching.
-- Supabase keeps extensions in the `extensions` schema.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- unaccent() is STABLE, so it can't be used in indexes or generated columns.
-- This wrapper pins the dictionary, which makes it safe to mark IMMUTABLE.
create or replace function public.immutable_unaccent(value text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, value)
$$;

-- array_to_string() is STABLE for the same reason; tags are plain text[].
create or replace function public.immutable_array_to_string(value text[], sep text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(pg_catalog.array_to_string(value, sep), '')
$$;
