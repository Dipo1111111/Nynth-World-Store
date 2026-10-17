-- Restore the test-ticket gate at the door.
--
-- The Check-In rewrite (commit 345beca) replaced the client-side isTest check
-- with verify_ticket_entry(), but the function itself did not carry the rule
-- over. A Paystack test ticket could therefore be admitted, where before the
-- rewrite the desk showed "Test code, not a live ticket" and offered no admit
-- button. Every ticket in the database right now is test traffic, so this was
-- wide open, not theoretical.
--
-- Fixed in the database, not the UI, so a direct RPC call is covered too.

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
  select * into t from public.event_tickets where code = upper(trim(p_code)) for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if not (public.is_admin() or public.has_permission('ticketing.verify')) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if not public.can_access_event(t.event_id) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden_event');
  end if;
  -- A test ticket is not a real admission. Checked before payment so the door
  -- never reports it as payable.
  if t.is_test then
    return jsonb_build_object(
      'ok', false, 'reason', 'test', 'event_title', t.event_title,
      'ticket_type', t.ticket_type, 'holder_name', t.holder_name,
      'order_id', t.order_id, 'code', t.code);
  end if;
  if t.payment_status <> 'paid' then
    return jsonb_build_object(
      'ok', false, 'reason', 'not_paid', 'payment_status', t.payment_status,
      'event_title', t.event_title, 'event_date_time', t.event_date_time,
      'ticket_type', t.ticket_type, 'holder_name', t.holder_name,
      'order_id', t.order_id, 'code', t.code);
  end if;
  if t.ticket_status <> 'valid' then
    return jsonb_build_object(
      'ok', false, 'reason', t.ticket_status,
      'event_title', t.event_title, 'ticket_type', t.ticket_type,
      'holder_name', t.holder_name, 'order_id', t.order_id, 'code', t.code);
  end if;
  if t.entry_status = 'used' then
    return jsonb_build_object(
      'ok', false, 'reason', 'already_used', 'verified_at', t.verified_at,
      'verified_by', t.verified_by_email, 'event_title', t.event_title,
      'ticket_type', t.ticket_type, 'holder_name', t.holder_name,
      'order_id', t.order_id, 'code', t.code);
  end if;
  update public.event_tickets
  set entry_status = 'used', verified_at = now(),
      verified_by = auth.uid()::text, verified_by_email = v_actor_email,
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
    'verified_by', t.verified_by_email);
end;
$$;

-- The read-only door lookup reports the flag too, so the desk can label a code
-- as test before anybody presses anything.
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
    'order_id', t.order_id, 'is_test', t.is_test);
end;
$$;

revoke all on function public.verify_ticket_entry(text) from public;
revoke all on function public.ticket_status_for(text) from public;
grant execute on function public.verify_ticket_entry(text) to authenticated, service_role;
grant execute on function public.ticket_status_for(text) to authenticated, service_role;
