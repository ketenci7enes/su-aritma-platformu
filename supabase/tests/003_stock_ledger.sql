-- 003_stock_ledger.sql
-- Satışta stok düşüşü, webhook idempotency, iptalde iade ve değiştirilemez denetim izi.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions, auth;
grant usage on schema extensions to anon, authenticated;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin@test.local', '', now(), now(), now(), '{}', '{}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'musteri@test.local', '', now(), now(), now(), '{}', '{}');

select plan(12);

insert into public.products (id, slug, name, category, price_try, stock)
values ('33333333-3333-3333-3333-333333333333', 'test-urun', 'Test Ürün', 'device', 100, 10);

insert into public.orders (id, profile_id, status, total_try)
values ('44444444-4444-4444-4444-444444444444',
        '22222222-2222-2222-2222-222222222222', 'pending', 300);
insert into public.order_items (order_id, product_id, qty, unit_price)
values ('44444444-4444-4444-4444-444444444444',
        '33333333-3333-3333-3333-333333333333', 3, 100);

set local role service_role;
select lives_ok(
  $$select public.mark_order_paid('44444444-4444-4444-4444-444444444444', 'pay-1')$$,
  'odeme onayi islenir');
reset role;

select is((select stock from public.products
            where id = '33333333-3333-3333-3333-333333333333'), 7, 'satista stok 3 azaldi');
select is((select sum(delta)::int from public.stock_movements
            where order_id = '44444444-4444-4444-4444-444444444444' and reason = 'sale'),
          -3, 'sale hareketi yazildi');
select is((select stock_after from public.stock_movements
            where order_id = '44444444-4444-4444-4444-444444444444' and reason = 'sale'),
          7, 'hareket stock_after dogru');

-- ayni webhook tekrar: idempotent
set local role service_role;
select lives_ok(
  $$select public.mark_order_paid('44444444-4444-4444-4444-444444444444', 'pay-1')$$,
  'tekrar odeme onayi zararsiz');
reset role;

select is((select stock from public.products
            where id = '33333333-3333-3333-3333-333333333333'), 7, 'stok ikinci kez dusmedi');
select is((select count(*)::int from public.stock_movements
            where order_id = '44444444-4444-4444-4444-444444444444'), 1, 'tek sale hareketi var');

-- kullanici iptal eder: stok geri gelir
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$select public.cancel_order('44444444-4444-4444-4444-444444444444')$$,
  'musteri kendi paid siparisini iptal eder');
reset role;

select is((select stock from public.products
            where id = '33333333-3333-3333-3333-333333333333'), 10, 'iptalde stok geri geldi');

-- pending iptali stoga dokunmaz
insert into public.orders (id, profile_id, status, total_try)
values ('66666666-6666-6666-6666-666666666666',
        '22222222-2222-2222-2222-222222222222', 'pending', 100);
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$select public.cancel_order('66666666-6666-6666-6666-666666666666')$$,
  'pending siparis iptal edilir');
reset role;

select is((select stock from public.products
            where id = '33333333-3333-3333-3333-333333333333'), 10,
          'pending iptali stogu artirmaz');

-- hareketler degistirilemez
select throws_ok(
  $$update public.stock_movements set delta = 999$$,
  'P0001', null, 'stok hareketi guncellenemez');

select * from finish();
rollback;
