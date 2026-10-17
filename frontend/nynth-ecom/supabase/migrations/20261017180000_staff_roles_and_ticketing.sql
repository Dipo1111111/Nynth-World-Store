-- Roles, permissions, per-event scoping, atomic ticket entry, ticket state
-- separation, and ticket revenue separation.
--
-- Additive only. No drop, no rewrite of existing orders. The shop is live.
-- Everything here is derived from the owner's platform brief: Main Admin,
-- Vice Admin, Ticket Organizer, Ticketing Admin, Ticketing Staff, each with
-- its own dashboard, enforced in Postgres rather than in React.

-- ===== 1. STAFF ROLES =====

create table if not exists public.staff_roles (
  id text primary key,
  user_id text references public.users(id) on delete set null,
  email text not null,
  full_name text,
  department text,
  role text not null check (role in ('vice_admin','ticket_organizer','ticket_admin','ticket_staff')),
  -- Overrides layered on top of the role defaults. true/false per key.
  permissions jsonb not null default '{}'::jsonb,
  -- Event scoping. Empty means scoped to nothing: the founder assigns events
  -- before the person can see a single ticket.
  event_ids text[] not null default '{}',
  status text not null default 'invited' check (status in ('invited','active','suspended')),
  notes text,
  invited_by text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists staff_roles_user_idx on public.staff_roles (user_id);
create index if not exists staff_roles_email_idx on public.staff_roles (lower(email));
create unique index if not exists staff_roles_email_unique on public.staff_roles (lower(email));

alter table public.staff_roles enable row level security;
drop policy if exists "staff_roles_founder_all" on public.staff_roles;
create policy "staff_roles_founder_all" on public.staff_roles
  for all using (public.is_admin()) with check (public.is_admin());
-- Nobody may read another person's permissions, and nobody may grant their own.
-- Staff read their own access through public.my_access() instead.

-- ===== 2. PERMISSION HELPERS =====

-- Default permission set per role, straight from the brief's access tables.
create or replace function public.staff_role_defaults(p_role text)
returns jsonb
language sql
immutable
as $$
  select case p_role
    when 'vice_admin' then '{
      "store.products.view": true,
      "store.orders.view": true,
      "store.carts.view": true,
      "store.customers.view": true,
      "store.customers.email": true,
      "store.subscribers.view": true,
      "store.subscribers.email": true,
      "store.discounts.view": true,
      "store.lookbooks.view": true,
      "ticketing.events.view": true,
      "ticketing.orders.view": true,
      "ticketing.attendees.view": true
    }'::jsonb
    when 'ticket_organizer' then '{
      "ticketing.events.view": true,
      "ticketing.events.edit": true,
      "ticketing.tickets.manage": true,
      "ticketing.orders.view": true,
      "ticketing.attendees.view": true,
      "ticketing.verify": true,
      "ticketing.revenue.view": true,
      "ticketing.refunds.manage": true
    }'::jsonb
    when 'ticket_admin' then '{
      "ticketing.events.view": true,
      "ticketing.orders.view": true,
      "ticketing.attendees.view": true,
      "ticketing.verify": true
    }'::jsonb
    when 'ticket_staff' then '{
      "ticketing.events.view": true,
      "ticketing.orders.view": true,
      "ticketing.attendees.view": true,
      "ticketing.verify": true
    }'::jsonb
    else '{}'::jsonb
  end;
$$;

-- The signed-in person's active staff row. Matches on user_id first, then on
-- the JWT email, so permissions work the very first time somebody logs in
-- without a separate invite-accept step. SECURITY DEFINER because the
-- staff_roles table itself is founder-only.
create or replace function public.current_staff_role()
returns public.staff_roles
language sql
stable
security definer
set search_path = public
as $$
  select r.*
  from public.staff_roles r
  where r.status = 'active'
    and (
      r.user_id = auth.uid()::text
      or lower(r.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  order by (r.user_id is not null) desc, r.created_at desc
  limit 1;
$$;

create or replace function public.my_permissions()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.staff_role_defaults(r.role) || r.permissions
      from public.staff_roles r
      where r.status = 'active'
        and (
          r.user_id = auth.uid()::text
          or lower(r.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
      order by (r.user_id is not null) desc, r.created_at desc
      limit 1
    ),
    '{}'::jsonb
  );
$$;

create or replace function public.has_permission(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or coalesce((public.my_permissions() ->> p_key)::boolean, false);
$$;

create or replace function public.my_event_ids()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select r.event_ids from public.staff_roles r where r.status = 'active'
    and (r.user_id = auth.uid()::text or lower(r.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    order by (r.user_id is not null) desc, r.created_at desc limit 1), '{}');
$$;

-- An organizer cannot read another organizer's event by swapping an id.
create or replace function public.can_access_event(p_event_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or (p_event_id is not null and p_event_id = any(public.my_event_ids()));
$$;

-- True when any line item on the order belongs to an event in scope.
create or replace function public.order_touches_my_events(p_items jsonb)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) i
    where public.can_access_event(i ->> 'id')
  );
$$;

-- One call the client makes on login to learn who it is.
create or replace function public.my_access()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'user_id', auth.uid()::text,
    'email', coalesce(auth.jwt() ->> 'email', ''),
    'is_admin', public.is_admin(),
    'role', (select r.role from public.staff_roles r where r.id = (select id from public.current_staff_role())),
    'full_name', (select r.full_name from public.staff_roles r where r.id = (select id from public.current_staff_role())),
    'permissions', public.my_permissions(),
    'event_ids', public.my_event_ids()
  );
$$;

-- Claim the invitation on first login: stamps user_id so later role edits are
-- unambiguous, and promotes status from invited to active.
create or replace function public.bind_staff_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_row public.staff_roles;
begin
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email = '' then
    return jsonb_build_object('ok', false, 'error', 'no email on this session');
  end if;
  select * into v_row
  from public.staff_roles
  where lower(email) = v_email and status <> 'suspended'
  order by created_at desc limit 1
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no invitation for this email');
  end if;
  if v_row.status = 'invited' then
    update public.staff_roles
    set status = 'active', user_id = auth.uid()::text,
        updated_at = now(), last_seen_at = now()
    where id = v_row.id;
  else
    update public.staff_roles
    set user_id = coalesce(user_id, auth.uid()::text), last_seen_at = now()
    where id = v_row.id;
  end if;
  return jsonb_build_object('ok', true, 'role', v_row.role, 'event_ids', v_row.event_ids);
end;
$$;

revoke all on function public.staff_role_defaults(text) from public;
revoke all on function public.current_staff_role() from public;
revoke all on function public.my_permissions() from public;
revoke all on function public.has_permission(text) from public;
revoke all on function public.my_event_ids() from public;
revoke all on function public.can_access_event(text) from public;
revoke all on function public.order_touches_my_events(jsonb) from public;
revoke all on function public.my_access() from public;
revoke all on function public.bind_staff_profile() from public;
grant execute on function public.current_staff_role() to authenticated, service_role;
grant execute on function public.my_permissions() to authenticated, service_role;
grant execute on function public.has_permission(text) to authenticated, service_role;
grant execute on function public.my_event_ids() to authenticated, service_role;
grant execute on function public.can_access_event(text) to authenticated, service_role;
grant execute on function public.order_touches_my_events(jsonb) to authenticated, service_role;
grant execute on function public.my_access() to authenticated, service_role;
grant execute on function public.bind_staff_profile() to authenticated, service_role;

-- ===== 3. TICKET STATE SEPARATION =====

-- Payment status, ticket status, and entry status are three separate axes, per
-- the brief. Verifying an unpaid ticket can never mark it paid.
create table if not exists public.event_tickets (
  id text primary key,
  code text not null unique,
  order_id text references public.orders(id) on delete cascade,
  event_id text not null,
  event_title text,
  event_date_time timestamptz,
  venue text,
  ticket_type text,
  holder_name text,
  holder_email text,
  amount numeric not null default 0,
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded')),
  ticket_status text not null default 'valid'
    check (ticket_status in ('valid','cancelled','revoked')),
  entry_status text not null default 'unused'
    check (entry_status in ('unused','used')),
  verified_at timestamptz,
  verified_by text,
  verified_by_email text,
  payment_fee numeric not null default 0,
  commission_rate numeric not null default 0,
  nynth_commission numeric not null default 0,
  organizer_share numeric not null default 0,
  organizer_staff_id text,
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists event_tickets_event_idx on public.event_tickets (event_id);
create index if not exists event_tickets_order_idx on public.event_tickets (order_id);
create index if not exists event_tickets_scope_idx on public.event_tickets (event_id, entry_status);

alter table public.event_tickets enable row level security;
drop policy if exists "event_tickets_scoped_read" on public.event_tickets;
create policy "event_tickets_scoped_read" on public.event_tickets
  for select to authenticated
  using (public.can_access_event(event_id));
-- No insert/update/delete policies on purpose. Rows are minted by the payment
-- finalizer (service_role) and changed only through the functions below, so a
-- staff member can never flip a payment status from the browser console.

-- Backfill from the jsonb codes already sitting inside orders.tickets.
insert into public.event_tickets (
  id, code, order_id, event_id, event_title, event_date_time, venue,
  holder_name, holder_email, amount, payment_status, entry_status,
  verified_at, is_test, created_at, updated_at
)
select
  'et-' || md5(o.id || '-' || upper(t.code)),
  upper(t.code),
  o.id,
  coalesce(t.productId, ''),
  t.title,
  nullif(t.eventDateTime, '')::timestamptz,
  null,
  nullif(trim(coalesce(o.customer->>'firstName','') || ' ' || coalesce(o.customer->>'lastName','')), ''),
  o.customer->>'email',
  coalesce((t.price)::numeric, 0),
  case
    when o.order_status = 'cancelled' then 'refunded'
    else coalesce(o.payment_status, 'pending')
  end,
  case when coalesce(t.used, false) then 'used' else 'unused' end,
  nullif(t.used_at, '')::timestamptz,
  o.is_test,
  o.created_at,
  now()
from public.orders o
cross join lateral jsonb_array_elements(coalesce(o.tickets, '[]'::jsonb)) t
where nullif(t.code, '') is not null
on conflict (code) do nothing;

-- ===== 4. ATOMIC ENTRY VERIFICATION =====

-- One statement does the check and the write. Two staff members at two doors
-- with the same screenshot cannot both win: the conditional UPDATE takes a row
-- lock, so exactly one caller sees entry_status leave 'unused'.
create or replace function public.verify_ticket_entry(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.event_tickets;
  v_actor_email text;
begin
  v_actor_email := coalesce(auth.jwt() ->> 'email', '');
  select * into t
  from public.event_tickets
  where code = upper(trim(p_code))
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not (public.is_admin() or public.has_permission('ticketing.verify')) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if not public.can_access_event(t.event_id) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden_event');
  end if;

  if t.payment_status <> 'paid' then
    return jsonb_build_object(
      'ok', false, 'reason', 'not_paid', 'payment_status', t.payment_status,
      'event_title', t.event_title, 'event_date_time', t.event_date_time,
      'ticket_type', t.ticket_type, 'holder_name', t.holder_name,
      'order_id', t.order_id, 'code', t.code
    );
  end if;

  if t.ticket_status <> 'valid' then
    return jsonb_build_object(
      'ok', false, 'reason', t.ticket_status,
      'event_title', t.event_title, 'ticket_type', t.ticket_type,
      'holder_name', t.holder_name, 'order_id', t.order_id, 'code', t.code
    );
  end if;

  if t.entry_status = 'used' then
    return jsonb_build_object(
      'ok', false, 'reason', 'already_used', 'verified_at', t.verified_at,
      'verified_by', t.verified_by_email, 'event_title', t.event_title,
      'ticket_type', t.ticket_type, 'holder_name', t.holder_name,
      'order_id', t.order_id, 'code', t.code
    );
  end if;

  update public.event_tickets
  set entry_status = 'used',
      verified_at = now(),
      verified_by = auth.uid()::text,
      verified_by_email = v_actor_email,
      updated_at = now()
  where id = t.id and entry_status = 'unused'
  returning * into t;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'already_used', 'code', t.code);
  end if;

  return jsonb_build_object(
    'ok', true, 'reason', 'verified', 'code', t.code,
    'event_title', t.event_title, 'event_date_time', t.event_date_time,
    'ticket_type', t.ticket_type, 'holder_name', t.holder_name,
    'order_id', t.order_id, 'verified_at', t.verified_at,
    'verified_by', t.verified_by_email
  );
end;
$$;

-- Read-only door lookup, scoped to the caller's events. No money, no totals.
create or replace function public.ticket_status_for(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare t public.event_tickets;
begin
  select * into t from public.event_tickets where code = upper(trim(p_code));
  if not found then
    return jsonb_build_object('found', false);
  end if;
  if not (public.is_admin() or public.has_permission('ticketing.orders.view')) then
    return jsonb_build_object('found', false, 'reason', 'forbidden');
  end if;
  if not public.can_access_event(t.event_id) then
    return jsonb_build_object('found', false, 'reason', 'forbidden_event');
  end if;
  return jsonb_build_object(
    'found', true, 'code', t.code, 'payment_status', t.payment_status,
    'ticket_status', t.ticket_status, 'entry_status', t.entry_status,
    'verified_at', t.verified_at, 'verified_by', t.verified_by_email,
    'event_title', t.event_title, 'event_date_time', t.event_date_time,
    'ticket_type', t.ticket_type, 'holder_name', t.holder_name,
    'order_id', t.order_id, 'is_test', t.is_test
  );
end;
$$;

-- Cancel / revoke / reinstate a ticket. Never deletes a record and never
-- touches an existing order's totals, so a price change or an edit upstream
-- cannot silently invalidate what a customer already bought.
create or replace function public.set_ticket_status(p_code text, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.event_tickets;
begin
  if p_status not in ('valid','cancelled','revoked') then
    return jsonb_build_object('ok', false, 'error', 'bad status');
  end if;
  select * into t from public.event_tickets where code = upper(trim(p_code)) for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not found');
  end if;
  if not (public.is_admin() or public.has_permission('ticketing.tickets.manage')) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  if not public.can_access_event(t.event_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden_event');
  end if;
  update public.event_tickets
  set ticket_status = p_status, updated_at = now()
  where id = t.id
  returning * into t;
  return jsonb_build_object('ok', true, 'code', t.code, 'ticket_status', t.ticket_status);
end;
$$;

-- A refund is a payment fact, recorded by the person who owns the money, and
-- it moves the ledger to refunded. It never rewrites the original amount.
create or replace function public.refund_ticket(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare t public.event_tickets;
begin
  select * into t from public.event_tickets where code = upper(trim(p_code)) for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not found');
  end if;
  if not (public.is_admin() or public.has_permission('ticketing.refunds.manage')) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  if not public.can_access_event(t.event_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden_event');
  end if;
  if t.payment_status <> 'paid' then
    return jsonb_build_object('ok', false, 'error', 'only a paid ticket can be refunded');
  end if;
  update public.event_tickets
  set payment_status = 'refunded',
      ticket_status = 'revoked',
      entry_status = 'unused',
      verified_at = null,
      verified_by = null,
      verified_by_email = null,
      updated_at = now()
  where id = t.id
  returning * into t;
  return jsonb_build_object('ok', true, 'code', t.code, 'payment_status', t.payment_status);
end;
$$;

revoke all on function public.verify_ticket_entry(text) from public;
revoke all on function public.ticket_status_for(text) from public;
revoke all on function public.set_ticket_status(text, text) from public;
revoke all on function public.refund_ticket(text) from public;
grant execute on function public.verify_ticket_entry(text) to authenticated, service_role;
grant execute on function public.ticket_status_for(text) to authenticated, service_role;
grant execute on function public.set_ticket_status(text, text) to authenticated, service_role;
grant execute on function public.refund_ticket(text) to authenticated, service_role;

-- ===== 5. ORGANIZER APPOINTMENT + REVENUE SEPARATION =====

-- Only the founder can appoint a director for a ticket section, exactly as the
-- brief requires. Writes the product's organizer and commission rate.
create or replace function public.assign_event_organizer(p_event_id text, p_staff_id text, p_commission_rate numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_data jsonb;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'founder only');
  end if;
  if p_staff_id is not null and not exists (select 1 from public.staff_roles where id = p_staff_id) then
    return jsonb_build_object('ok', false, 'error', 'unknown staff id');
  end if;
  update public.products
  set data = data
      || jsonb_build_object(
           'organizer_staff_id', p_staff_id,
           'commission_rate', coalesce(p_commission_rate, 0),
           'updated_at', now()
         ),
      updated_at = now()
  where id = p_event_id and coalesce(category, '') = 'tickets';
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no such ticket product');
  end if;
  select data into v_data from public.products where id = p_event_id;
  return jsonb_build_object('ok', true, 'data', v_data);
end;
$$;

revoke all on function public.assign_event_organizer(text, text, numeric) from public;
grant execute on function public.assign_event_organizer(text, text, numeric) to authenticated, service_role;

-- Ticket sales sit in their own columns, never folded into the clothing
-- ledger. gross, processing fee, refund, organizer share, NYNTH commission.
alter table public.orders
  add column if not exists sales_channel text not null default 'store'
    check (sales_channel in ('store','tickets','mixed')),
  add column if not exists organizer_staff_id text,
  add column if not exists commission_rate numeric not null default 0,
  add column if not exists payment_fee numeric not null default 0,
  add column if not exists refunded_amount numeric not null default 0,
  add column if not exists nynth_commission numeric not null default 0,
  add column if not exists organizer_net numeric not null default 0;

update public.orders o
set sales_channel = 'tickets'
where exists (
  select 1 from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) i
  where lower(coalesce(i ->> 'category', '')) = 'tickets'
)
and not exists (
  select 1 from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) i
  where lower(coalesce(i ->> 'category', '')) <> 'tickets'
);

update public.orders o
set sales_channel = 'mixed'
where exists (
  select 1 from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) i
  where lower(coalesce(i ->> 'category', '')) = 'tickets'
)
and exists (
  select 1 from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) i
  where lower(coalesce(i ->> 'category', '')) <> 'tickets'
);

-- Money columns are service_role and founder-functions only. A browser client
-- cannot write a commission or a refund amount, whatever it sends.
revoke update (sales_channel, organizer_staff_id, commission_rate, payment_fee,
               refunded_amount, nynth_commission, organizer_net)
  on public.orders from anon, authenticated;

-- Per-event ticket money, scoped by RLS through the security_invoker view.
create or replace view public.event_finance
with (security_invoker = true)
as
select
  t.event_id,
  max(t.event_title) as event_title,
  max(t.organizer_staff_id) as organizer_staff_id,
  count(*) filter (where t.payment_status = 'paid') as tickets_sold,
  count(*) filter (where t.entry_status = 'used') as tickets_used,
  coalesce(sum(t.amount) filter (where t.payment_status = 'paid'), 0) as gross_collected,
  coalesce(sum(t.amount) filter (where t.payment_status = 'refunded'), 0) as refunded,
  coalesce(sum(t.payment_fee) filter (where t.payment_status = 'paid'), 0) as payment_fees,
  coalesce(sum(t.nynth_commission) filter (where t.payment_status = 'paid'), 0) as nynth_commission,
  coalesce(sum(t.organizer_share) filter (where t.payment_status = 'paid'), 0) as organizer_share
from public.event_tickets t
where t.is_test = false
group by t.event_id;

grant select on public.event_finance to authenticated;

-- ===== 6. RLS: PERMISSIONS AND SCOPING ENFORCED SERVER SIDE =====

drop policy if exists "users_self_read" on public.users;
create policy "users_self_read" on public.users for select
  using (auth.uid()::text = id or public.is_admin());
drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users for update
  using (auth.uid()::text = id or public.is_admin())
  with check (auth.uid()::text = id or public.is_admin());

drop policy if exists "orders_owner_read" on public.orders;
create policy "orders_owner_read" on public.orders for select
  using (
    public.is_admin()
    or auth.uid()::text = user_id
    or (public.has_permission('store.orders.view') and sales_channel <> 'tickets')
    or (public.has_permission('ticketing.orders.view') and public.order_touches_my_events(items))
  );

drop policy if exists "orders_admin_write" on public.orders;
create policy "orders_admin_write" on public.orders for update
  using (public.is_admin() or public.has_permission('store.orders.manage'))
  with check (public.is_admin() or public.has_permission('store.orders.manage'));

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders for delete using (public.is_admin());

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products for all
  using (
    public.is_admin()
    or (
      public.has_permission('ticketing.events.edit')
      and coalesce(category, '') = 'tickets'
      and public.can_access_event(id)
    )
    or (public.has_permission('store.products.manage') and coalesce(category, '') <> 'tickets')
  )
  with check (
    public.is_admin()
    or (
      public.has_permission('ticketing.events.edit')
      and coalesce(category, '') = 'tickets'
      and public.can_access_event(id)
    )
    or (public.has_permission('store.products.manage') and coalesce(category, '') <> 'tickets')
  );

drop policy if exists "discount_admin_all" on public.discount_codes;
create policy "discount_admin_all" on public.discount_codes for all
  using (public.is_admin() or public.has_permission('store.discounts.manage'))
  with check (public.is_admin() or public.has_permission('store.discounts.manage'));
drop policy if exists "discount_view_any" on public.discount_codes;
create policy "discount_view_any" on public.discount_codes for select
  using (public.is_admin() or public.has_permission('store.discounts.view'));

drop policy if exists "subscribers_admin_read" on public.subscribers;
create policy "subscribers_admin_read" on public.subscribers for select
  using (public.is_admin() or public.has_permission('store.subscribers.view'));
drop policy if exists "subscribers_admin_write" on public.subscribers;
create policy "subscribers_admin_write" on public.subscribers for update
  using (public.is_admin() or public.has_permission('store.subscribers.manage'))
  with check (public.is_admin() or public.has_permission('store.subscribers.manage'));
drop policy if exists "subscribers_admin_delete" on public.subscribers;
create policy "subscribers_admin_delete" on public.subscribers for delete
  using (public.is_admin() or public.has_permission('store.subscribers.manage'));

drop policy if exists "contact_admin_all" on public.contact_messages;
create policy "contact_admin_all" on public.contact_messages for select
  using (public.is_admin() or public.has_permission('store.customers.view'));

drop policy if exists "lookbooks_admin_write" on public.lookbooks;
create policy "lookbooks_admin_write" on public.lookbooks for all
  using (public.is_admin() or public.has_permission('store.lookbooks.manage'))
  with check (public.is_admin() or public.has_permission('store.lookbooks.manage'));
drop policy if exists "lookbooks_view_any" on public.lookbooks;
create policy "lookbooks_view_any" on public.lookbooks for select
  using (public.is_admin() or public.has_permission('store.lookbooks.view'));

drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings for all
  using (public.is_admin() or public.has_permission('store.settings.manage'))
  with check (public.is_admin() or public.has_permission('store.settings.manage'));

drop policy if exists "analytics_admin_read" on public.analytics_counters;
create policy "analytics_admin_read" on public.analytics_counters for select
  using (public.is_admin() or public.has_permission('store.carts.view'));

-- presence keeps its existing read policy: the external admin tool may read it.

-- ===== 7. LANDING SPLIT IMAGES =====

-- The landing page is two boxes. Their images are data, so Newman swaps them
-- from the admin panel without a deploy.
insert into public.settings (id, data)
values ('site_config', '{"landing": {"enabled": true}}'::jsonb)
on conflict (id) do update
set data = jsonb_set(
  coalesce(public.settings.data, '{}'::jsonb),
  '{landing}',
  coalesce(public.settings.data -> 'landing', '{}'::jsonb) || '{"enabled": true}'::jsonb,
  true
);
-- Merged, not replaced: re-running this migration never wipes an image the
-- founder has already uploaded from the admin panel.
