begin;

alter table public.platform_settings add column if not exists commission_flat numeric(12,2) not null default 0;
alter table public.platform_settings add column if not exists payment_methods jsonb not null default '{"CliQ":true,"eFAWATEERcom":true,"Cash at Office":true}'::jsonb;

create table if not exists public.office_transactions (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.travel_offices(id) on delete cascade,
  created_by uuid not null references public.phone_users(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('income','expense')),
  category text not null,
  description text not null,
  amount numeric(12,2) not null check (amount > 0 and amount <= 1000000),
  transaction_date date not null default (now() at time zone 'Asia/Amman')::date,
  reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists office_transactions_office_date_idx on public.office_transactions(office_id,transaction_date desc,created_at desc);

create table if not exists public.platform_settlements (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.travel_offices(id) on delete restrict,
  created_by uuid not null references public.phone_users(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0 and amount <= 1000000),
  settlement_date date not null default (now() at time zone 'Asia/Amman')::date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists platform_settlements_office_date_idx on public.platform_settlements(office_id,settlement_date desc,created_at desc);

alter table public.office_transactions enable row level security;
alter table public.platform_settlements enable row level security;
revoke all on table public.office_transactions from anon, authenticated;
revoke all on table public.platform_settlements from anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='platform_settings_commission_flat_check') then
    alter table public.platform_settings add constraint platform_settings_commission_flat_check check (commission_flat >= 0 and commission_flat <= 10000);
  end if;
  if not exists (select 1 from pg_constraint where conname='platform_settings_payment_methods_check') then
    alter table public.platform_settings add constraint platform_settings_payment_methods_check check (
      jsonb_typeof(payment_methods)='object'
      and payment_methods ? 'CliQ'
      and payment_methods ? 'eFAWATEERcom'
      and payment_methods ? 'Cash at Office'
    );
  end if;
end $$;

create or replace function private.enforce_booking_payment_method()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_enabled boolean;
begin
  select coalesce((payment_methods->>new.payment_method)::boolean,false) into v_enabled from public.platform_settings where id=1;
  if not coalesce(v_enabled,false) then raise exception using errcode='22023',message='INVALID_PAYMENT_METHOD'; end if;
  return new;
end;
$$;
drop trigger if exists bookings_payment_method_enabled on public.bookings;
create trigger bookings_payment_method_enabled before insert or update of payment_method on public.bookings for each row execute function private.enforce_booking_payment_method();

commit;
