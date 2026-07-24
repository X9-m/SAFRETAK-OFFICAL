begin;

create or replace function private.guard_booking_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_role_portal_scope text := current_setting('safretak.role_portal_booking_update', true);
begin
  if v_role_portal_scope in ('office', 'admin') then
    if new.id is distinct from old.id
      or new.reference_code is distinct from old.reference_code
      or new.service_id is distinct from old.service_id
      or new.office_id is distinct from old.office_id
      or new.traveler_id is distinct from old.traveler_id
      or new.service_type is distinct from old.service_type
      or new.service_name is distinct from old.service_name
      or new.office_name is distinct from old.office_name
      or new.traveler_name is distinct from old.traveler_name
      or new.traveler_phone is distinct from old.traveler_phone
      or new.booking_details is distinct from old.booking_details
      or new.total_price is distinct from old.total_price
      or new.payment_method is distinct from old.payment_method
      or new.qr_code is distinct from old.qr_code
      or new.invoice_url is distinct from old.invoice_url
      or new.created_at is distinct from old.created_at then
      raise exception 'ROLE_PORTAL_UPDATE_NOT_ALLOWED';
    end if;
    new.updated_at := now();
    return new;
  end if;

  if private.is_admin() then
    new.updated_at := now();
    return new;
  end if;

  if private.owns_office(old.office_id) then
    if new.id is distinct from old.id
      or new.reference_code is distinct from old.reference_code
      or new.service_id is distinct from old.service_id
      or new.office_id is distinct from old.office_id
      or new.traveler_id is distinct from old.traveler_id
      or new.service_type is distinct from old.service_type
      or new.service_name is distinct from old.service_name
      or new.office_name is distinct from old.office_name
      or new.traveler_name is distinct from old.traveler_name
      or new.traveler_phone is distinct from old.traveler_phone
      or new.booking_details is distinct from old.booking_details
      or new.total_price is distinct from old.total_price
      or new.payment_method is distinct from old.payment_method
      or new.created_at is distinct from old.created_at then
      raise exception 'OFFICE_UPDATE_NOT_ALLOWED';
    end if;
    new.updated_at := now();
    return new;
  end if;

  if old.traveler_id = auth.uid() then
    if new.id is distinct from old.id
      or new.reference_code is distinct from old.reference_code
      or new.service_id is distinct from old.service_id
      or new.office_id is distinct from old.office_id
      or new.traveler_id is distinct from old.traveler_id
      or new.service_type is distinct from old.service_type
      or new.service_name is distinct from old.service_name
      or new.office_name is distinct from old.office_name
      or new.traveler_name is distinct from old.traveler_name
      or new.traveler_phone is distinct from old.traveler_phone
      or new.booking_details is distinct from old.booking_details
      or new.total_price is distinct from old.total_price
      or new.payment_method is distinct from old.payment_method
      or new.payment_status is distinct from old.payment_status
      or new.qr_code is distinct from old.qr_code
      or new.invoice_url is distinct from old.invoice_url
      or new.created_at is distinct from old.created_at then
      raise exception 'TRAVELER_UPDATE_NOT_ALLOWED';
    end if;
    if new.status is distinct from old.status
      and not (new.status = 'Cancelled' and old.status in ('Pending', 'Confirmed')) then
      raise exception 'INVALID_TRAVELER_STATUS_CHANGE';
    end if;
    new.updated_at := now();
    return new;
  end if;

  raise exception 'BOOKING_UPDATE_NOT_ALLOWED';
end;
$$;

create or replace function public.office_update_booking(
  p_session_token text,
  p_booking_id uuid,
  p_status text,
  p_payment_status text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.phone_users%rowtype;
  v_office_id uuid;
begin
  v_user := private.role_session_user(p_session_token, array['office']::public.app_role[]);
  select o.id into v_office_id
  from public.travel_offices o
  where o.phone_owner_id = v_user.id or o.owner_id = v_user.id
  limit 1;

  if p_status not in ('Pending', 'Confirmed', 'Completed', 'Cancelled') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;
  if p_payment_status is not null and p_payment_status not in ('unpaid', 'paid') then
    raise exception 'INVALID_PAYMENT_STATUS' using errcode = 'P0001';
  end if;

  perform set_config('safretak.role_portal_booking_update', 'office', true);
  update public.bookings b
  set status = p_status::public.booking_state,
      payment_status = coalesce(p_payment_status::public.payment_state, b.payment_status),
      updated_at = now()
  where b.id = p_booking_id and b.office_id = v_office_id;
  perform set_config('safretak.role_portal_booking_update', '', true);

  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.admin_update_booking(
  p_session_token text,
  p_booking_id uuid,
  p_status text,
  p_payment_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.phone_users%rowtype;
begin
  v_user := private.role_session_user(p_session_token, array['admin']::public.app_role[]);
  if p_status not in ('Pending', 'Confirmed', 'Completed', 'Cancelled')
    or p_payment_status not in ('unpaid', 'paid') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;

  perform set_config('safretak.role_portal_booking_update', 'admin', true);
  update public.bookings
  set status = p_status::public.booking_state,
      payment_status = p_payment_status::public.payment_state,
      updated_at = now()
  where id = p_booking_id;
  perform set_config('safretak.role_portal_booking_update', '', true);

  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

commit;
