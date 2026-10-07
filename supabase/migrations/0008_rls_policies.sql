-- 0008 · Row Level Security
-- Every table has RLS on. Catalog/content: public read, admin write.
-- Personal data: owner only (admins can read). Orders, payments and contact
-- submissions are written only by server code using the service role, which
-- bypasses RLS after validating input.

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_collections enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.cart_items enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.store_settings enable row level security;
alter table public.banners enable row level security;
alter table public.menu_items enable row level security;
alter table public.pages enable row level security;

---------------------------------------------------------------------------
-- Profiles & addresses
---------------------------------------------------------------------------

create policy "Profiles: read own or admin" on public.profiles
  for select using (id = (select auth.uid()) or public.is_admin());
create policy "Profiles: update own or admin" on public.profiles
  for update using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

create policy "Addresses: owner full access" on public.addresses
  for all using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Addresses: admin read" on public.addresses
  for select using (public.is_admin());

---------------------------------------------------------------------------
-- Catalog
---------------------------------------------------------------------------

create policy "Collections: public read visible" on public.collections
  for select using (is_visible or public.is_admin());
create policy "Collections: admin write" on public.collections
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Products: public read active" on public.products
  for select using ((status = 'active' and deleted_at is null) or public.is_admin());
create policy "Products: admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Product images: public read for active products" on public.product_images
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active' and p.deleted_at is null
    )
  );
create policy "Product images: admin write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Product variants: public read for active products" on public.product_variants
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active' and p.deleted_at is null
    )
  );
create policy "Product variants: admin write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Product collections: public read" on public.product_collections
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active' and p.deleted_at is null
    )
  );
create policy "Product collections: admin write" on public.product_collections
  for all using (public.is_admin()) with check (public.is_admin());

---------------------------------------------------------------------------
-- Wishlist & cart
---------------------------------------------------------------------------

create policy "Wishlist: owner full access" on public.wishlist_items
  for all using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Cart: owner full access" on public.cart_items
  for all using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

---------------------------------------------------------------------------
-- Coupons, orders, payments
---------------------------------------------------------------------------

-- Customers never read coupons directly; the server validates codes.
create policy "Coupons: admin only" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Orders: read own or admin" on public.orders
  for select using (user_id = (select auth.uid()) or public.is_admin());
create policy "Orders: admin update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Order items: read own or admin" on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

create policy "Payments: read own or admin" on public.payments
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

---------------------------------------------------------------------------
-- Reviews
---------------------------------------------------------------------------

create policy "Reviews: public read visible, own, or admin" on public.reviews
  for select using (not is_hidden or user_id = (select auth.uid()) or public.is_admin());
create policy "Reviews: signed-in users create own" on public.reviews
  for insert with check (user_id = (select auth.uid()));
create policy "Reviews: update own or admin" on public.reviews
  for update using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());
create policy "Reviews: delete own or admin" on public.reviews
  for delete using (user_id = (select auth.uid()) or public.is_admin());

-- Only admins decide visibility; authors can't unhide a hidden review.
create or replace function public.protect_review_visibility()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.is_hidden := false;
    else
      new.is_hidden := old.is_hidden;
    end if;
  end if;
  return new;
end;
$$;

create trigger reviews_protect_visibility
  before insert or update on public.reviews
  for each row execute function public.protect_review_visibility();

---------------------------------------------------------------------------
-- Contact & content
---------------------------------------------------------------------------

create policy "Contact submissions: admin read" on public.contact_submissions
  for select using (public.is_admin());

create policy "Store settings: public read" on public.store_settings
  for select using (true);
create policy "Store settings: admin update" on public.store_settings
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Banners: public read active" on public.banners
  for select using (is_active or public.is_admin());
create policy "Banners: admin write" on public.banners
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Menu items: public read" on public.menu_items
  for select using (true);
create policy "Menu items: admin write" on public.menu_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Pages: public read" on public.pages
  for select using (true);
create policy "Pages: admin write" on public.pages
  for all using (public.is_admin()) with check (public.is_admin());
