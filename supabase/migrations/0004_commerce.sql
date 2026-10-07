-- 0004 · Commerce: wishlist, cart, coupons, orders, order items, payments

create table public.wishlist_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One line per product+variant per user (null variant treated as a value).
create unique index cart_items_unique_line on public.cart_items (
  user_id, product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,30}$'),
  description text not null default '',
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  value numeric(10, 2) not null check (value > 0),
  min_subtotal numeric(10, 2) not null default 0 check (min_subtotal >= 0),
  -- Cap for percent coupons; null = no cap.
  max_discount numeric(10, 2) check (max_discount is null or max_discount > 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_percent_max_100 check (discount_type <> 'percent' or value <= 100),
  constraint coupons_valid_window check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

-- DN-YYMMDD-XXXXX in India time, e.g. DN-261007-4F2A9.
create or replace function public.generate_order_number()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'DN-'
    || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD')
    || '-'
    || upper(substr(md5(gen_random_uuid()::text), 1, 5))
$$;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default public.generate_order_number(),
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  phone text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  -- All amounts in INR. Prices are GST-inclusive; gst_total is the included share.
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  discount_total numeric(10, 2) not null default 0 check (discount_total >= 0),
  shipping_total numeric(10, 2) not null default 0 check (shipping_total >= 0),
  gst_total numeric(10, 2) not null default 0 check (gst_total >= 0),
  total numeric(10, 2) not null check (total >= 0),
  currency text not null default 'INR',
  coupon_id uuid references public.coupons (id) on delete set null,
  coupon_code text,
  -- Snapshot so later address edits don't rewrite history.
  shipping_address jsonb not null,
  gift_note text check (char_length(gift_note) <= 300),
  razorpay_order_id text unique,
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  tracking_number text,
  tracking_url text,
  -- Set when payment succeeded but stock had run out; admin must follow up.
  stock_issue boolean not null default false,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  -- Snapshot of what was bought.
  product_name text not null,
  product_slug text,
  variant_label text,
  sku text,
  image_path text,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create index order_items_order_idx on public.order_items (order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  razorpay_order_id text not null,
  razorpay_payment_id text unique,
  status text not null check (status in ('created', 'captured', 'failed')),
  amount numeric(10, 2) not null,
  method text,
  error_description text,
  source text not null check (source in ('checkout', 'webhook')),
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
