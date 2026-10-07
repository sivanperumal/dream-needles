-- 0006 · Functions and triggers
-- Storefront functions are SECURITY INVOKER (RLS still applies) and also
-- filter to active, non-deleted products explicitly. Only functions that must
-- bypass RLS (admin check, profile creation, rating refresh, payment
-- finalisation) are SECURITY DEFINER, each with an empty search_path.

---------------------------------------------------------------------------
-- Auth helpers
---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- Create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Signed-in non-admins can't change their own role or email. (The SQL editor
-- and the service role have no auth.uid(), so admins can be promoted there.)
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only an admin can change roles' using errcode = '42501';
    end if;
    new.email := old.email;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

---------------------------------------------------------------------------
-- Collections
---------------------------------------------------------------------------

-- Reject parent assignments that would create a loop (A → B → A).
create or replace function public.prevent_collection_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;
  if exists (
    with recursive ancestors as (
      select c.id, c.parent_id from public.collections c where c.id = new.parent_id
      union
      select c.id, c.parent_id
      from public.collections c
      join ancestors a on c.id = a.parent_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'A collection cannot be its own ancestor' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger collections_prevent_cycle
  before insert or update of parent_id on public.collections
  for each row execute function public.prevent_collection_cycle();

-- The collection itself plus all visible descendants.
create or replace function public.collection_descendant_ids(root_id uuid)
returns setof uuid
language sql
stable
set search_path = ''
as $$
  with recursive tree as (
    select c.id from public.collections c where c.id = root_id
    union
    select c.id
    from public.collections c
    join tree t on c.parent_id = t.id
    where c.is_visible
  )
  select id from tree
$$;

-- Root → parent chain for breadcrumbs, e.g. [Handmade, Home Decor].
create or replace function public.collection_ancestors(collection_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with recursive chain as (
    select c.id, c.parent_id, c.name, c.slug, 0 as depth
    from public.collections c
    where c.id = (select parent_id from public.collections where id = collection_id)
    union all
    select c.id, c.parent_id, c.name, c.slug, chain.depth + 1
    from public.collections c
    join chain on c.id = chain.parent_id
  )
  select coalesce(
    jsonb_agg(jsonb_build_object('name', name, 'slug', slug) order by depth desc),
    '[]'::jsonb
  )
  from chain
$$;

---------------------------------------------------------------------------
-- Products
---------------------------------------------------------------------------

create or replace function public.whats_new_days()
returns integer
language sql
stable
set search_path = ''
as $$
  select coalesce((select whats_new_days from public.store_settings where id = 1), 30)
$$;

-- Computed field: `select=*,is_new` works through the Supabase API.
create or replace function public.is_new(p public.products)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case p.whats_new_mode
    when 'pinned' then true
    when 'excluded' then false
    else p.created_at >= now() - make_interval(days => public.whats_new_days())
  end
$$;

-- Products with variants are in stock if any active variant has stock.
create or replace function public.in_stock(p public.products)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.product_variants v
      where v.product_id = p.id and v.is_active
    ) then exists (
      select 1 from public.product_variants v
      where v.product_id = p.id and v.is_active and v.stock > 0
    )
    else p.stock > 0
  end
$$;

-- Everything a product card needs, in one object.
create or replace function public.product_card(p public.products)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'name', p.name,
    'price', p.price,
    'compare_at_price', p.compare_at_price,
    'badges', p.badges,
    'rating_avg', p.rating_avg,
    'rating_count', p.rating_count,
    'is_new', public.is_new(p),
    'in_stock', public.in_stock(p),
    'has_variants', exists (
      select 1 from public.product_variants v where v.product_id = p.id and v.is_active
    ),
    'images', coalesce((
      select jsonb_agg(i.storage_path order by i.sort_order, i.created_at)
      from (
        select storage_path, sort_order, created_at
        from public.product_images
        where product_id = p.id
        order by sort_order, created_at
        limit 2
      ) i
    ), '[]'::jsonb),
    'created_at', p.created_at
  )
$$;

-- Collection page data: the collection, one page of distinct products from it
-- and all its visible descendants, the total count, and filter facets.
-- p_sort: featured | newest | price_asc | price_desc | name_asc | best_rated
create or replace function public.get_collection_products(
  p_slug text,
  p_sort text default 'featured',
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_sub_slugs text[] default null,
  p_in_stock boolean default false,
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_col public.collections;
  v_limit integer := least(greatest(coalesce(p_limit, 24), 1), 60);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  select * into v_col from public.collections where slug = p_slug and is_visible;
  if not found then
    return null;
  end if;

  with base as (
    -- Distinct products in scope, with their best "featured" position.
    select p.id, min(pc.sort_order) as featured_order
    from public.products p
    join public.product_collections pc on pc.product_id = p.id
    where not v_col.is_system
      and pc.collection_id in (select public.collection_descendant_ids(v_col.id))
      and p.status = 'active' and p.deleted_at is null
    group by p.id
    union all
    -- System collection (What's New): computed, not assigned.
    select p.id, 0
    from public.products p
    where v_col.is_system
      and p.status = 'active' and p.deleted_at is null
      and public.is_new(p)
  ),
  scoped as (
    select b.*
    from base b
    where p_sub_slugs is null
      or cardinality(p_sub_slugs) = 0
      or exists (
        select 1
        from public.collections sub
        join public.product_collections pc on pc.product_id = b.id
        where sub.slug = any (p_sub_slugs)
          and sub.parent_id = v_col.id
          and pc.collection_id in (select public.collection_descendant_ids(sub.id))
      )
  ),
  filtered as (
    select s.featured_order, p
    from scoped s
    join public.products p on p.id = s.id
    where (p_min_price is null or p.price >= p_min_price)
      and (p_max_price is null or p.price <= p_max_price)
      and (not coalesce(p_in_stock, false) or public.in_stock(p))
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
        case when p_sort = 'featured' then f.featured_order end asc,
        (f.p).created_at desc,
        (f.p).id
      limit v_limit offset v_offset
    ) f
  )
  select jsonb_build_object(
    'collection', jsonb_build_object(
      'id', v_col.id,
      'name', v_col.name,
      'slug', v_col.slug,
      'description', v_col.description,
      'image_path', v_col.image_path,
      'seo_title', v_col.seo_title,
      'seo_description', v_col.seo_description,
      'ancestors', public.collection_ancestors(v_col.id)
    ),
    'total', (select count(*) from filtered),
    'items', coalesce(
      (select jsonb_agg(public.product_card(pg.p) order by pg.rn) from page pg),
      '[]'::jsonb
    ),
    'facets', jsonb_build_object(
      'price_min', (select min(p.price) from base b join public.products p on p.id = b.id),
      'price_max', (select max(p.price) from base b join public.products p on p.id = b.id),
      'subcollections', coalesce((
        select jsonb_agg(jsonb_build_object('name', c.name, 'slug', c.slug, 'count', c.cnt)
                         order by c.menu_order, c.name)
        from (
          select sub.name, sub.slug, sub.menu_order,
            (select count(distinct pc.product_id)
             from public.product_collections pc
             where pc.collection_id in (select public.collection_descendant_ids(sub.id))
               and pc.product_id in (select id from base)) as cnt
          from public.collections sub
          where sub.parent_id = v_col.id and sub.is_visible
        ) c
        where c.cnt > 0
      ), '[]'::jsonb)
    )
  )
  into v_result;

  return v_result;
end;
$$;

-- "You may also like": products sharing the most collections, newest first.
create or replace function public.get_related_products(p_product_id uuid, p_limit integer default 4)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(public.product_card(r.p) order by r.shared desc, (r.p).created_at desc), '[]'::jsonb)
  from (
    select p, count(*) as shared
    from public.product_collections mine
    join public.product_collections other
      on other.collection_id = mine.collection_id and other.product_id <> mine.product_id
    join public.products p on p.id = other.product_id
    where mine.product_id = p_product_id
      and p.status = 'active' and p.deleted_at is null
    group by p.id
    order by count(*) desc, p.created_at desc
    limit least(greatest(coalesce(p_limit, 4), 1), 12)
  ) r
$$;

-- Cards for a list of product ids, in the given order (wishlist, recently viewed).
create or replace function public.get_product_cards(p_ids uuid[])
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(public.product_card(p) order by array_position(p_ids, p.id)), '[]'::jsonb)
  from public.products p
  where p.id = any (p_ids)
    and p.status = 'active' and p.deleted_at is null
$$;

---------------------------------------------------------------------------
-- Reviews → product rating
---------------------------------------------------------------------------

create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set rating_avg = coalesce(r.avg_rating, 0),
      rating_count = coalesce(r.cnt, 0)
  from (
    select round(avg(rating)::numeric, 2) as avg_rating, count(*) as cnt
    from public.reviews
    where product_id = v_product_id and not is_hidden
  ) r
  where p.id = v_product_id;
  return null;
end;
$$;

create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

---------------------------------------------------------------------------
-- Payment finalisation (server only)
---------------------------------------------------------------------------

-- Marks an order paid exactly once. Safe to call from both the checkout
-- verify endpoint and the Razorpay webhook, in any order.
-- p_amount is in rupees; null skips the amount check.
create or replace function public.place_order_paid(
  p_order_id uuid,
  p_razorpay_payment_id text,
  p_method text,
  p_amount numeric,
  p_source text,
  p_raw jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_item record;
  v_stock_issue boolean := false;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id using errcode = 'P0002';
  end if;

  if p_amount is not null and p_amount <> v_order.total then
    raise exception 'Amount mismatch for order %', v_order.order_number using errcode = '22023';
  end if;

  insert into public.payments (
    order_id, razorpay_order_id, razorpay_payment_id, status, amount, method, source, raw
  )
  values (
    v_order.id, v_order.razorpay_order_id, p_razorpay_payment_id, 'captured',
    v_order.total, p_method, p_source, p_raw
  )
  on conflict (razorpay_payment_id) do update
    set status = 'captured',
        method = coalesce(excluded.method, public.payments.method),
        raw = coalesce(excluded.raw, public.payments.raw);

  if v_order.status <> 'pending' then
    return jsonb_build_object('order_number', v_order.order_number, 'already_paid', true);
  end if;

  for v_item in
    select product_id, variant_id, quantity from public.order_items where order_id = v_order.id
  loop
    if v_item.variant_id is not null then
      update public.product_variants
      set stock = stock - v_item.quantity
      where id = v_item.variant_id and stock >= v_item.quantity;
    else
      update public.products
      set stock = stock - v_item.quantity
      where id = v_item.product_id and stock >= v_item.quantity;
    end if;
    if not found then
      v_stock_issue := true;
    end if;
  end loop;

  update public.orders
  set status = 'paid', paid_at = now(), stock_issue = v_stock_issue
  where id = v_order.id;

  if v_order.coupon_id is not null then
    update public.coupons set used_count = used_count + 1 where id = v_order.coupon_id;
  end if;

  -- Remove exactly the purchased lines (a Buy Now order leaves the rest of the cart).
  if v_order.user_id is not null then
    delete from public.cart_items c
    using public.order_items oi
    where oi.order_id = v_order.id
      and c.user_id = v_order.user_id
      and c.product_id = oi.product_id
      and c.variant_id is not distinct from oi.variant_id;
  end if;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'already_paid', false,
    'stock_issue', v_stock_issue
  );
end;
$$;

revoke execute on function public.place_order_paid(uuid, text, text, numeric, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.place_order_paid(uuid, text, text, numeric, text, jsonb)
  to service_role;
