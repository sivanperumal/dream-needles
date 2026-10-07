-- 0005 · Content: reviews, contact submissions, store settings, banners,
-- navigation menus and editable static pages.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text check (char_length(title) <= 120),
  body text check (char_length(body) <= 2000),
  -- Display name captured at write time (profiles aren't publicly readable).
  author_name text not null default 'Verified customer' check (char_length(author_name) <= 60),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index reviews_product_idx on public.reviews (product_id, created_at desc);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 20),
  subject text check (char_length(subject) <= 150),
  message text not null check (char_length(message) between 5 and 4000),
  user_id uuid references public.profiles (id) on delete set null,
  sheet_synced boolean not null default false,
  sheet_error text,
  created_at timestamptz not null default now()
);

create index contact_submissions_created_idx on public.contact_submissions (created_at desc);

-- Single-row settings table (id is always 1).
create table public.store_settings (
  id smallint primary key default 1 check (id = 1),
  whats_new_days integer not null default 30 check (whats_new_days between 1 and 365),
  free_shipping_threshold numeric(10, 2) not null default 999 check (free_shipping_threshold >= 0),
  shipping_fee numeric(10, 2) not null default 79 check (shipping_fee >= 0),
  -- Prices include GST; this rate is used only to show the included amount.
  gst_rate numeric(5, 2) not null default 12 check (gst_rate between 0 and 28),
  delivery_eta_text text not null default 'Delivered in 3–5 business days',
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  promo_ticker text[] not null default '{}',
  home_intro text not null default '',
  -- [{ "value": "350+", "label": "Handmade designs" }, …]
  home_stats jsonb not null default '[]',
  -- [{ "name": "Amazon", "url": "https://…", "logo_path": "…" }, …]
  marketplaces jsonb not null default '[]',
  -- { "facebook": "https://…", "instagram": "…", "youtube": "…", "whatsapp": "…" }
  social_links jsonb not null default '{}',
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  store_address text,
  updated_at timestamptz not null default now()
);

create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  -- hero: home slider · tile: 4 tiles beside the slider · category: "Shop by Category"
  placement text not null check (placement in ('hero', 'tile', 'category')),
  title text not null default '',
  subtitle text not null default '',
  cta_label text,
  -- Path in the `site-assets` bucket, or a /public path starting with "/".
  image_path text not null,
  link_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index banners_placement_idx on public.banners (placement, sort_order);

create trigger banners_set_updated_at
  before update on public.banners
  for each row execute function public.set_updated_at();

-- Footer columns and extra header links (the header's collection menus come
-- straight from `collections`).
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu text not null check (menu in ('header', 'footer')),
  parent_id uuid references public.menu_items (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  collection_id uuid references public.collections (id) on delete cascade,
  url text,
  -- false for plain headings, e.g. the footer "Tools" column title.
  is_link boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint menu_items_link_target check (
    not is_link or collection_id is not null or url is not null
  )
);

create index menu_items_menu_idx on public.menu_items (menu, parent_id, sort_order);

create table public.pages (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  -- Markdown. On the FAQ page every "## " heading becomes an accordion item.
  body_markdown text not null default '',
  seo_description text,
  updated_at timestamptz not null default now()
);

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();
