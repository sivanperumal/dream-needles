-- 0003 · Catalog: collections (hierarchical), products, variants, images,
-- and the product ⇄ collection many-to-many junction.

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.collections (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  image_path text,
  -- Hidden collections are invisible to customers (pages, menus, search).
  is_visible boolean not null default true,
  -- Appears in the header mega-menu (the footer is driven by menu_items).
  show_in_menu boolean not null default true,
  -- Show a "View all" link under this collection's children in the menu.
  show_view_all boolean not null default false,
  menu_order integer not null default 0,
  -- Small label next to the item in the mega-menu, e.g. "Popular".
  menu_badge text check (char_length(menu_badge) <= 20),
  -- System collections (What's New) are computed, not assigned.
  is_system boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_not_own_parent check (parent_id is null or parent_id <> id)
);

create index collections_parent_idx on public.collections (parent_id, menu_order);

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  sku text unique check (sku ~ '^[A-Za-z0-9_-]{2,40}$'),
  tags text[] not null default '{}',
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price > 0),
  -- Ignored when the product has variants; each variant tracks its own stock.
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'draft' check (status in ('active', 'draft')),
  -- auto: new while inside the What's New window · pinned: always new · excluded: never.
  whats_new_mode text not null default 'auto'
    check (whats_new_mode in ('auto', 'pinned', 'excluded')),
  badges text[] not null default '{}',
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  seo_title text,
  seo_description text,
  -- Soft delete: hidden everywhere, kept for order history.
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_listing_idx on public.products (status, created_at desc)
  where deleted_at is null;
create index products_price_idx on public.products (price) where deleted_at is null;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  -- Path inside the `product-images` storage bucket.
  storage_path text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, storage_path)
);

create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  option_name text not null default 'Colour' check (char_length(option_name) between 1 and 40),
  value text not null check (char_length(value) between 1 and 60),
  swatch_hex text check (swatch_hex is null or swatch_hex ~ '^#[0-9A-Fa-f]{6}$'),
  sku text unique check (sku ~ '^[A-Za-z0-9_-]{2,40}$'),
  -- Null means "same as the product price".
  price_override numeric(10, 2) check (price_override is null or price_override >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_id uuid references public.product_images (id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, value)
);

create index product_variants_product_idx on public.product_variants (product_id, sort_order);

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- A product can belong to many collections; a collection page shows only
-- the products assigned to it (plus descendants for parent "View all").
create table public.product_collections (
  product_id uuid not null references public.products (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (product_id, collection_id)
);

create index product_collections_collection_idx
  on public.product_collections (collection_id, sort_order);
