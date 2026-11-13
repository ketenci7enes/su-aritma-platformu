-- 004_admin_role.sql
-- Admin yetkisi ayrı user_roles tablosundan gelir; istemci kendini yükseltemez.
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

select plan(13);

insert into public.products (id, slug, name, category, price_try, stock)
values ('33333333-3333-3333-3333-333333333333', 'test-urun', 'Test Ürün', 'device', 100, 10);

insert into public.orders (id, profile_id, status, total_try)
values ('44444444-4444-4444-4444-444444444444',
        '22222222-2222-2222-2222-222222222222', 'pending', 100);

-- admin rolü yalnız SQL/service_role ile verilir
insert into public.user_roles (profile_id, role)
values ('11111111-1111-1111-1111-111111111111', 'admin');

select ok(public.is_admin() is not true, 'oturum yokken is_admin false');

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select ok(public.is_admin() is not true, 'musteri icin is_admin false');

select throws_ok(
  $$insert into public.user_roles (profile_id, role)
    values ('22222222-2222-2222-2222-222222222222', 'admin')$$,
  '42501', null, 'musteri kendine admin rolu veremez');

select throws_ok(
  $$update public.user_roles set role = 'admin'$$,
  '42501', null, 'musteri rolleri guncelleyemez');

select throws_ok(
  $$select public.set_product_stock('33333333-3333-3333-3333-333333333333', 5, null)$$,
  '42501', null, 'musteri stok belirleyemez');

select is((select count(*)::int from public.stock_movements), 0, 'musteri stok hareketi goremez');

select throws_ok(
  $$select public.upsert_product(null, 'musteri-urun', 'Musteri', 'device', 1)$$,
  '42501', null, 'musteri urun ekleyemez');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select ok(public.is_admin(), 'admin icin is_admin true');

select lives_ok(
  $$select public.set_product_stock('33333333-3333-3333-3333-333333333333', 4, 'sayim')$$,
  'admin stok belirler');

select lives_ok(
  $$select public.set_product_price('33333333-3333-3333-3333-333333333333', 120)$$,
  'admin fiyat belirler');

select throws_ok(
  $$select public.advance_order_status('44444444-4444-4444-4444-444444444444', 'paid')$$,
  'P0001', null, 'admin bile siparisi dogrudan paid yapamaz');
reset role;

select is((select stock from public.products
            where id = '33333333-3333-3333-3333-333333333333'), 4, 'stok guncellendi');

select is((select price_try from public.products
            where id = '33333333-3333-3333-3333-333333333333'), 120::numeric, 'fiyat guncellendi');

select * from finish();
rollback;
