begin;

create or replace function public.get_public_payment_methods()
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select coalesce(
    (select jsonb_agg(method order by sort_order) from (
      select key as method,case key when 'CliQ' then 1 when 'eFAWATEERcom' then 2 else 3 end sort_order
      from public.platform_settings s,jsonb_each_text(s.payment_methods)
      where s.id=1 and value='true'
    ) enabled),
    '[]'::jsonb
  )
$$;

create or replace function public.get_office_business_snapshot(p_session_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare v_user public.phone_users%rowtype; v_office_id uuid; v_result jsonb;
begin
  v_user:=private.role_session_user(p_session_token,array['office']::public.app_role[]);
  select o.id into v_office_id from public.travel_offices o where o.phone_owner_id=v_user.id or o.owner_id=v_user.id limit 1;
  if v_office_id is null then raise exception 'OFFICE_NOT_FOUND' using errcode='P0001'; end if;
  select jsonb_build_object(
    'customers',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',coalesce(c.user_id::text,c.phone),'user_id',c.user_id,'name',c.name,'phone',c.phone,'email',u.email,
        'booking_count',c.booking_count,'total_spent',c.total_spent,'last_booking_at',c.last_booking_at,
        'bookings',coalesce((select jsonb_agg(to_jsonb(b2) order by b2.created_at desc) from public.bookings b2 where b2.office_id=v_office_id and ((c.user_id is not null and b2.phone_user_id=c.user_id) or (c.user_id is null and b2.phone_user_id is null and b2.traveler_phone=c.phone))),'[]'::jsonb)
      ) order by c.last_booking_at desc)
      from (
        select b.phone_user_id user_id,max(b.traveler_name) name,b.traveler_phone phone,count(*) booking_count,
          coalesce(sum(case when b.payment_status='paid' and b.status<>'Cancelled' then b.total_price else 0 end),0) total_spent,
          max(b.created_at) last_booking_at
        from public.bookings b where b.office_id=v_office_id group by b.phone_user_id,b.traveler_phone
      ) c left join public.phone_users u on u.id=c.user_id
    ),'[]'::jsonb),
    'transactions',coalesce((select jsonb_agg(to_jsonb(t) order by t.transaction_date desc,t.created_at desc) from public.office_transactions t where t.office_id=v_office_id),'[]'::jsonb),
    'stats',jsonb_build_object(
      'income',coalesce((select sum(amount) from public.office_transactions where office_id=v_office_id and transaction_type='income'),0),
      'expenses',coalesce((select sum(amount) from public.office_transactions where office_id=v_office_id and transaction_type='expense'),0),
      'booking_revenue',coalesce((select sum(total_price) from public.bookings where office_id=v_office_id and payment_status='paid' and status<>'Cancelled'),0),
      'customers',(select count(*) from (select phone_user_id,traveler_phone from public.bookings where office_id=v_office_id group by phone_user_id,traveler_phone) x)
    )
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.office_save_transaction(p_session_token text,p_transaction_id uuid,p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare v_user public.phone_users%rowtype; v_office_id uuid; v_id uuid; v_type text; v_category text; v_description text; v_amount numeric; v_date date; v_reference text;
begin
  v_user:=private.role_session_user(p_session_token,array['office']::public.app_role[]);
  select o.id into v_office_id from public.travel_offices o where o.phone_owner_id=v_user.id or o.owner_id=v_user.id limit 1;
  v_type:=lower(btrim(coalesce(p_payload->>'transaction_type',''))); v_category:=btrim(coalesce(p_payload->>'category','')); v_description:=btrim(coalesce(p_payload->>'description','')); v_reference:=nullif(btrim(coalesce(p_payload->>'reference','')),'');
  begin v_amount:=(p_payload->>'amount')::numeric; v_date:=coalesce(nullif(p_payload->>'transaction_date','')::date,(now() at time zone 'Asia/Amman')::date); exception when others then raise exception 'INVALID_TRANSACTION' using errcode='P0001'; end;
  if v_type not in ('income','expense') or char_length(v_category)<2 or char_length(v_category)>80 or char_length(v_description)<2 or char_length(v_description)>500 or v_amount<=0 or v_amount>1000000 or v_date>(now() at time zone 'Asia/Amman')::date+1 then raise exception 'INVALID_TRANSACTION' using errcode='P0001'; end if;
  if p_transaction_id is null then
    insert into public.office_transactions(office_id,created_by,transaction_type,category,description,amount,transaction_date,reference)
    values(v_office_id,v_user.id,v_type,v_category,v_description,v_amount,v_date,left(v_reference,100)) returning id into v_id;
  else
    update public.office_transactions set transaction_type=v_type,category=v_category,description=v_description,amount=v_amount,transaction_date=v_date,reference=left(v_reference,100),updated_at=now()
    where id=p_transaction_id and office_id=v_office_id returning id into v_id;
    if v_id is null then raise exception 'TRANSACTION_NOT_FOUND' using errcode='P0001'; end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.office_delete_transaction(p_session_token text,p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_user public.phone_users%rowtype; v_office_id uuid;
begin
  v_user:=private.role_session_user(p_session_token,array['office']::public.app_role[]);
  select o.id into v_office_id from public.travel_offices o where o.phone_owner_id=v_user.id or o.owner_id=v_user.id limit 1;
  delete from public.office_transactions where id=p_transaction_id and office_id=v_office_id;
  if not found then raise exception 'TRANSACTION_NOT_FOUND' using errcode='P0001'; end if;
end;
$$;

revoke all on function public.get_public_payment_methods() from public;
revoke all on function public.get_office_business_snapshot(text) from public;
revoke all on function public.office_save_transaction(text,uuid,jsonb) from public;
revoke all on function public.office_delete_transaction(text,uuid) from public;
grant execute on function public.get_public_payment_methods() to anon,authenticated,service_role;
grant execute on function public.get_office_business_snapshot(text) to anon,service_role;
grant execute on function public.office_save_transaction(text,uuid,jsonb) to anon,service_role;
grant execute on function public.office_delete_transaction(text,uuid) to anon,service_role;
revoke execute on function public.get_office_business_snapshot(text) from authenticated;
revoke execute on function public.office_save_transaction(text,uuid,jsonb) from authenticated;
revoke execute on function public.office_delete_transaction(text,uuid) from authenticated;

commit;
