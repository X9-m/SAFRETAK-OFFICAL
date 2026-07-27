-- Secure password authentication for office/admin portals.
-- Password hashes live in the private schema and are never exposed through PostgREST.

create table if not exists private.role_password_credentials (
  user_id uuid primary key references public.phone_users(id) on delete cascade,
  password_hash text not null,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  password_changed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on table private.role_password_credentials from public, anon, authenticated;

drop function if exists public.login_role_with_password(text, text, text);
create function public.login_role_with_password(
  p_phone text,
  p_password text,
  p_expected_role text
)
returns table(
  success boolean,
  failure_code text,
  session_token text,
  user_id uuid,
  full_name text,
  phone text,
  email text,
  role public.app_role,
  is_active boolean,
  language text,
  created_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_phone text;
  v_expected_role text;
  v_user public.phone_users%rowtype;
  v_credential private.role_password_credentials%rowtype;
  v_settings public.auth_otp_settings%rowtype;
  v_token text;
  v_expiry timestamptz;
  v_next_attempts integer;
begin
  v_phone := public.normalize_jordan_phone(p_phone);
  v_expected_role := lower(btrim(coalesce(p_expected_role, '')));

  if v_phone is null or v_expected_role not in ('office', 'admin') then
    return query select false, 'INVALID_CREDENTIALS', null::text, null::uuid, null::text, v_phone, null::text, null::public.app_role, false, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  if p_password is null or length(p_password) < 10 or length(p_password) > 128 then
    return query select false, 'INVALID_CREDENTIALS', null::text, null::uuid, null::text, v_phone, null::text, null::public.app_role, false, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  select u.* into v_user
  from public.phone_users u
  where u.phone = v_phone
  limit 1;

  if not found then
    return query select false, 'INVALID_CREDENTIALS', null::text, null::uuid, null::text, v_phone, null::text, null::public.app_role, false, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  if v_user.role::text <> v_expected_role then
    return query select false, 'FORBIDDEN', null::text, v_user.id, v_user.full_name, v_user.phone, v_user.email, v_user.role, v_user.is_active, v_user.language, v_user.created_at, null::timestamptz;
    return;
  end if;

  if not v_user.is_active then
    return query select false, 'ACCOUNT_DISABLED', null::text, v_user.id, v_user.full_name, v_user.phone, v_user.email, v_user.role, false, v_user.language, v_user.created_at, null::timestamptz;
    return;
  end if;

  select c.* into v_credential
  from private.role_password_credentials c
  where c.user_id = v_user.id
  for update;

  if not found then
    return query select false, 'PASSWORD_NOT_CONFIGURED', null::text, v_user.id, v_user.full_name, v_user.phone, v_user.email, v_user.role, v_user.is_active, v_user.language, v_user.created_at, null::timestamptz;
    return;
  end if;

  if v_credential.locked_until is not null and v_credential.locked_until > now() then
    return query select false, 'ACCOUNT_LOCKED', null::text, v_user.id, v_user.full_name, v_user.phone, v_user.email, v_user.role, v_user.is_active, v_user.language, v_user.created_at, v_credential.locked_until;
    return;
  end if;

  if v_credential.locked_until is not null and v_credential.locked_until <= now() then
    update private.role_password_credentials
    set failed_attempts = 0, locked_until = null, updated_at = now()
    where user_id = v_user.id;
    v_credential.failed_attempts := 0;
    v_credential.locked_until := null;
  end if;

  if extensions.crypt(p_password, v_credential.password_hash) <> v_credential.password_hash then
    v_next_attempts := v_credential.failed_attempts + 1;
    update private.role_password_credentials
    set failed_attempts = v_next_attempts,
        locked_until = case when v_next_attempts >= 5 then now() + interval '15 minutes' else null end,
        updated_at = now()
    where user_id = v_user.id;

    return query select false,
      case when v_next_attempts >= 5 then 'ACCOUNT_LOCKED' else 'INVALID_CREDENTIALS' end,
      null::text, v_user.id, v_user.full_name, v_user.phone, v_user.email, v_user.role,
      v_user.is_active, v_user.language, v_user.created_at,
      case when v_next_attempts >= 5 then now() + interval '15 minutes' else null::timestamptz end;
    return;
  end if;

  update private.role_password_credentials
  set failed_attempts = 0, locked_until = null, updated_at = now()
  where user_id = v_user.id;

  select * into v_settings from public.auth_otp_settings where id = 1;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expiry := now() + make_interval(secs => coalesce(v_settings.session_ttl_seconds, 604800));

  insert into public.phone_sessions(user_id, token_hash, expires_at)
  values (v_user.id, encode(extensions.digest(v_token, 'sha256'), 'hex'), v_expiry);

  delete from public.phone_sessions s
  where s.expires_at < now() - interval '24 hours'
     or (s.revoked_at is not null and s.revoked_at < now() - interval '24 hours');

  return query select true, null::text, v_token, v_user.id, v_user.full_name, v_user.phone, v_user.email,
    v_user.role, v_user.is_active, v_user.language, v_user.created_at, v_expiry;
end;
$function$;

revoke all on function public.login_role_with_password(text, text, text) from public;
grant execute on function public.login_role_with_password(text, text, text) to anon, authenticated;
