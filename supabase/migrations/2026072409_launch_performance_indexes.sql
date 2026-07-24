create index if not exists office_transactions_created_by_idx
  on public.office_transactions (created_by);

create index if not exists platform_settlements_created_by_idx
  on public.platform_settlements (created_by);
