begin;

create or replace function public.get_role_portal_snapshot(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.phone_users%rowtype;
  v_office public.travel_offices%rowtype;
  v_result jsonb;
begin
  v_user := private.role_session_user(p_session_token, array['office','admin']::public.app_role[]);

  if v_user.role='office' then
    select o.* into v_office
    from public.travel_offices o
    where o.phone_owner_id=v_user.id or o.owner_id=v_user.id
    order by (o.phone_owner_id=v_user.id) desc
    limit 1;
    if not found then raise exception 'OFFICE_NOT_FOUND' using errcode='P0001'; end if;

    select jsonb_build_object(
      'profile', jsonb_build_object('id',v_user.id,'full_name',v_user.full_name,'phone',v_user.phone,'email',v_user.email,'role',v_user.role,'language',v_user.language),
      'office', to_jsonb(v_office),
      'stats', jsonb_build_object(
        'services', (select count(*) from public.services s where s.office_id=v_office.id),
        'published_services', (select count(*) from public.services s where s.office_id=v_office.id and s.is_active and s.published_at is not null),
        'bookings', (select count(*) from public.bookings b where b.office_id=v_office.id),
        'pending_bookings', (select count(*) from public.bookings b where b.office_id=v_office.id and b.status='Pending'),
        'confirmed_bookings', (select count(*) from public.bookings b where b.office_id=v_office.id and b.status='Confirmed'),
        'revenue', (select coalesce(sum(b.total_price),0) from public.bookings b where b.office_id=v_office.id and b.payment_status='paid' and b.status<>'Cancelled'),
        'employees', (select count(*) from public.office_employees e where e.office_id=v_office.id and e.is_active)
      ),
      'categories', (select coalesce(jsonb_agg(to_jsonb(c) order by c.sort_order,c.name_ar),'[]'::jsonb) from public.service_categories c),
      'services', (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at desc),'[]'::jsonb) from public.services s where s.office_id=v_office.id),
      'bookings', (select coalesce(jsonb_agg(to_jsonb(b) order by b.created_at desc),'[]'::jsonb) from public.bookings b where b.office_id=v_office.id),
      'payments', (select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('reference_code',b.reference_code,'service_name',b.service_name) order by p.created_at desc),'[]'::jsonb) from public.payments p join public.bookings b on b.id=p.booking_id where b.office_id=v_office.id),
      'employees', (select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]'::jsonb) from public.office_employees e where e.office_id=v_office.id),
      'complaints', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at desc),'[]'::jsonb) from public.complaints c where c.office_id=v_office.id),
      'support_requests', (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc),'[]'::jsonb) from public.support_requests r where r.booking_id in (select b.id from public.bookings b where b.office_id=v_office.id)),
      'messages', (select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at desc),'[]'::jsonb) from public.booking_messages m where m.booking_id in (select b.id from public.bookings b where b.office_id=v_office.id))
    ) into v_result;
  else
    select jsonb_build_object(
      'profile', jsonb_build_object('id',v_user.id,'full_name',v_user.full_name,'phone',v_user.phone,'email',v_user.email,'role',v_user.role,'language',v_user.language),
      'stats', jsonb_build_object(
        'offices', (select count(*) from public.travel_offices),
        'approved_offices', (select count(*) from public.travel_offices where is_approved and is_active),
        'users', (select count(*) from public.phone_users),
        'travelers', (select count(*) from public.phone_users where role='traveler'),
        'services', (select count(*) from public.services),
        'published_services', (select count(*) from public.services where is_active and published_at is not null),
        'bookings', (select count(*) from public.bookings),
        'revenue', (select coalesce(sum(total_price),0) from public.bookings where payment_status='paid' and status<>'Cancelled'),
        'open_complaints', (select count(*) from public.complaints where status='Open'),
        'open_support', (select count(*) from public.support_requests where status<>'closed')
      ),
      'offices', (select coalesce(jsonb_agg(to_jsonb(o) order by o.created_at desc),'[]'::jsonb) from public.travel_offices o),
      'users', (select coalesce(jsonb_agg(jsonb_build_object('id',u.id,'full_name',u.full_name,'phone',u.phone,'email',u.email,'role',u.role,'is_active',u.is_active,'language',u.language,'created_at',u.created_at) order by u.created_at desc),'[]'::jsonb) from public.phone_users u),
      'services', (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at desc),'[]'::jsonb) from public.services s),
      'bookings', (select coalesce(jsonb_agg(to_jsonb(b) order by b.created_at desc),'[]'::jsonb) from public.bookings b),
      'payments', (select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc),'[]'::jsonb) from public.payments p),
      'complaints', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at desc),'[]'::jsonb) from public.complaints c),
      'support_requests', (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc),'[]'::jsonb) from public.support_requests r),
      'ads', (select coalesce(jsonb_agg(to_jsonb(a) order by a.sort_order,a.created_at desc),'[]'::jsonb) from public.platform_ads a),
      'categories', (select coalesce(jsonb_agg(to_jsonb(c) order by c.sort_order,c.name_ar),'[]'::jsonb) from public.service_categories c),
      'settings', (select to_jsonb(s) from public.platform_settings s where s.id=1)
    ) into v_result;
  end if;
  return v_result;
end;
$$;

commit;
