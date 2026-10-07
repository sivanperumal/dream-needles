-- 0002 · Users: profiles and addresses, plus the shared updated_at trigger

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- One profile per auth user, created automatically by a trigger (0006).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text check (char_length(full_name) <= 120),
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text check (char_length(label) <= 40),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  line1 text not null check (char_length(line1) between 3 and 200),
  line2 text check (char_length(line2) <= 200),
  landmark text check (char_length(landmark) <= 120),
  city text not null check (char_length(city) between 2 and 80),
  state text not null check (char_length(state) between 2 and 80),
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);
-- At most one default address per user.
create unique index addresses_one_default_per_user
  on public.addresses (user_id) where is_default;

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();
