-- 006_audit_immutability.sql
-- Denetim izi değiştirilemez; tek istisna profil silinince actor_id'nin NULL'a
-- çekilmesidir (KVKK anonimleştirme). TRUNCATE yetkisi de kapalı olmalı.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions, auth;
grant usage on schema extensions to anon, authenticated;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin@test.local', '', now(), now(), now(), '{}', '{}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'silinecek@test.local', '', now(), now(), now(), '{}', '{}');

select plan(13);

insert into public.products (id, slug, name, category, price_try, stock) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'silme-urunu', 'Silme Ürünü', 'device', 10, 0),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'sayim-urunu', 'Sayım Ürünü', 'device', 20, 0),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'dusum-urunu', 'Düşüm Ürünü', 'device', 30, 10);

insert into public.user_roles (profile_id, role)
values ('11111111-1111-1111-1111-111111111111', 'admin');

insert into public.stock_movements (product_id, delta, stock_after, reason, actor_id, note)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5, 5, 'initial',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'açılış');

-- 1) Profil silinince FK SET NULL, immutable trigger'a takılmamalı.
select lives_ok(
  $$delete from auth.users where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'hareketi olan profil silinebilir (KVKK)');

-- 2) Hareket korunur, yalnız actor_id boşalır.
select is((select count(*)::int from public.stock_movements
            where product_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 1,
          'denetim satiri silinmedi');

select ok((select actor_id is null from public.stock_movements
            where product_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
          'actor_id anonimlesti');

-- 3) Diğer alanlar hâlâ değiştirilemez.
select throws_ok(
  $$update public.stock_movements set delta = 999
     where product_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$,
  'P0001', null, 'delta degistirilemez');

select throws_ok(
  $$update public.stock_movements set actor_id = '11111111-1111-1111-1111-111111111111'
     where product_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$,
  'P0001', null, 'actor_id yeniden atanamaz');

-- 4) DELETE reddedilir.
select throws_ok(
  $$delete from public.stock_movements
     where product_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$,
  'P0001', null, 'denetim satiri silinemez');

-- 5) TRUNCATE yetkisi service_role'da bile yok: row trigger atlanamaz.
set local role service_role;
select throws_ok(
  $$truncate public.stock_movements$$,
  '42501', null, 'service_role denetim izini truncate edemez');
reset role;

-- 6) 'initial' gerçekten ilk giriş demek: not şartı yok, sonraki giriş 'manual'.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$select public.set_product_stock('cccccccc-cccc-cccc-cccc-cccccccccccc', 4, null)$$,
  'admin ilk stok girisini yapar');
reset role;

select is((select count(*)::int from public.stock_movements
            where product_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
              and reason = 'initial'), 1,
          'notsuz ilk giris initial olarak etiketlendi');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$select public.set_product_stock('cccccccc-cccc-cccc-cccc-cccccccccccc', 6, 'sayım')$$,
  'admin ikinci stok girisini yapar');
reset role;

select is((select count(*)::int from public.stock_movements
            where product_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
              and reason = 'manual'), 1,
          'ikinci giris manual olarak etiketlendi');

-- Ilk hareket DUSUM ise 'initial' denemez: acilis stogu degil, duzeltme.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$select public.set_product_stock('dddddddd-dddd-dddd-dddd-dddddddddddd', 4, null)$$,
  'admin ilk hareket olarak stok dusurur');
reset role;

select is((select reason::text from public.stock_movements
            where product_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'), 'manual',
          'ilk hareket dusum ise manual olarak etiketlendi');

select * from finish();
rollback;
