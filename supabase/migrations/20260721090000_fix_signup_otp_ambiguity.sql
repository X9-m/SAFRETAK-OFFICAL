do $$
declare
  v_definition text;
begin
  v_definition := pg_get_functiondef('public.verify_phone_otp_flow(uuid,text,text,text,text)'::regprocedure);

  v_definition := replace(
    v_definition,
    'select * into v_user from public.phone_users where phone=v_phone;',
    'select u.* into v_user from public.phone_users as u where u.phone=v_phone;'
  );

  v_definition := replace(
    v_definition,
    'if exists(select 1 from public.phone_users where phone=v_phone) then',
    'if exists(select 1 from public.phone_users as u where u.phone=v_phone) then'
  );

  execute v_definition;
end
$$;
