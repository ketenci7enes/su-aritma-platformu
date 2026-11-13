-- 005_b2b_anon_closed.sql
-- B2B formu artık sunucu Route Handler'ından yazılır; anon doğrudan insert edemez.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions, auth;
grant usage on schema extensions to anon, authenticated;

select plan(3);

set local role anon;
select throws_ok(
  $$insert into public.b2b_leads (company, contact_name, phone, city)
    values ('X', 'Y', '05551112233', 'İstanbul')$$,
  '42501', null, 'anon artik lead yazamaz');

-- Tablo düzeyi REVOKE kolon grant'lerini silmez; kalan yetki ayrıca kontrol edilir.
select ok(
  not has_column_privilege('anon', 'public.b2b_leads', 'company', 'INSERT'),
  'anon kolon duzeyinde de yazamaz');
reset role;

select is((select count(*)::int from public.b2b_leads), 0, 'anon hicbir lead birakmadi');

select * from finish();
rollback;
