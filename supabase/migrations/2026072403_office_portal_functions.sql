begin;

create or replace function public.office_save_service(p_session_token text, p_service_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.phone_users%rowtype;
  v_office_id uuid;
  v_id uuid;
  v_type text;
  v_title text;
  v_price numeric;
  v_category_id uuid;
  v_images text[];
  v_included text[];
  v_dates date[];
  v_active boolean;
  v_published boolean;
begin
  v_user:=private.role_session_user(p_session_token,array['office']::public.app_role[]);
  select o.id into v_office_id from public.travel_offices o where o.phone_owner_id=v_user.id or o.owner_id=v_user.id limit 1;
  if v_office_id is null then raise exception 'OFFICE_NOT_FOUND' using errcode='P0001'; end if;
  v_type:=btrim(coalesce(p_payload->>'type',''));
  if v_type not in ('trip','intl_trip','hotel','car','flight','bus_train','hajj_umrah','insurance','visa','consultation') then raise exception 'INVALID_SERVICE_TYPE' using errcode='P0001'; end if;
  v_title:=btrim(coalesce(p_payload->>'title',''));
  if char_length(v_title)<2 or char_length(v_title)>160 then raise exception 'INVALID_TITLE' using errcode='P0001'; end if;
  begin v_price:=coalesce(nullif(p_payload->>'price','')::numeric,0); exception when others then raise exception 'INVALID_PRICE' using errcode='P0001'; end;
  if v_price<0 then raise exception 'INVALID_PRICE' using errcode='P0001'; end if;
  begin v_category_id:=nullif(p_payload->>'category_id','')::uuid; exception when others then v_category_id:=null; end;
  if v_category_id is null then select c.id into v_category_id from public.service_categories c where c.slug=v_type limit 1; end if;
  select coalesce(array_agg(value),array[]::text[]) into v_images from jsonb_array_elements_text(case when jsonb_typeof(p_payload->'images')='array' then p_payload->'images' else '[]'::jsonb end) as items(value);
  select coalesce(array_agg(value),array[]::text[]) into v_included from jsonb_array_elements_text(case when jsonb_typeof(p_payload->'included')='array' then p_payload->'included' else '[]'::jsonb end) as items(value);
  begin
    select coalesce(array_agg(value::date),array[]::date[]) into v_dates from jsonb_array_elements_text(case when jsonb_typeof(p_payload->'available_dates')='array' then p_payload->'available_dates' else '[]'::jsonb end) as items(value);
  exception when others then raise exception 'INVALID_DATES' using errcode='P0001'; end;
  begin v_active:=coalesce((p_payload->>'is_active')::boolean,true); exception when others then v_active:=true; end;
  begin v_published:=coalesce((p_payload->>'published')::boolean,true); exception when others then v_published:=true; end;

  if p_service_id is null then
    insert into public.services(office_id,category_id,type,title,description,price,rating,image_url,images,location,terms,cancellation_policy,available_dates,duration,seats_remaining,itinerary,included,details,is_active,published_at)
    values(v_office_id,v_category_id,v_type::public.service_kind,v_title,coalesce(p_payload->>'description',''),v_price,0,nullif(p_payload->>'image_url',''),v_images,nullif(p_payload->>'location',''),nullif(p_payload->>'terms',''),nullif(p_payload->>'cancellation_policy',''),v_dates,nullif(p_payload->>'duration',''),case when nullif(p_payload->>'seats_remaining','') is null then null else (p_payload->>'seats_remaining')::integer end,case when jsonb_typeof(p_payload->'itinerary')='array' then p_payload->'itinerary' else '[]'::jsonb end,v_included,case when jsonb_typeof(p_payload->'details')='object' then p_payload->'details' else '{}'::jsonb end,v_active,case when v_published then now() else null end)
    returning id into v_id;
  else
    update public.services s set
      category_id=v_category_id,type=v_type::public.service_kind,title=v_title,description=coalesce(p_payload->>'description',''),price=v_price,
      image_url=nullif(p_payload->>'image_url',''),images=v_images,location=nullif(p_payload->>'location',''),terms=nullif(p_payload->>'terms',''),
      cancellation_policy=nullif(p_payload->>'cancellation_policy',''),available_dates=v_dates,duration=nullif(p_payload->>'duration',''),
      seats_remaining=case when nullif(p_payload->>'seats_remaining','') is null then null else (p_payload->>'seats_remaining')::integer end,
      itinerary=case when jsonb_typeof(p_payload->'itinerary')='array' then p_payload->'itinerary' else '[]'::jsonb end,
      included=v_included,details=case when jsonb_typeof(p_payload->'details')='object' then p_payload->'details' else '{}'::jsonb end,
      is_active=v_active,published_at=case when v_published then coalesce(s.published_at,now()) else null end,updated_at=now()
    where s.id=p_service_id and s.office_id=v_office_id returning s.id into v_id;
    if v_id is null then raise exception 'SERVICE_NOT_FOUND' using errcode='P0001'; end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.office_update_booking(p_session_token text, p_booking_id uuid, p_status text, p_payment_status text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user public.phone_users%rowtype; v_office_id uuid;
begin
  v_user:=private.role_session_user(p_session_token,array['office']::public.app_role[]);
  select o.id into v_office_id from public.travel_offices o where o.phone_owner_id=v_user.id or o.owner_id=v_user.id limit 1;
  if p_status not in ('Pending','Confirmed','Completed','Cancelled') then raise exception 'INVALID_STATUS' using errcode='P0001'; end if;
  if p_payment_status is not null and p_payment_status not in ('unpaid','paid') then raise exception 'INVALID_PAYMENT_STATUS' using errcode='P0001'; end if;
  update public.bookings b set status=p_status::public.booking_state,payment_status=coalesce(p_payment_status::public.payment_state,b.payment_status),updated_at=now()
  where b.id=p_booking_id and b.office_id=v_office_id;
  if not found then raise exception 'BOOKING_NOT_FOUND' using errcode='P0001'; end if;
end;
$$;

create or replace function public.office_send_booking_message(p_session_token text, p_booking_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_user public.phone_users%rowtype; v_office_id uuid; v_id uuid; v_body text;
begin
  v_user:=private.role_session_user(p_session_token,array['office']::public.app_role[]);
  select o.id into v_office_id from public.travel_offices o where o.phone_owner_id=v_user.id or o.owner_id=v_user.id limit 1;
  v_body:=btrim(coalesce(p_body,'')); if char_length(v_body)<1 or char_length(v_body)>1500 then raise exception 'INVALID_MESSAGE' using errcode='P0001'; end if;
  if not exists(select 1 from public.bookings b where b.id=p_booking_id and b.office_id=v_office_id) then raise exception 'BOOKING_NOT_FOUND' using errcode='P0001'; end if;
  insert into public.booking_messages(booking_id,phone_user_id,sender,body) values(p_booking_id,v_user.id,'office',v_body) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.office_save_employee(p_session_token text, p_employee_id uuid, p_full_name text, p_job_title text, p_permission_level text, p_is_active boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_user public.phone_users%rowtype; v_office_id uuid; v_id uuid; v_name text; v_title text;
begin
  v_user:=private.role_session_user(p_session_token,array['office']::public.app_role[]);
  select o.id into v_office_id from public.travel_offices o where o.phone_owner_id=v_user.id or o.owner_id=v_user.id limit 1;
  v_name:=btrim(coalesce(p_full_name,'')); v_title:=btrim(coalesce(p_job_title,''));
  if char_length(v_name)<2 or char_length(v_name)>100 or char_length(v_title)<2 or char_length(v_title)>100 then raise exception 'INVALID_EMPLOYEE' using errcode='P0001'; end if;
  if p_employee_id is null then
    insert into public.office_employees(office_id,full_name,job_title,permission_level,is_active) values(v_office_id,v_name,v_title,left(coalesce(nullif(btrim(p_permission_level),''),'Edit Bookings'),80),coalesce(p_is_active,true)) returning id into v_id;
  else
    update public.office_employees e set full_name=v_name,job_title=v_title,permission_level=left(coalesce(nullif(btrim(p_permission_level),''),'Edit Bookings'),80),is_active=coalesce(p_is_active,true),updated_at=now()
    where e.id=p_employee_id and e.office_id=v_office_id returning e.id into v_id;
    if v_id is null then raise exception 'EMPLOYEE_NOT_FOUND' using errcode='P0001'; end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.office_update_profile(p_session_token text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user public.phone_users%rowtype; v_office_id uuid; v_name text;
begin
  v_user:=private.role_session_user(p_session_token,array['office']::public.app_role[]);
  select o.id into v_office_id from public.travel_offices o where o.phone_owner_id=v_user.id or o.owner_id=v_user.id limit 1;
  v_name:=btrim(coalesce(p_payload->>'name','')); if char_length(v_name)<2 or char_length(v_name)>120 then raise exception 'INVALID_NAME' using errcode='P0001'; end if;
  update public.travel_offices set name=v_name,location=nullif(p_payload->>'location',''),description=nullif(p_payload->>'description',''),logo_url=nullif(p_payload->>'logo_url',''),cover_url=nullif(p_payload->>'cover_url',''),license_number=coalesce(nullif(p_payload->>'license_number',''),license_number),updated_at=now() where id=v_office_id;
  update public.phone_users set full_name=v_name,updated_at=now() where id=v_user.id;
end;
$$;

commit;
