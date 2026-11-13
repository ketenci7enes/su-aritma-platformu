-- 001_init_boots.sql
-- init.sql'in gerçekten kurulabildiğini ve filter_due_at onarımının yerinde
-- olduğunu doğrular. Bu dosya, "db reset hiç çalışmıyordu" regresyonunun kapısıdır.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions, auth;
grant usage on schema extensions to anon, authenticated;

select plan(5);

select ok(
  to_regclass('public.installations') is not null,
  'installations tablosu kuruldu'
);

select has_column(
  'public', 'installations', 'filter_due_at',
  'filter_due_at kolonu var'
);

select ok(
  (
    select p.provolatile = 'v'
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'set_filter_due_at'
  ),
  'filter_due_at trigger fonksiyonu var'
);

select is(
  (
    select count(*)::int
      from pg_trigger
     where tgname = 'installations_filter_due'
       and not tgisinternal
  ),
  1,
  'installations_filter_due trigger tanimli'
);

select ok(
  not exists (
    select 1
      from pg_attribute a
     where a.attrelid = 'public.installations'::regclass
       and a.attgenerated <> ''
  ),
  'generated kolon kalmadi'
);

select * from finish();
rollback;
