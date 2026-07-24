begin;

create or replace function private.prepare_traveler_manifest(p_kind public.service_kind, p_details jsonb, p_expected_count integer, p_travel_date date)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_rows jsonb; v_row jsonb; v_result jsonb := '[]'::jsonb; v_name text; v_nationality text;
  v_document_type text; v_document_number text; v_document_expiry date; v_passenger_type text; v_birth_date date;
  v_letters integer; v_passport_required boolean := p_kind in ('intl_trip','flight','hajj_umrah','insurance','visa');
begin
  if p_expected_count = 0 then return '[]'::jsonb; end if;
  v_rows := p_details->'travelers';
  if jsonb_typeof(v_rows) <> 'array' or jsonb_array_length(v_rows) <> p_expected_count or p_expected_count < 1 or p_expected_count > 10 then raise exception using errcode='22023', message='INVALID_TRAVELERS'; end if;
  for v_row in select value from jsonb_array_elements(v_rows)
  loop
    if jsonb_typeof(v_row) <> 'object' then raise exception using errcode='22023', message='INVALID_TRAVELERS'; end if;
    v_name := btrim(regexp_replace(regexp_replace(coalesce(v_row->>'full_name',''), '[[:cntrl:]]', ' ', 'g'), '[[:space:]]+', ' ', 'g'));
    v_letters := char_length(regexp_replace(v_name, '[^[:alpha:]]', '', 'g'));
    if char_length(v_name) < 2 or char_length(v_name) > 100 or v_letters < 2 or v_name ~ '[<>]' or lower(v_name) like '%http%' then raise exception using errcode='22023', message='INVALID_TRAVELER_NAME'; end if;
    v_nationality := btrim(regexp_replace(regexp_replace(coalesce(v_row->>'nationality',''), '[[:cntrl:]]', ' ', 'g'), '[[:space:]]+', ' ', 'g'));
    v_letters := char_length(regexp_replace(v_nationality, '[^[:alpha:]]', '', 'g'));
    if char_length(v_nationality) < 2 or char_length(v_nationality) > 50 or v_letters < 2 or v_nationality ~ '[<>]' then raise exception using errcode='22023', message='INVALID_NATIONALITY'; end if;
    v_document_type := lower(btrim(coalesce(v_row->>'document_type','')));
    if v_document_type not in ('national_id','passport') or (v_passport_required and v_document_type <> 'passport') then raise exception using errcode='22023', message='INVALID_TRAVELER_DOCUMENT'; end if;
    v_document_number := regexp_replace(upper(btrim(coalesce(v_row->>'document_number',''))), '[^A-Z0-9]', '', 'g');
    if v_document_number !~ '^[A-Z0-9]{5,20}$' then raise exception using errcode='22023', message='INVALID_TRAVELER_DOCUMENT'; end if;
    v_document_expiry := null;
    if v_document_type = 'passport' then
      begin v_document_expiry := (v_row->>'document_expiry')::date; exception when others then raise exception using errcode='22023', message='INVALID_PASSPORT_EXPIRY'; end;
      if v_document_expiry < p_travel_date + 180 then raise exception using errcode='22023', message='PASSPORT_EXPIRY_TOO_SOON'; end if;
    end if;
    v_passenger_type := null; v_birth_date := null;
    if p_kind='flight' then
      v_passenger_type := lower(btrim(coalesce(v_row->>'passenger_type','')));
      if v_passenger_type not in ('adult','child','infant') then raise exception using errcode='22023', message='INVALID_TRAVELERS'; end if;
      begin v_birth_date := (v_row->>'birth_date')::date; exception when others then raise exception using errcode='22023', message='INVALID_TRAVELERS'; end;
      if v_birth_date > p_travel_date then raise exception using errcode='22023', message='INVALID_TRAVELERS'; end if;
      if v_passenger_type='adult' and v_birth_date > (p_travel_date - interval '12 years')::date then raise exception using errcode='22023', message='INVALID_TRAVELERS'; end if;
      if v_passenger_type='child' and (v_birth_date <= (p_travel_date - interval '12 years')::date or v_birth_date > (p_travel_date - interval '2 years')::date) then raise exception using errcode='22023', message='INVALID_TRAVELERS'; end if;
      if v_passenger_type='infant' and v_birth_date <= (p_travel_date - interval '2 years')::date then raise exception using errcode='22023', message='INVALID_TRAVELERS'; end if;
    end if;
    v_result := v_result || jsonb_build_array(jsonb_build_object('full_name',v_name,'nationality',v_nationality,'document_type',v_document_type,'document_number',v_document_number,'document_expiry',v_document_expiry,'passenger_type',v_passenger_type,'birth_date',v_birth_date));
  end loop;
  return v_result;
end;
$$;

create or replace function private.prepare_traveler_booking_details(p_kind public.service_kind, p_details jsonb, p_today date)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_primary date; v_end date; v_quantity integer; v_rooms integer:=1; v_children integer:=0; v_units integer; v_capacity integer;
  v_notes text; v_result jsonb; v_manifest jsonb; v_trip text; v_cabin text; v_room text; v_bed text; v_expected integer;
  v_adults integer:=0; v_flight_children integer:=0; v_infants integer:=0; v_non_infants integer:=0; v_fare text; v_meal text;
  v_seats jsonb; v_seat text; v_selected_seats text[]:='{}'; v_seat_fee numeric:=0; v_flight_extra numeric:=0; v_pricing_factor numeric;
  v_manifest_adults integer; v_manifest_children integer; v_manifest_infants integer;
begin
  if p_details is null or jsonb_typeof(p_details)<>'object' or pg_column_size(p_details)>40000 then raise exception using errcode='22023',message='INVALID_BOOKING_DETAILS'; end if;
  begin v_quantity:=(p_details->>'quantity')::integer; exception when others then raise exception using errcode='22023',message='INVALID_QUANTITY'; end;
  if v_quantity<1 or v_quantity>10 then raise exception using errcode='22023',message='INVALID_QUANTITY'; end if;
  v_notes:=btrim(coalesce(p_details->>'notes','')); if char_length(v_notes)>500 then raise exception using errcode='22023',message='INVALID_BOOKING_DETAILS'; end if;
  v_units:=v_quantity; v_capacity:=v_quantity; v_expected:=v_quantity; v_pricing_factor:=v_quantity;
  if p_kind='hotel' then
    begin v_primary:=(p_details->>'check_in')::date; v_end:=(p_details->>'check_out')::date; v_rooms:=coalesce((p_details->>'rooms')::integer,1); v_children:=coalesce((p_details->>'children')::integer,0); exception when others then raise exception using errcode='22023',message='INVALID_STAY_DATES'; end;
    if v_primary<p_today or v_end<=v_primary or v_end>v_primary+60 or v_rooms<1 or v_rooms>5 or v_children<0 or v_children>10 then raise exception using errcode='22023',message='INVALID_STAY_DATES'; end if;
    v_room:=coalesce(p_details->>'room_type','standard'); v_bed:=coalesce(p_details->>'bed_type','double');
    if v_room not in ('standard','deluxe','suite') or v_bed not in ('single','double','twin') then raise exception using errcode='22023',message='INVALID_BOOKING_DETAILS'; end if;
    v_units:=(v_end-v_primary)*v_rooms; v_capacity:=v_rooms; v_pricing_factor:=v_units;
    v_result:=jsonb_build_object('check_in',v_primary,'check_out',v_end,'rooms',v_rooms,'quantity',v_quantity,'children',v_children,'room_type',v_room,'bed_type',v_bed,'notes',v_notes);
  elsif p_kind='flight' then
    begin v_primary:=(p_details->>'outbound_date')::date; v_adults:=(p_details->>'adult_count')::integer; v_flight_children:=coalesce((p_details->>'child_count')::integer,0); v_infants:=coalesce((p_details->>'infant_count')::integer,0); exception when others then raise exception using errcode='22023',message='INVALID_TRAVEL_DATE'; end;
    if v_primary<p_today then raise exception using errcode='22023',message='INVALID_TRAVEL_DATE'; end if;
    if v_adults<1 or v_flight_children<0 or v_infants<0 or v_infants>v_adults or v_adults+v_flight_children+v_infants<>v_quantity then raise exception using errcode='22023',message='INVALID_QUANTITY'; end if;
    v_trip:=coalesce(p_details->>'trip_type','one_way'); v_cabin:=coalesce(p_details->>'cabin_class','economy');
    if v_trip not in ('one_way','round_trip') or v_cabin not in ('economy','business','first') then raise exception using errcode='22023',message='INVALID_BOOKING_DETAILS'; end if;
    if v_trip='round_trip' then begin v_end:=(p_details->>'return_date')::date; exception when others then raise exception using errcode='22023',message='INVALID_TRAVEL_DATE'; end; if v_end<=v_primary or v_end>v_primary+365 then raise exception using errcode='22023',message='INVALID_TRAVEL_DATE'; end if; end if;
    v_fare:=lower(coalesce(p_details->>'fare_class','standard')); v_meal:=lower(coalesce(p_details->>'meal','standard'));
    if v_fare not in ('light','standard','flex') or v_meal not in ('standard','vegan','premium') then raise exception using errcode='22023',message='INVALID_BOOKING_DETAILS'; end if;
    v_non_infants:=v_adults+v_flight_children; v_seats:=coalesce(p_details->'selected_seats','[]'::jsonb);
    if jsonb_typeof(v_seats)<>'array' or jsonb_array_length(v_seats)>v_non_infants then raise exception using errcode='22023',message='INVALID_BOOKING_DETAILS'; end if;
    for v_seat in select upper(value) from jsonb_array_elements_text(v_seats)
    loop
      if v_seat !~ '^([1-9]|1[0-2])[A-F]$' or v_seat=any(array['1A','1C','2D','2F','3B','5A','7C','7D','8F','10A','10B']) or v_seat=any(v_selected_seats) then raise exception using errcode='22023',message='INVALID_BOOKING_DETAILS'; end if;
      v_selected_seats:=array_append(v_selected_seats,v_seat);
      v_seat_fee:=v_seat_fee+case when regexp_replace(v_seat,'[^0-9]','','g')::integer<=3 then 20 when regexp_replace(v_seat,'[^0-9]','','g')::integer<=10 then 10 else 5 end;
    end loop;
    v_pricing_factor:=v_adults+(v_flight_children*0.75)+(v_infants*0.15);
    v_flight_extra:=(case v_fare when 'standard' then 30 when 'flex' then 65 else 0 end + case when v_meal='premium' then 18 else 0 end)*v_non_infants+v_seat_fee;
    v_capacity:=v_non_infants;
    v_result:=jsonb_build_object('outbound_date',v_primary,'return_date',v_end,'trip_type',v_trip,'cabin_class',v_cabin,'quantity',v_quantity,'adult_count',v_adults,'child_count',v_flight_children,'infant_count',v_infants,'fare_class',v_fare,'meal',v_meal,'selected_seats',to_jsonb(v_selected_seats),'notes',v_notes);
  elsif p_kind='car' then
    begin v_primary:=(p_details->>'pickup_date')::date; v_end:=(p_details->>'return_date')::date; exception when others then raise exception using errcode='22023',message='INVALID_STAY_DATES'; end;
    if v_primary<p_today or v_end<=v_primary or v_end>v_primary+60 then raise exception using errcode='22023',message='INVALID_STAY_DATES'; end if;
    v_units:=v_end-v_primary; v_capacity:=1; v_expected:=1; v_pricing_factor:=v_units; v_result:=jsonb_build_object('pickup_date',v_primary,'return_date',v_end,'quantity',1,'notes',v_notes);
  else
    begin v_primary:=(p_details->>'travel_date')::date; exception when others then raise exception using errcode='22023',message='INVALID_TRAVEL_DATE'; end;
    if v_primary<p_today then raise exception using errcode='22023',message='INVALID_TRAVEL_DATE'; end if;
    if p_kind='consultation' then v_expected:=0; end if; v_result:=jsonb_build_object('travel_date',v_primary,'quantity',v_quantity,'notes',v_notes);
  end if;
  v_manifest:=private.prepare_traveler_manifest(p_kind,p_details,v_expected,v_primary);
  if p_kind='flight' then
    select count(*) filter(where value->>'passenger_type'='adult'),count(*) filter(where value->>'passenger_type'='child'),count(*) filter(where value->>'passenger_type'='infant') into v_manifest_adults,v_manifest_children,v_manifest_infants from jsonb_array_elements(v_manifest);
    if v_manifest_adults<>v_adults or v_manifest_children<>v_flight_children or v_manifest_infants<>v_infants then raise exception using errcode='22023',message='INVALID_TRAVELERS'; end if;
  end if;
  return v_result||jsonb_build_object('travelers',v_manifest,'_primary_date',v_primary,'_pricing_units',v_units,'_pricing_factor',v_pricing_factor,'_flight_extra_total',v_flight_extra,'_capacity',v_capacity);
end;
$$;

create or replace function public.create_phone_booking_v2(p_session_token text, p_service_id uuid, p_booking_details jsonb, p_payment_method text, p_payment_reference text default null, p_coupon_code text default null)
returns setof public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid; v_user public.phone_users%rowtype; v_service public.services%rowtype; v_office public.travel_offices%rowtype; v_booking public.bookings%rowtype;
  v_clean jsonb; v_extras jsonb; v_coupon jsonb; v_primary date; v_units integer; v_capacity integer; v_quantity integer;
  v_pricing_factor numeric; v_flight_extra numeric; v_option_delta numeric; v_addon_total numeric; v_subtotal numeric; v_total numeric; v_reference text;
begin
  v_user_id:=private.phone_session_user(p_session_token); if v_user_id is null then raise exception using errcode='P0001',message='SESSION_EXPIRED'; end if;
  if p_payment_method not in ('CliQ','eFAWATEERcom','Cash at Office') then raise exception using errcode='22023',message='INVALID_PAYMENT_METHOD'; end if;
  v_reference:=upper(btrim(coalesce(p_payment_reference,''))); if p_payment_method<>'Cash at Office' and v_reference !~ '^[A-Z0-9_-]{6,40}$' then raise exception using errcode='22023',message='INVALID_PAYMENT_REFERENCE'; end if; if p_payment_method='Cash at Office' then v_reference:=''; end if;
  select * into v_user from public.phone_users where id=v_user_id and is_active and role='traveler'; if not found then raise exception using errcode='P0001',message='ACCOUNT_DISABLED'; end if;
  if char_length(btrim(v_user.full_name))<2 then raise exception using errcode='P0001',message='PROFILE_INCOMPLETE'; end if;
  select * into v_service from public.services where id=p_service_id and is_active and published_at is not null for update; if not found then raise exception using errcode='P0001',message='SERVICE_NOT_FOUND'; end if;
  select * into v_office from public.travel_offices where id=v_service.office_id and is_active and is_approved; if not found then raise exception using errcode='P0001',message='SERVICE_NOT_FOUND'; end if;
  v_clean:=private.prepare_traveler_booking_details(v_service.type,p_booking_details,(now() at time zone 'Asia/Amman')::date);
  v_primary:=(v_clean->>'_primary_date')::date; v_units:=(v_clean->>'_pricing_units')::integer; v_capacity:=(v_clean->>'_capacity')::integer; v_quantity:=(v_clean->>'quantity')::integer;
  v_pricing_factor:=coalesce((v_clean->>'_pricing_factor')::numeric,v_units); v_flight_extra:=coalesce((v_clean->>'_flight_extra_total')::numeric,0);
  if cardinality(v_service.available_dates)>0 and not(v_primary=any(v_service.available_dates)) then raise exception using errcode='22023',message='INVALID_TRAVEL_DATE'; end if;
  if v_service.seats_remaining is not null and v_service.seats_remaining<v_capacity then raise exception using errcode='P0001',message='NO_SEATS'; end if;
  v_extras:=private.prepare_traveler_booking_extras(v_service.details,p_booking_details,v_quantity); v_option_delta:=coalesce((v_extras->>'_option_delta')::numeric,0); v_addon_total:=coalesce((v_extras->>'_addon_total')::numeric,0);
  v_subtotal:=round((v_service.price+v_option_delta)*v_pricing_factor+v_addon_total+v_flight_extra,2); if v_subtotal<0 or v_subtotal>1000000 then raise exception using errcode='22023',message='INVALID_BOOKING_DETAILS'; end if;
  v_coupon:=private.apply_traveler_coupon(p_coupon_code,v_subtotal); v_total:=(v_coupon->>'final_total')::numeric;
  v_clean:=(v_clean-'_primary_date'-'_pricing_units'-'_pricing_factor'-'_flight_extra_total'-'_capacity')||(v_extras-'_option_delta'-'_addon_total')||jsonb_build_object('payment_reference',nullif(v_reference,''),'coupon_code',v_coupon->'coupon_code','discount',(v_coupon->>'discount')::numeric,'base_price',v_service.price,'pricing_units',v_pricing_factor,'flight_upgrades_total',v_flight_extra);
  insert into public.bookings(service_id,office_id,traveler_id,phone_user_id,service_type,service_name,office_name,traveler_name,traveler_phone,booking_details,total_price,payment_method,payment_status,status)
  values(v_service.id,v_office.id,null,v_user_id,v_service.type,v_service.title,v_office.name,v_user.full_name,v_user.phone,v_clean,v_total,p_payment_method,'unpaid','Pending') returning * into v_booking;
  if v_service.seats_remaining is not null then update public.services set seats_remaining=seats_remaining-v_capacity,updated_at=now() where id=v_service.id; end if;
  insert into public.notifications(user_id,phone_user_id,booking_id,type,title_ar,title_en,description_ar,description_en,is_read,requires_action) values(null,v_user_id,v_booking.id,'booking_created','تم استلام طلب الحجز','Booking request received','تم إرسال طلب الحجز إلى المكتب للمراجعة.','Your booking request was sent to the office.',false,false);
  insert into public.booking_messages(booking_id,phone_user_id,sender,body) values(v_booking.id,v_user_id,'system','تم إنشاء طلب الحجز وإرساله إلى المكتب للمراجعة.');
  return next v_booking;
end;
$$;

commit;
