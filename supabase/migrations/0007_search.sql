-- 0007 · Search
-- Products match on name, SKU, tags and description; collections on name and
-- description. Full-text search handles whole words and stemming
-- ("hooks" → "hook"); pg_trgm handles partial words and typos
-- ("crochte" → "crochet"). Both are index-backed.

---------------------------------------------------------------------------
-- Search columns and indexes
---------------------------------------------------------------------------

alter table public.products
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('english'::regconfig, public.immutable_unaccent(name)), 'A')
    || setweight(to_tsvector('simple'::regconfig, coalesce(sku, '')), 'A')
    || setweight(
         to_tsvector('english'::regconfig,
           public.immutable_unaccent(public.immutable_array_to_string(tags, ' '))),
         'B')
    || setweight(to_tsvector('english'::regconfig, public.immutable_unaccent(description)), 'C')
  ) stored,
  -- Lower-cased, accent-free name/SKU/tags for trigram matching.
  add column search_text text generated always as (
    lower(public.immutable_unaccent(
      name || ' ' || coalesce(sku, '') || ' ' || public.immutable_array_to_string(tags, ' ')
    ))
  ) stored;

create index products_search_vector_idx on public.products using gin (search_vector);
create index products_search_text_trgm_idx
  on public.products using gin (search_text extensions.gin_trgm_ops);
create index products_name_trgm_idx
  on public.products using gin (lower(public.immutable_unaccent(name)) extensions.gin_trgm_ops);

alter table public.collections
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('english'::regconfig, public.immutable_unaccent(name)), 'A')
    || setweight(to_tsvector('english'::regconfig, public.immutable_unaccent(description)), 'C')
  ) stored,
  add column search_text text generated always as (
    lower(public.immutable_unaccent(name))
  ) stored;

create index collections_search_vector_idx on public.collections using gin (search_vector);
create index collections_search_text_trgm_idx
  on public.collections using gin (search_text extensions.gin_trgm_ops);

---------------------------------------------------------------------------
-- Query helpers
---------------------------------------------------------------------------

-- Normalise user input: trim, lower-case, strip accents, cap length.
create or replace function public.search_normalize(q text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(lower(public.immutable_unaccent(btrim(coalesce(q, '')))), 64)
$$;

-- "crochet hoo" → 'crochet':* & 'hoo':*  (prefix match on every word).
create or replace function public.search_tsquery(q text)
returns tsquery
language sql
immutable
set search_path = ''
as $$
  select to_tsquery(
    'english'::regconfig,
    coalesce(
      (select string_agg(quote_literal(w) || ':*', ' & ')
       from regexp_split_to_table(public.search_normalize(q), '[^a-z0-9]+') as w
       where w <> ''),
      ''
    )
  )
$$;

-- Matching products with a relevance score and the field that matched.
create or replace function public.search_product_matches(q text)
returns table (product_id uuid, rank real, matched_in text)
language sql
stable
set search_path = public, extensions
set pg_trgm.word_similarity_threshold = 0.45
as $$
  with input as (
    select
      public.search_normalize(q) as q,
      public.search_tsquery(q) as tsq,
      '%' || replace(replace(replace(public.search_normalize(q), '\', '\\'), '%', '\%'), '_', '\_') || '%'
        as like_pattern
  )
  select
    p.id,
    (
      ts_rank(p.search_vector, i.tsq) * 2
      + word_similarity(i.q, lower(public.immutable_unaccent(p.name)))
      + case when lower(public.immutable_unaccent(p.name)) like i.q || '%' then 0.5 else 0 end
      + case when lower(coalesce(p.sku, '')) = i.q then 1 else 0 end
    )::real as rank,
    case
      when lower(public.immutable_unaccent(p.name)) like i.like_pattern
        or i.q <% lower(public.immutable_unaccent(p.name))
        or to_tsvector('english'::regconfig, public.immutable_unaccent(p.name)) @@ i.tsq
        then 'name'
      when lower(coalesce(p.sku, '')) like i.like_pattern then 'sku'
      when lower(public.immutable_unaccent(public.immutable_array_to_string(p.tags, ' ')))
             like i.like_pattern
        or to_tsvector('english'::regconfig,
             public.immutable_unaccent(public.immutable_array_to_string(p.tags, ' '))) @@ i.tsq
        then 'tags'
      else 'description'
    end as matched_in
  from public.products p
  cross join input i
  where char_length(i.q) >= 2
    and p.status = 'active'
    and p.deleted_at is null
    and (
      p.search_vector @@ i.tsq
      or i.q <% p.search_text
      or p.search_text like i.like_pattern
    )
$$;

---------------------------------------------------------------------------
-- Live search popup
---------------------------------------------------------------------------

-- { collections: [{ id, name, slug, parent_name }], products: [card + matched_in + snippet] }
create or replace function public.search_catalog(
  q text,
  p_product_limit integer default 8,
  p_collection_limit integer default 4
)
returns jsonb
language sql
stable
set search_path = public, extensions
set pg_trgm.word_similarity_threshold = 0.45
as $$
  with input as (
    select public.search_normalize(q) as q, public.search_tsquery(q) as tsq
  ),
  collection_hits as (
    select c.id, c.name, c.slug, parent.name as parent_name,
      (
        ts_rank(c.search_vector, i.tsq) * 2
        + word_similarity(i.q, c.search_text)
        + case when c.search_text like i.q || '%' then 0.5 else 0 end
      ) as rank
    from public.collections c
    cross join input i
    left join public.collections parent on parent.id = c.parent_id
    where char_length(i.q) >= 2
      and c.is_visible
      and (parent.id is null or parent.is_visible)
      and (
        c.search_vector @@ i.tsq
        or i.q <% c.search_text
        or c.search_text like '%' || i.q || '%'
      )
    order by rank desc, c.name
    limit least(greatest(coalesce(p_collection_limit, 4), 0), 20)
  ),
  product_hits as (
    select m.rank, m.matched_in, p
    from public.search_product_matches(q) m
    join public.products p on p.id = m.product_id
    order by m.rank desc, p.name
    limit least(greatest(coalesce(p_product_limit, 8), 0), 50)
  )
  select jsonb_build_object(
    'collections', coalesce(
      (select jsonb_agg(jsonb_build_object(
          'id', id, 'name', name, 'slug', slug, 'parent_name', parent_name
        ) order by rank desc, name)
       from collection_hits),
      '[]'::jsonb),
    'products', coalesce(
      (select jsonb_agg(
          public.product_card(h.p)
          || jsonb_build_object(
               'matched_in', h.matched_in,
               'snippet', case when h.matched_in = 'description'
                 then left((h.p).description, 160) end
             )
          order by h.rank desc, (h.p).name)
       from product_hits h),
      '[]'::jsonb)
  )
$$;

---------------------------------------------------------------------------
-- Full search results page (/search?q=…)
---------------------------------------------------------------------------

-- p_sort: relevance | newest | price_asc | price_desc | name_asc | best_rated
create or replace function public.search_products(
  q text,
  p_sort text default 'relevance',
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_collection_slugs text[] default null,
  p_in_stock boolean default false,
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language sql
stable
set search_path = public, extensions
set pg_trgm.word_similarity_threshold = 0.45
as $$
  with matches as (
    select m.rank, p
    from public.search_product_matches(q) m
    join public.products p on p.id = m.product_id
  ),
  in_collections as (
    select m.*
    from matches m
    where p_collection_slugs is null
      or cardinality(p_collection_slugs) = 0
      or exists (
        select 1
        from public.collections c
        join public.product_collections pc on pc.product_id = (m.p).id
        where c.slug = any (p_collection_slugs)
          and pc.collection_id in (select public.collection_descendant_ids(c.id))
      )
  ),
  filtered as (
    select *
    from in_collections f
    where (p_min_price is null or (f.p).price >= p_min_price)
      and (p_max_price is null or (f.p).price <= p_max_price)
      and (not coalesce(p_in_stock, false) or public.in_stock(f.p))
  ),
  page as (
    select f.p, row_number() over () as rn
    from (
      select * from filtered f
      order by
        case when p_sort = 'price_asc' then (f.p).price end asc,
        case when p_sort = 'price_desc' then (f.p).price end desc,
        case when p_sort = 'name_asc' then (f.p).name end asc,
        case when p_sort = 'best_rated' then (f.p).rating_avg end desc,
        case when p_sort = 'newest' then (f.p).created_at end desc,
        f.rank desc,
        (f.p).name
      limit least(greatest(coalesce(p_limit, 24), 1), 60)
      offset greatest(coalesce(p_offset, 0), 0)
    ) f
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'items', coalesce(
      (select jsonb_agg(public.product_card(pg.p) order by pg.rn) from page pg),
      '[]'::jsonb),
    'facets', jsonb_build_object(
      'price_min', (select min((m.p).price) from matches m),
      'price_max', (select max((m.p).price) from matches m),
      -- Leaf-ish collections that contain matches, most matches first.
      'collections', coalesce((
        select jsonb_agg(jsonb_build_object('name', x.name, 'slug', x.slug, 'count', x.cnt)
                         order by x.cnt desc, x.name)
        from (
          select c.name, c.slug, count(distinct (m.p).id) as cnt
          from matches m
          join public.product_collections pc on pc.product_id = (m.p).id
          join public.collections c on c.id = pc.collection_id
          where c.is_visible
          group by c.id, c.name, c.slug
          order by cnt desc
          limit 12
        ) x
      ), '[]'::jsonb)
    )
  )
$$;
