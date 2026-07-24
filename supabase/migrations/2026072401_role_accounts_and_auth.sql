begin;

alter table public.travel_offices
  add column if not exists phone_owner_id uuid;

alter table public.travel_offices
  alter column owner_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'travel_offices_phone_owner_id_fkey'
      and conrelid = 'public.travel_offices'::regclass
  ) then
    alter table public.travel_offices
      add constraint travel_offices_phone_owner_id_fkey
      foreign key (phone_owner_id) references public.phone_users(id) on delete restrict;
  end if;
end $$;
create unique index if not exists travel_offices_phone_owner_id_uidx
  on public.travel_offices(phone_owner_id)
  where phone_owner_id is not null;

insert into public.phone_users(id, phone, full_name, role, is_active, email, language, created_at, updated_at)
select
  p.id,
  case
    when p.id = '22222222-2222-4222-8222-222222222222'::uuid then '+962790100012'
    else public.normalize_jordan_phone(p.phone)
  end,
  p.full_name,
  'office'::public.app_role,
  p.is_active,
  p.email::text,
  'ar',
  p.created_at,
  now()
from public.profiles p
join public.travel_offices o on o.owner_id = p.id
where p.role = 'office'
  and not exists (select 1 from public.phone_users u where u.id = p.id)
  and coalesce(
    case when p.id = '22222222-2222-4222-8222-222222222222'::uuid then '+962790100012'
         else public.normalize_jordan_phone(p.phone) end,
    ''
  ) <> ''
on conflict do nothing;

update public.phone_users u
set role='office', is_active=true, full_name=p.full_name, updated_at=now()
from public.profiles p
where u.id=p.id and p.role='office';

insert into public.phone_users(phone, full_name, role, is_active, language)
values ('+962790000001', 'إدارة سفرتك', 'admin', true, 'ar')
on conflict (phone) do update
set full_name=excluded.full_name, role='admin', is_active=true, updated_at=now();

update public.travel_offices o
set phone_owner_id = o.owner_id
where o.phone_owner_id is null
  and o.owner_id is not null
  and exists (select 1 from public.phone_users u where u.id=o.owner_id and u.role='office');

create or replace function private.phone_session_user(p_session_token text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.user_id
  from public.phone_sessions s
  join public.phone_users u on u.id=s.user_id
  where p_session_token ~ '^[0-9a-fA-F]{64}$'
    and s.token_hash=encode(extensions.digest(lower(p_session_token),'sha256'),'hex')
    and s.revoked_at is null
    and s.expires_at>now()
    and u.is_active
  limit 1
$$;

create or replace function private.role_session_user(p_session_token text, p_roles public.app_role[])
returns public.phone_users
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user public.phone_users%rowtype;
begin
  select u.* into v_user
  from public.phone_sessions s
  join public.phone_users u on u.id=s.user_id
  where p_session_token ~ '^[0-9a-fA-F]{64}$'
    and s.token_hash=encode(extensions.digest(lower(p_session_token),'sha256'),'hex')
    and s.revoked_at is null
    and s.expires_at>now()
    and u.is_active
    and u.role = any(p_roles)
  limit 1;
  if not found then raise exception 'FORBIDDEN' using errcode='P0001'; end if;
  return v_user;
end;
$$;
revoke all on function private.role_session_user(text, public.app_role[]) from public;

create or replace function public.verify_phone_otp_flow(
  p_challenge_id uuid,
  p_phone text,
  p_code text,
  p_purpose text,
  p_full_name text default null
)
returns table(
  success boolean, failure_code text, session_token text, user_id uuid,
  full_name text, phone text, email text, role public.app_role,
  is_active boolean, language text, created_at timestamptz, expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text; v_purpose text; v_challenge public.auth_otp_challenges%rowtype;
  v_settings public.auth_otp_settings%rowtype; v_user public.phone_users%rowtype;
  v_token text; v_expiry timestamptz; v_failure text; v_name text;
begin
  v_phone:=public.normalize_jordan_phone(p_phone);
  v_purpose:=lower(btrim(coalesce(p_purpose,'')));
  if v_phone is null or v_purpose not in ('login','signup') then
    return query select false,'INVALID_PHONE',null::text,null::uuid,null::text,v_phone,null::text,null::public.app_role,false,null::text,null::timestamptz,null::timestamptz; return;
  end if;
  select * into v_challenge from public.auth_otp_challenges where id=p_challenge_id for update;
  if not found or v_challenge.phone<>v_phone or v_challenge.purpose<>v_purpose then
    return query select false,'CHALLENGE_NOT_FOUND',null::text,null::uuid,null::text,v_phone,null::text,null::public.app_role,false,null::text,null::timestamptz,null::timestamptz; return;
  end if;
  if v_challenge.consumed_at is not null then
    return query select false,'OTP_ALREADY_USED',null::text,null::uuid,null::text,v_phone,null::text,null::public.app_role,false,null::text,null::timestamptz,null::timestamptz; return;
  end if;
  if v_challenge.expires_at<=now() then
    update public.auth_otp_challenges set consumed_at=now() where id=p_challenge_id;
    return query select false,'OTP_EXPIRED',null::text,null::uuid,null::text,v_phone,null::text,null::public.app_role,false,null::text,null::timestamptz,null::timestamptz; return;
  end if;
  if v_challenge.attempts>=v_challenge.max_attempts then
    update public.auth_otp_challenges set consumed_at=coalesce(consumed_at,now()) where id=p_challenge_id;
    return query select false,'TOO_MANY_ATTEMPTS',null::text,null::uuid,null::text,v_phone,null::text,null::public.app_role,false,null::text,null::timestamptz,null::timestamptz; return;
  end if;
  if extensions.crypt(coalesce(p_code,''),v_challenge.code_hash)<>v_challenge.code_hash then
    v_failure:=case when v_challenge.attempts+1>=v_challenge.max_attempts then 'TOO_MANY_ATTEMPTS' else 'INVALID_OTP' end;
    update public.auth_otp_challenges
      set attempts=attempts+1,
          consumed_at=case when attempts+1>=max_attempts then now() else consumed_at end
    where id=p_challenge_id;
    return query select false,v_failure,null::text,null::uuid,null::text,v_phone,null::text,null::public.app_role,false,null::text,null::timestamptz,null::timestamptz; return;
  end if;
  if v_purpose='login' then
    select u.* into v_user from public.phone_users u where u.phone=v_phone;
    if not found then
      update public.auth_otp_challenges set consumed_at=now() where id=p_challenge_id;
      return query select false,'ACCOUNT_NOT_FOUND',null::text,null::uuid,null::text,v_phone,null::text,null::public.app_role,false,null::text,null::timestamptz,null::timestamptz; return;
    end if;
  else
    if exists(select 1 from public.phone_users u where u.phone=v_phone) then
      update public.auth_otp_challenges set consumed_at=now() where id=p_challenge_id;
      return query select false,'ACCOUNT_EXISTS',null::text,null::uuid,null::text,v_phone,null::text,null::public.app_role,false,null::text,null::timestamptz,null::timestamptz; return;
    end if;
    v_name:=private.clean_traveler_name(p_full_name);
    insert into public.phone_users(phone,full_name,role,is_active,language)
      values(v_phone,v_name,'traveler',true,'ar') returning * into v_user;
    insert into public.phone_notification_preferences(user_id) values(v_user.id) on conflict do nothing;
  end if;
  update public.auth_otp_challenges set consumed_at=now() where id=p_challenge_id;
  if not v_user.is_active then
    return query select false,'ACCOUNT_DISABLED',null::text,v_user.id,v_user.full_name,v_user.phone,v_user.email,v_user.role,false,v_user.language,v_user.created_at,null::timestamptz; return;
  end if;
  select * into v_settings from public.auth_otp_settings where id=1;
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  v_expiry:=now()+make_interval(secs=>v_settings.session_ttl_seconds);
  insert into public.phone_sessions(user_id,token_hash,expires_at)
    values(v_user.id,encode(extensions.digest(v_token,'sha256'),'hex'),v_expiry);
  delete from public.phone_sessions s
    where s.expires_at<now()-interval '24 hours'
       or (s.revoked_at is not null and s.revoked_at<now()-interval '24 hours');
  return query select true,null::text,v_token,v_user.id,v_user.full_name,v_user.phone,v_user.email,v_user.role,v_user.is_active,v_user.language,v_user.created_at,v_expiry;
end;
$$;

commit;
