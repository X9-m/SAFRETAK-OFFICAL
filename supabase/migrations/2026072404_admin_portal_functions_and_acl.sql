begin;

create or replace function public.admin_update_office(p_session_token text, p_office_id uuid, p_is_approved boolean, p_is_active boolean, p_plan text)
returns void language plpgsql security definer set search_path='' as $$
declare v_user public.phone_users%rowtype;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  if p_plan not in ('Free','Basic','Premium') then raise exception 'INVALID_PLAN' using errcode='P0001'; end if;
  update public.travel_offices set is_approved=coalesce(p_is_approved,is_approved),is_active=coalesce(p_is_active,is_active),subscription_plan=p_plan::public.subscription_plan,updated_at=now() where id=p_office_id;
  if not found then raise exception 'OFFICE_NOT_FOUND' using errcode='P0001'; end if;
end; $$;

create or replace function public.admin_update_user(p_session_token text, p_user_id uuid, p_is_active boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v_user public.phone_users%rowtype;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  if p_user_id=v_user.id and p_is_active=false then raise exception 'CANNOT_DISABLE_SELF' using errcode='P0001'; end if;
  update public.phone_users set is_active=coalesce(p_is_active,is_active),updated_at=now() where id=p_user_id;
  if not found then raise exception 'USER_NOT_FOUND' using errcode='P0001'; end if;
end; $$;

create or replace function public.admin_update_booking(p_session_token text, p_booking_id uuid, p_status text, p_payment_status text)
returns void language plpgsql security definer set search_path='' as $$
declare v_user public.phone_users%rowtype;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  if p_status not in ('Pending','Confirmed','Completed','Cancelled') or p_payment_status not in ('unpaid','paid') then raise exception 'INVALID_STATUS' using errcode='P0001'; end if;
  update public.bookings set status=p_status::public.booking_state,payment_status=p_payment_status::public.payment_state,updated_at=now() where id=p_booking_id;
  if not found then raise exception 'BOOKING_NOT_FOUND' using errcode='P0001'; end if;
end; $$;

create or replace function public.admin_resolve_complaint(p_session_token text, p_complaint_id uuid, p_status text, p_resolution text)
returns void language plpgsql security definer set search_path='' as $$
declare v_user public.phone_users%rowtype;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  if p_status not in ('Open','Resolved') then raise exception 'INVALID_STATUS' using errcode='P0001'; end if;
  update public.complaints set status=p_status::public.complaint_state,resolution=nullif(btrim(coalesce(p_resolution,'')),''),updated_at=now() where id=p_complaint_id;
  if not found then raise exception 'COMPLAINT_NOT_FOUND' using errcode='P0001'; end if;
end; $$;

create or replace function public.admin_update_settings(p_session_token text, p_commission numeric, p_maintenance boolean, p_support_phone text, p_support_email text)
returns void language plpgsql security definer set search_path='' as $$
declare v_user public.phone_users%rowtype;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  if p_commission<0 or p_commission>100 then raise exception 'INVALID_COMMISSION' using errcode='P0001'; end if;
  update public.platform_settings set commission_percentage=p_commission,maintenance_mode=coalesce(p_maintenance,false),support_phone=nullif(btrim(coalesce(p_support_phone,'')),''),support_email=nullif(btrim(coalesce(p_support_email,'')),'')::public.citext,updated_at=now() where id=1;
end; $$;

create or replace function public.admin_save_ad(p_session_token text, p_ad_id uuid, p_payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user public.phone_users%rowtype; v_id uuid; v_title text; v_image text;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  v_title:=btrim(coalesce(p_payload->>'title_ar','')); v_image:=btrim(coalesce(p_payload->>'image_url',''));
  if char_length(v_title)<2 or char_length(v_image)<8 then raise exception 'INVALID_AD' using errcode='P0001'; end if;
  if p_ad_id is null then
    insert into public.platform_ads(title_ar,title_en,image_url,link,is_active,sort_order,starts_at,ends_at)
    values(v_title,coalesce(p_payload->>'title_en',''),v_image,nullif(p_payload->>'link',''),coalesce((p_payload->>'is_active')::boolean,true),coalesce(nullif(p_payload->>'sort_order','')::integer,0),nullif(p_payload->>'starts_at','')::timestamptz,nullif(p_payload->>'ends_at','')::timestamptz) returning id into v_id;
  else
    update public.platform_ads set title_ar=v_title,title_en=coalesce(p_payload->>'title_en',''),image_url=v_image,link=nullif(p_payload->>'link',''),is_active=coalesce((p_payload->>'is_active')::boolean,true),sort_order=coalesce(nullif(p_payload->>'sort_order','')::integer,0),starts_at=nullif(p_payload->>'starts_at','')::timestamptz,ends_at=nullif(p_payload->>'ends_at','')::timestamptz,updated_at=now() where id=p_ad_id returning id into v_id;
    if v_id is null then raise exception 'AD_NOT_FOUND' using errcode='P0001'; end if;
  end if;
  return v_id;
end; $$;

create or replace function public.admin_save_category(p_session_token text, p_category_id uuid, p_payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user public.phone_users%rowtype; v_id uuid; v_ar text; v_en text; v_slug text;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  v_ar:=btrim(coalesce(p_payload->>'name_ar','')); v_en:=btrim(coalesce(p_payload->>'name_en','')); v_slug:=lower(btrim(coalesce(p_payload->>'slug','')));
  if char_length(v_ar)<2 or char_length(v_en)<2 or v_slug !~ '^[a-z0-9_\-]{2,80}$' then raise exception 'INVALID_CATEGORY' using errcode='P0001'; end if;
  if p_category_id is null then
    insert into public.service_categories(name_ar,name_en,slug,icon,sort_order,is_active) values(v_ar,v_en,v_slug,nullif(p_payload->>'icon',''),coalesce(nullif(p_payload->>'sort_order','')::integer,0),coalesce((p_payload->>'is_active')::boolean,true)) returning id into v_id;
  else
    update public.service_categories set name_ar=v_ar,name_en=v_en,slug=v_slug,icon=nullif(p_payload->>'icon',''),sort_order=coalesce(nullif(p_payload->>'sort_order','')::integer,0),is_active=coalesce((p_payload->>'is_active')::boolean,true) where id=p_category_id returning id into v_id;
    if v_id is null then raise exception 'CATEGORY_NOT_FOUND' using errcode='P0001'; end if;
  end if;
  return v_id;
end; $$;

create or replace function public.admin_create_office(p_session_token text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_admin public.phone_users%rowtype; v_user_id uuid; v_office_id uuid; v_phone text; v_name text; v_plan text;
begin
  v_admin:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  v_phone:=public.normalize_jordan_phone(p_payload->>'phone'); v_name:=btrim(coalesce(p_payload->>'name','')); v_plan:=coalesce(nullif(p_payload->>'subscription_plan',''),'Free');
  if v_phone is null or char_length(v_name)<2 or char_length(v_name)>120 or v_plan not in ('Free','Basic','Premium') then raise exception 'INVALID_OFFICE' using errcode='P0001'; end if;
  if exists(select 1 from public.phone_users where phone=v_phone) then raise exception 'PHONE_EXISTS' using errcode='P0001'; end if;
  insert into public.phone_users(phone,full_name,role,is_active,language) values(v_phone,v_name,'office',true,'ar') returning id into v_user_id;
  insert into public.travel_offices(owner_id,phone_owner_id,name,location,description,license_number,is_approved,is_active,subscription_plan)
  values(null,v_user_id,v_name,nullif(p_payload->>'location',''),nullif(p_payload->>'description',''),nullif(p_payload->>'license_number',''),coalesce((p_payload->>'is_approved')::boolean,false),true,v_plan::public.subscription_plan)
  returning id into v_office_id;
  return jsonb_build_object('user_id',v_user_id,'office_id',v_office_id,'phone',v_phone);
end; $$;

create or replace function public.admin_update_service(p_session_token text, p_service_id uuid, p_is_active boolean, p_published boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v_user public.phone_users%rowtype;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  update public.services set
    is_active=coalesce(p_is_active,is_active),
    published_at=case when coalesce(p_published,published_at is not null) then coalesce(published_at,now()) else null end,
    updated_at=now()
  where id=p_service_id;
  if not found then raise exception 'SERVICE_NOT_FOUND' using errcode='P0001'; end if;
end; $$;

create or replace function public.admin_update_support(p_session_token text, p_request_id uuid, p_status text)
returns void language plpgsql security definer set search_path='' as $$
declare v_user public.phone_users%rowtype;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  if p_status not in ('open','in_progress','closed') then raise exception 'INVALID_STATUS' using errcode='P0001'; end if;
  update public.support_requests set status=p_status,updated_at=now() where id=p_request_id;
  if not found then raise exception 'REQUEST_NOT_FOUND' using errcode='P0001'; end if;
end; $$;

revoke all on function public.get_role_portal_snapshot(text) from public;
revoke all on function public.office_save_service(text,uuid,jsonb) from public;
revoke all on function public.office_update_booking(text,uuid,text,text) from public;
revoke all on function public.office_send_booking_message(text,uuid,text) from public;
revoke all on function public.office_save_employee(text,uuid,text,text,text,boolean) from public;
revoke all on function public.office_update_profile(text,jsonb) from public;
revoke all on function public.admin_update_office(text,uuid,boolean,boolean,text) from public;
revoke all on function public.admin_update_user(text,uuid,boolean) from public;
revoke all on function public.admin_update_booking(text,uuid,text,text) from public;
revoke all on function public.admin_resolve_complaint(text,uuid,text,text) from public;
revoke all on function public.admin_update_settings(text,numeric,boolean,text,text) from public;
revoke all on function public.admin_save_ad(text,uuid,jsonb) from public;
revoke all on function public.admin_save_category(text,uuid,jsonb) from public;
revoke all on function public.admin_create_office(text,jsonb) from public;
revoke all on function public.admin_update_service(text,uuid,boolean,boolean) from public;
revoke all on function public.admin_update_support(text,uuid,text) from public;

grant execute on function public.get_role_portal_snapshot(text) to anon, service_role;
grant execute on function public.office_save_service(text,uuid,jsonb) to anon, service_role;
grant execute on function public.office_update_booking(text,uuid,text,text) to anon, service_role;
grant execute on function public.office_send_booking_message(text,uuid,text) to anon, service_role;
grant execute on function public.office_save_employee(text,uuid,text,text,text,boolean) to anon, service_role;
grant execute on function public.office_update_profile(text,jsonb) to anon, service_role;
grant execute on function public.admin_update_office(text,uuid,boolean,boolean,text) to anon, service_role;
grant execute on function public.admin_update_user(text,uuid,boolean) to anon, service_role;
grant execute on function public.admin_update_booking(text,uuid,text,text) to anon, service_role;
grant execute on function public.admin_resolve_complaint(text,uuid,text,text) to anon, service_role;
grant execute on function public.admin_update_settings(text,numeric,boolean,text,text) to anon, service_role;
grant execute on function public.admin_save_ad(text,uuid,jsonb) to anon, service_role;
grant execute on function public.admin_save_category(text,uuid,jsonb) to anon, service_role;
grant execute on function public.admin_create_office(text,jsonb) to anon, service_role;
grant execute on function public.admin_update_service(text,uuid,boolean,boolean) to anon, service_role;
grant execute on function public.admin_update_support(text,uuid,text) to anon, service_role;

revoke execute on function public.get_role_portal_snapshot(text) from authenticated;
revoke execute on function public.office_save_service(text,uuid,jsonb) from authenticated;
revoke execute on function public.office_update_booking(text,uuid,text,text) from authenticated;
revoke execute on function public.office_send_booking_message(text,uuid,text) from authenticated;
revoke execute on function public.office_save_employee(text,uuid,text,text,text,boolean) from authenticated;
revoke execute on function public.office_update_profile(text,jsonb) from authenticated;
revoke execute on function public.admin_update_office(text,uuid,boolean,boolean,text) from authenticated;
revoke execute on function public.admin_update_user(text,uuid,boolean) from authenticated;
revoke execute on function public.admin_update_booking(text,uuid,text,text) from authenticated;
revoke execute on function public.admin_resolve_complaint(text,uuid,text,text) from authenticated;
revoke execute on function public.admin_update_settings(text,numeric,boolean,text,text) from authenticated;
revoke execute on function public.admin_save_ad(text,uuid,jsonb) from authenticated;
revoke execute on function public.admin_save_category(text,uuid,jsonb) from authenticated;
revoke execute on function public.admin_create_office(text,jsonb) from authenticated;
revoke execute on function public.admin_update_service(text,uuid,boolean,boolean) from authenticated;
revoke execute on function public.admin_update_support(text,uuid,text) from authenticated;

create index if not exists phone_favorites_service_idx on public.phone_favorites(service_id);
create index if not exists phone_service_reviews_user_idx on public.phone_service_reviews(user_id);

commit;
