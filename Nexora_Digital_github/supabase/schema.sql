-- ============================================================================
-- Nexora Digital — Supabase schema (run once in Supabase → SQL Editor)
-- Multi-vendor marketplace: accounts, vendors, listings, orders, commission
-- ledger, payouts, reviews. Row Level Security is ON for every table.
-- All money is stored in minor units (KES cents), matching Paystack.
-- ============================================================================
create extension if not exists pgcrypto;

-- ---------- helpers ----------------------------------------------------------
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- profiles ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  country text default 'Kenya',
  role text not null default 'customer' check (role in ('customer','vendor','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- users can never promote themselves
create or replace function public.protect_profile() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role; new.id := old.id; new.email := old.email;
  end if;
  return new;
end $$;
drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile before update on public.profiles for each row execute function public.protect_profile();

-- ---------- vendors ----------------------------------------------------------
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,  -- null = house/demo vendor
  store_name text not null check (char_length(store_name) between 2 and 80),
  slug text unique not null,
  bio text check (char_length(bio) <= 1200),
  category text,
  country text default 'Kenya',
  website text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  commission_rate numeric(5,4) check (commission_rate is null or (commission_rate >= 0 and commission_rate <= 0.9)),
  payout_method text check (payout_method in ('mpesa','bank','paybill','till')),
  payout_account text,
  payout_name text,
  payout_bank_code text,
  recipient_code text,            -- Paystack transfer recipient
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger vendors_updated before update on public.vendors for each row execute function public.set_updated_at();

create or replace function public.protect_vendor() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.status := old.status; new.commission_rate := old.commission_rate; new.user_id := old.user_id;
    new.is_demo := old.is_demo; new.slug := old.slug;
    new.recipient_code := old.recipient_code; new.payout_method := old.payout_method;
    new.payout_account := old.payout_account; new.payout_name := old.payout_name; new.payout_bank_code := old.payout_bank_code;
  end if;
  return new;
end $$;
drop trigger if exists protect_vendor on public.vendors;
create trigger protect_vendor before update on public.vendors for each row execute function public.protect_vendor();

create or replace view public.public_vendors as
  select id, store_name, slug, bio, category, country, website, created_at
  from public.vendors where status = 'approved';
grant select on public.public_vendors to anon, authenticated;

-- ---------- listings ---------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  slug text unique not null,
  category text not null,
  type text not null check (type in ('digital','service')),
  summary text not null check (char_length(summary) between 10 and 220),
  description text check (char_length(description) <= 5000),
  includes text[] default '{}',
  tags text[] default '{}',
  price_cents integer not null check (price_cents >= 5000),   -- min KES 50
  currency text not null default 'KES',
  image_url text,
  file_path text,                     -- private storage key (digital)
  delivery_days integer default 0,
  status text not null default 'draft' check (status in ('draft','pending','approved','rejected','archived')),
  reject_reason text,
  sales_count integer not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists listings_status_idx on public.listings(status, category);
create index if not exists listings_vendor_idx on public.listings(vendor_id);
create trigger listings_updated before update on public.listings for each row execute function public.set_updated_at();

create or replace function public.protect_listing() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.vendor_id := old.vendor_id; new.sales_count := old.sales_count; new.is_demo := old.is_demo;
    new.reject_reason := old.reject_reason; new.slug := old.slug;
    if new.status not in ('draft','pending','archived') and not (new.status = old.status and old.status = 'approved') then
      new.status := old.status;
    end if;
    -- any edit to a live listing sends it back for re-approval
    if old.status = 'approved' and new.status = 'approved' then new.status := 'pending'; end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_listing on public.listings;
create trigger protect_listing before update on public.listings for each row execute function public.protect_listing();

-- ---------- orders & commission ledger --------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity,
  customer_id uuid not null references public.profiles(id),
  email text not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  currency text not null default 'KES',
  total_cents integer not null,
  commission_cents integer not null default 0,
  reference text unique not null,
  channel text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists orders_customer_idx on public.orders(customer_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  vendor_id uuid not null references public.vendors(id),
  title text not null,
  type text not null,
  buyer_email text,
  price_cents integer not null,
  commission_rate numeric(5,4) not null,
  commission_cents integer not null,
  earning_cents integer not null,
  fulfilment_status text not null default 'pending'
    check (fulfilment_status in ('pending','in_progress','delivered','completed','refunded')),
  payout_status text not null default 'unpaid'
    check (payout_status in ('unpaid','on_hold','available','processing','paid','void')),
  available_at timestamptz,
  payout_id uuid,
  delivery_note text,
  delivery_url text,
  delivered_at timestamptz,
  download_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists items_order_idx on public.order_items(order_id);
create index if not exists items_vendor_idx on public.order_items(vendor_id, payout_status);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id),
  amount_cents integer not null,
  currency text not null default 'KES',
  status text not null default 'pending' check (status in ('pending','processing','paid','failed')),
  reference text unique not null,
  transfer_code text,
  failure_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.order_items add constraint order_items_payout_fk foreign key (payout_id) references public.payouts(id) on delete set null;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid unique not null references public.order_items(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id),
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.download_log (
  id bigint generated always as identity primary key,
  order_item_id uuid references public.order_items(id) on delete cascade,
  user_id uuid, ip text, created_at timestamptz not null default now()
);

create table if not exists public.settings (key text primary key, value jsonb not null, updated_at timestamptz default now());
insert into public.settings(key, value) values
  ('commission_default', '0.12'), ('payout_hold_days', '7'), ('min_payout_cents', '50000'), ('max_downloads', '10')
on conflict (key) do nothing;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text check (char_length(name) <= 120), email text check (char_length(email) <= 200),
  subject text check (char_length(subject) <= 200), body text check (char_length(body) between 5 and 4000),
  created_at timestamptz not null default now()
);
create table if not exists public.subscribers (
  email text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  source text, created_at timestamptz not null default now()
);
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid, action text, target text, detail jsonb, created_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------------------------------------------
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payouts enable row level security;
alter table public.reviews enable row level security;
alter table public.download_log enable row level security;
alter table public.settings enable row level security;
alter table public.messages enable row level security;
alter table public.subscribers enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.my_vendor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.vendors where user_id = auth.uid() limit 1;
$$;

-- profiles
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_admin());
-- vendors
create policy vendors_read on public.vendors for select using (user_id = auth.uid() or public.is_admin());
create policy vendors_apply on public.vendors for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and commission_rate is null and recipient_code is null and is_demo = false);
create policy vendors_update on public.vendors for update using (user_id = auth.uid() or public.is_admin());
create policy vendors_admin_delete on public.vendors for delete using (public.is_admin());
-- listings
create policy listings_public on public.listings for select using (status = 'approved' or vendor_id = public.my_vendor_id() or public.is_admin());
create policy listings_insert on public.listings for insert to authenticated
  with check (vendor_id = public.my_vendor_id() and status in ('draft','pending') and is_demo = false
              and exists (select 1 from public.vendors v where v.id = vendor_id and v.status = 'approved'));
create policy listings_update on public.listings for update using (vendor_id = public.my_vendor_id() or public.is_admin());
create policy listings_delete on public.listings for delete using ((vendor_id = public.my_vendor_id() and status in ('draft','rejected')) or public.is_admin());
-- orders (created only by server functions with the service role)
create policy orders_read on public.orders for select using (customer_id = auth.uid() or public.is_admin());
create policy items_read on public.order_items for select using (
  vendor_id = public.my_vendor_id() or public.is_admin()
  or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
-- payouts
create policy payouts_read on public.payouts for select using (vendor_id = public.my_vendor_id() or public.is_admin());
-- reviews
create policy reviews_public on public.reviews for select using (true);
create policy reviews_insert on public.reviews for insert to authenticated with check (
  customer_id = auth.uid() and exists (
    select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where oi.id = reviews.order_item_id and o.customer_id = auth.uid() and o.status = 'paid' and oi.listing_id = reviews.listing_id));
-- settings: readable by all (non-secret), editable by admin
create policy settings_read on public.settings for select using (true);
create policy settings_admin on public.settings for all using (public.is_admin()) with check (public.is_admin());
-- contact + newsletter: anyone can submit, only admin can read
create policy messages_insert on public.messages for insert to anon, authenticated with check (true);
create policy messages_admin on public.messages for select using (public.is_admin());
create policy subs_insert on public.subscribers for insert to anon, authenticated with check (true);
create policy subs_admin on public.subscribers for select using (public.is_admin());
create policy audit_admin on public.audit_log for select using (public.is_admin());
create policy dl_admin on public.download_log for select using (public.is_admin());

-- ---------- RPCs (security definer, ownership-checked) ----------------------
create or replace function public.vendor_update_item(p_item uuid, p_status text, p_note text, p_url text)
returns void language plpgsql security definer set search_path = public as $$
declare v_vendor uuid := public.my_vendor_id();
begin
  if p_status not in ('in_progress','delivered') then raise exception 'invalid status'; end if;
  update public.order_items oi set
    fulfilment_status = p_status,
    delivery_note = left(coalesce(p_note, oi.delivery_note), 2000),
    delivery_url = left(coalesce(p_url, oi.delivery_url), 1000),
    delivered_at = case when p_status = 'delivered' then now() else oi.delivered_at end
  from public.orders o
  where oi.id = p_item and oi.vendor_id = v_vendor and o.id = oi.order_id and o.status = 'paid'
    and oi.fulfilment_status in ('pending','in_progress','delivered');
  if not found then raise exception 'order item not found or not editable'; end if;
end $$;

create or replace function public.customer_complete_item(p_item uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.order_items oi set fulfilment_status = 'completed', available_at = least(coalesce(available_at, now()), now())
  from public.orders o
  where oi.id = p_item and o.id = oi.order_id and o.customer_id = auth.uid() and o.status = 'paid'
    and oi.fulfilment_status = 'delivered';
  if not found then raise exception 'item not found or not yet delivered'; end if;
end $$;

-- ---------- storage ----------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('listing-images', 'listing-images', true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('deliverables', 'deliverables', false, 52428800, null)
on conflict (id) do nothing;

create policy "vendors upload own images" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vendors update own images" on storage.objects for update to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vendors manage own deliverables" on storage.objects for all to authenticated
  using (bucket_id = 'deliverables' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'deliverables' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- first administrator ---------------------------------------------
-- 1) Register on the site with your email.  2) Run this (edit the email if needed):
--   update public.profiles set role = 'admin' where email = 'tyronejohn001@gmail.com';
