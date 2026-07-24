begin;

create or replace function public.get_admin_billing_snapshot(p_session_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare v_user public.phone_users%rowtype; v_settings public.platform_settings%rowtype; v_result jsonb;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  select * into v_settings from public.platform_settings where id=1;
  select jsonb_build_object(
    'settings',to_jsonb(v_settings),
    'offices',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',o.id,'name',o.name,'location',o.location,'subscription_plan',o.subscription_plan,
        'paid_revenue',coalesce(b.paid_revenue,0),'paid_bookings',coalesce(b.paid_bookings,0),
        'commission_due',round(coalesce(b.paid_revenue,0)*v_settings.commission_percentage/100+coalesce(b.paid_bookings,0)*v_settings.commission_flat,2),
        'settled',coalesce(s.settled,0),
        'outstanding',greatest(0,round(coalesce(b.paid_revenue,0)*v_settings.commission_percentage/100+coalesce(b.paid_bookings,0)*v_settings.commission_flat-coalesce(s.settled,0),2)),
        'bookings',coalesce((select jsonb_agg(jsonb_build_object('created_at',bk.created_at,'reference_code',bk.reference_code,'service_type',bk.service_type,'service_name',bk.service_name,'traveler_name',bk.traveler_name,'total_price',bk.total_price,'commission',round(bk.total_price*v_settings.commission_percentage/100+v_settings.commission_flat,2)) order by bk.created_at desc) from public.bookings bk where bk.office_id=o.id and bk.payment_status='paid' and bk.status<>'Cancelled'),'[]'::jsonb)
      ) order by greatest(0,round(coalesce(b.paid_revenue,0)*v_settings.commission_percentage/100+coalesce(b.paid_bookings,0)*v_settings.commission_flat-coalesce(s.settled,0),2)) desc,o.name)
      from public.travel_offices o
      left join lateral (select sum(total_price) paid_revenue,count(*) paid_bookings from public.bookings where office_id=o.id and payment_status='paid' and status<>'Cancelled') b on true
      left join lateral (select sum(amount) settled from public.platform_settlements where office_id=o.id) s on true
    ),'[]'::jsonb),
    'settlements',coalesce((select jsonb_agg(to_jsonb(ps)||jsonb_build_object('office_name',o.name) order by ps.settlement_date desc,ps.created_at desc) from public.platform_settlements ps join public.travel_offices o on o.id=ps.office_id),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.admin_save_settlement(p_session_token text,p_settlement_id uuid,p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare v_user public.phone_users%rowtype; v_settings public.platform_settings%rowtype; v_office_id uuid; v_id uuid; v_amount numeric; v_date date; v_note text; v_due numeric; v_settled numeric; v_outstanding numeric;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  begin v_office_id:=(p_payload->>'office_id')::uuid; v_amount:=(p_payload->>'amount')::numeric; v_date:=coalesce(nullif(p_payload->>'settlement_date','')::date,(now() at time zone 'Asia/Amman')::date); exception when others then raise exception 'INVALID_SETTLEMENT' using errcode='P0001'; end;
  v_note:=nullif(btrim(coalesce(p_payload->>'note','')),'');
  if not exists(select 1 from public.travel_offices where id=v_office_id) or v_amount<=0 or v_amount>1000000 or char_length(coalesce(v_note,''))>500 then raise exception 'INVALID_SETTLEMENT' using errcode='P0001'; end if;
  select * into v_settings from public.platform_settings where id=1;
  select round(coalesce(sum(total_price),0)*v_settings.commission_percentage/100+count(*)*v_settings.commission_flat,2) into v_due from public.bookings where office_id=v_office_id and payment_status='paid' and status<>'Cancelled';
  select coalesce(sum(amount),0) into v_settled from public.platform_settlements where office_id=v_office_id and (p_settlement_id is null or id<>p_settlement_id);
  v_outstanding:=greatest(0,v_due-v_settled);
  if v_amount>v_outstanding+0.01 then raise exception 'SETTLEMENT_EXCEEDS_DUE' using errcode='P0001'; end if;
  if p_settlement_id is null then
    insert into public.platform_settlements(office_id,created_by,amount,settlement_date,note) values(v_office_id,v_user.id,v_amount,v_date,v_note) returning id into v_id;
  else
    update public.platform_settlements set amount=v_amount,settlement_date=v_date,note=v_note where id=p_settlement_id and office_id=v_office_id returning id into v_id;
    if v_id is null then raise exception 'SETTLEMENT_NOT_FOUND' using errcode='P0001'; end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_delete_settlement(p_session_token text,p_settlement_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_user public.phone_users%rowtype;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  delete from public.platform_settlements where id=p_settlement_id;
  if not found then raise exception 'SETTLEMENT_NOT_FOUND' using errcode='P0001'; end if;
end;
$$;

create or replace function public.admin_update_finance_settings(p_session_token text,p_commission_percentage numeric,p_commission_flat numeric,p_cliq boolean,p_efawateercom boolean,p_cash boolean)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_user public.phone_users%rowtype;
begin
  v_user:=private.role_session_user(p_session_token,array['admin']::public.app_role[]);
  if p_commission_percentage<0 or p_commission_percentage>100 or p_commission_flat<0 or p_commission_flat>10000 or not(coalesce(p_cliq,false) or coalesce(p_efawateercom,false) or coalesce(p_cash,false)) then raise exception 'INVALID_FINANCE_SETTINGS' using errcode='P0001'; end if;
  update public.platform_settings set commission_percentage=p_commission_percentage,commission_flat=p_commission_flat,payment_methods=jsonb_build_object('CliQ',coalesce(p_cliq,false),'eFAWATEERcom',coalesce(p_efawateercom,false),'Cash at Office',coalesce(p_cash,false)),updated_at=now() where id=1;
end;
$$;

revoke all on function public.get_admin_billing_snapshot(text) from public;
revoke all on function public.admin_save_settlement(text,uuid,jsonb) from public;
revoke all on function public.admin_delete_settlement(text,uuid) from public;
revoke all on function public.admin_update_finance_settings(text,numeric,numeric,boolean,boolean,boolean) from public;
grant execute on function public.get_admin_billing_snapshot(text) to anon,service_role;
grant execute on function public.admin_save_settlement(text,uuid,jsonb) to anon,service_role;
grant execute on function public.admin_delete_settlement(text,uuid) to anon,service_role;
grant execute on function public.admin_update_finance_settings(text,numeric,numeric,boolean,boolean,boolean) to anon,service_role;
revoke execute on function public.get_admin_billing_snapshot(text) from authenticated;
revoke execute on function public.admin_save_settlement(text,uuid,jsonb) from authenticated;
revoke execute on function public.admin_delete_settlement(text,uuid) from authenticated;
revoke execute on function public.admin_update_finance_settings(text,numeric,numeric,boolean,boolean,boolean) from authenticated;

commit;
