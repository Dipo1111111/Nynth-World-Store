-- Nynth World Store - Supabase Postgres schema (LOCAL ONLY, not applied yet)
-- Mirrors Firestore collections. IDs preserved as TEXT (Firestore doc IDs).
-- Timestamps: created_at / updated_at timestamptz. Run this in Supabase SQL editor
-- AFTER admin creates the real project. No secrets in this file.

-- ===== helpers =====
create extension if not exists "pgcrypto";

-- is_admin(): checks users.role == 'admin' for current auth.uid()
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (select 1 from public.users where id = auth.uid()::text and role = 'admin');
$$;

-- ===== users (mirrors users/{uid}, role via VITE_ADMIN_EMAILS whitelist on signup) =====
create table if not exists public.users (
  id text primary key, -- Firebase uid / Supabase auth id
  email text not null,
  first_name text,
  last_name text,
  role text not null default 'customer' check (role in ('admin','customer')),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.users enable row level security;
drop policy if exists "users_self_read" on public.users;
create policy "users_self_read" on public.users for select using (auth.uid()::text = id or public.is_admin());
drop policy if exists "users_self_insert" on public.users;
create policy "users_self_insert" on public.users for insert with check (auth.uid()::text = id);
drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users for update using (auth.uid()::text = id or public.is_admin());
drop policy if exists "users_admin_delete" on public.users;
create policy "users_admin_delete" on public.users for delete using (public.is_admin());

-- ===== products (public read, writes locked to admin EXCEPT stock decrement via Edge Function service_role) =====
-- NOTE: Firestore rules allowed public write for guest stock decrement. On Supabase we do NOT
-- allow anon write; stock decrement happens server-side in finalize-paid-order (service_role bypasses RLS).
create table if not exists public.products (
  id text primary key,
  name text,
  title text,
  category text,
  price numeric not null default 0,
  stock_quantity integer not null default 0,
  in_stock boolean generated always as (stock_quantity > 0) stored,
  is_public boolean not null default true,
  featured boolean not null default false,
  best_seller boolean not null default false,
  tags text[] not null default '{}',
  display_order integer not null default 0,
  data jsonb not null default '{}'::jsonb, -- all other flexible fields (sizes, images, etc.)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select using (true);
drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products for all using (public.is_admin()) with check (public.is_admin());
create index if not exists products_category_idx on public.products (category);
create index if not exists products_featured_idx on public.products (featured) where featured = true;

-- ===== orders =====
create table if not exists public.orders (
  id text primary key,
  user_id text references public.users(id) on delete set null, -- null = guest checkout
  customer jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  tickets jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  shipping_fee numeric not null default 0,
  discount_amount numeric not null default 0,
  discount_code text,
  total numeric not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  order_status text not null default 'pending' check (order_status in ('pending','confirmed','shipped','delivered','cancelled')),
  payment_reference text,
  is_test boolean not null default false, -- test-mode traffic never counts as live
  payment_gateway text not null default 'paystack',
  paid_at timestamptz,
  customer_confirmation_sent_at timestamptz,
  admin_notification_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
drop policy if exists "orders_owner_read" on public.orders;
create policy "orders_owner_read" on public.orders for select using (public.is_admin() or (auth.uid()::text = user_id));
drop policy if exists "orders_create_pending" on public.orders;
create policy "orders_create_pending" on public.orders for insert with check (payment_status = 'pending' and order_status = 'pending');
drop policy if exists "orders_admin_write" on public.orders;
create policy "orders_admin_write" on public.orders for update using (public.is_admin());
drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders for delete using (public.is_admin());
create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_payment_idx on public.orders (payment_status);

-- ===== discount_codes (Firestore had NO rule - we lock to admin read, validate via Edge Function) =====
create table if not exists public.discount_codes (
  id text primary key,
  code text unique not null,
  percent_off numeric,
  amount_off numeric,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.discount_codes enable row level security;
drop policy if exists "discount_admin_all" on public.discount_codes;
create policy "discount_admin_all" on public.discount_codes for all using (public.is_admin()) with check (public.is_admin());

-- ===== subscribers =====
create table if not exists public.subscribers (
  id text primary key,
  email text unique not null,
  source text not null default 'newsletter',
  created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
drop policy if exists "subscribers_insert_any" on public.subscribers;
create policy "subscribers_insert_any" on public.subscribers for insert with check (true);
drop policy if exists "subscribers_admin_read" on public.subscribers;
create policy "subscribers_admin_read" on public.subscribers for select using (public.is_admin());
drop policy if exists "subscribers_admin_write" on public.subscribers;
create policy "subscribers_admin_write" on public.subscribers for update using (public.is_admin());
drop policy if exists "subscribers_admin_delete" on public.subscribers;
create policy "subscribers_admin_delete" on public.subscribers for delete using (public.is_admin());

-- ===== settings (site_config single row, public read) =====
create table if not exists public.settings (
  id text primary key, -- e.g. 'site_config'
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings for select using (true);
drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- ===== lookbooks =====
create table if not exists public.lookbooks (
  id text primary key,
  title text,
  featured boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lookbooks enable row level security;
drop policy if exists "lookbooks_public_read" on public.lookbooks;
create policy "lookbooks_public_read" on public.lookbooks for select using (true);
drop policy if exists "lookbooks_admin_write" on public.lookbooks;
create policy "lookbooks_admin_write" on public.lookbooks for all using (public.is_admin()) with check (public.is_admin());

-- ===== contact_messages =====
create table if not exists public.contact_messages (
  id text primary key,
  name text,
  email text,
  message text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
drop policy if exists "contact_insert_any" on public.contact_messages;
create policy "contact_insert_any" on public.contact_messages for insert with check (true);
drop policy if exists "contact_admin_all" on public.contact_messages;
create policy "contact_admin_all" on public.contact_messages for select using (public.is_admin());

-- ===== analytics counters (replaces analytics/counters) =====
create table if not exists public.analytics_counters (
  id text primary key, -- e.g. 'visits', 'clicks'
  count bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.analytics_counters enable row level security;
drop policy if exists "analytics_insert_any" on public.analytics_counters;
create policy "analytics_insert_any" on public.analytics_counters for insert with check (true);
drop policy if exists "analytics_update_any" on public.analytics_counters;
create policy "analytics_update_any" on public.analytics_counters for update using (true);
drop policy if exists "analytics_admin_read" on public.analytics_counters;
create policy "analytics_admin_read" on public.analytics_counters for select using (public.is_admin());

-- ===== presence (live visitors; clients write own session, admin reads) =====
create table if not exists public.presence (
  id text primary key, -- session id
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.presence enable row level security;
drop policy if exists "presence_write_any" on public.presence;
create policy "presence_write_any" on public.presence for insert with check (true);
drop policy if exists "presence_update_any" on public.presence;
create policy "presence_update_any" on public.presence for update using (true);
drop policy if exists "presence_delete_any" on public.presence;
create policy "presence_delete_any" on public.presence for delete using (true);
drop policy if exists "presence_admin_read" on public.presence;
create policy "presence_admin_read" on public.presence for select using (public.is_admin());
