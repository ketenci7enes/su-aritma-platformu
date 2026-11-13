-- 002_attack_regressions.sql
-- DATABASE_RULES §12: istemcinin kendi belirlememesi gereken alanlar ve
-- yalnız RPC'den yapılması gereken işlemler reddedilmeli.
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

select plan(11);

insert into public.products (id, slug, name, category, price_try, stock)
values ('33333333-3333-3333-3333-333333333333', 'test-urun', 'Test Ürün', 'device', 100, 10);

insert into public.orders (id, profile_id, status, total_try)
values ('44444444-4444-4444-4444-444444444444',
        '22222222-2222-2222-2222-222222222222', 'pending', 100);

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select throws_ok(
  $$insert into public.orders (profile_id, status, total_try)
    values ('22222222-2222-2222-2222-222222222222', 'paid', 0)$$,
  '42501', null, 'sahte paid siparis yazilamaz');

select throws_ok(
  $$insert into public.order_items (order_id, product_id, qty, unit_price)
    values ('44444444-4444-4444-4444-444444444444',
            '33333333-3333-3333-3333-333333333333', 1, 0)$$,
  '42501', null, 'siparis kalemine elle fiyat yazilamaz');

select throws_ok(
  $$insert into public.reviews (profile_id, product_id, author_name, rating, text, is_approved)
    values ('22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333', 'X', 5, 'sahte', true)$$,
  '42501', null, 'onaysiz yorum yayinlanamaz');

select throws_ok(
  $$update public.subscriptions set next_billing_at = now() + interval '10 years'$$,
  '42501', null, 'abonelik fatura alani yazilamaz');

select throws_ok(
  $$insert into public.appointments (profile_id, technician_id, slot_start)
    values ('22222222-2222-2222-2222-222222222222',
            (select id from public.technicians limit 1), now() + interval '1 day')$$,
  '42501', null, 'slotsuz randevu acilamaz');

select throws_ok(
  $$insert into public.support_tickets (profile_id, issue_type, status)
    values ('22222222-2222-2222-2222-222222222222', 'leak', 'resolved')$$,
  '42501', null, 'ticket resolved olarak acilamaz');

select throws_ok(
  $$select public.mark_order_paid('44444444-4444-4444-4444-444444444444', 'x')$$,
  '42501', null, 'musteri odeme onaylayamaz');

select throws_ok(
  $$select public.release_expired_slot_holds()$$,
  '42501', null, 'musteri slot temizligini cagiramaz');
reset role;

-- Okuma izolasyonu
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is((select count(*)::int from public.orders
            where profile_id = '22222222-2222-2222-2222-222222222222'), 0,
          'baskasinin siparisi gorunmez');
reset role;

-- service_role akisi: sunucu toplami + stok
set local role service_role;
insert into public.addresses (id, profile_id, title, il, ilce, line, is_default)
values ('55555555-5555-5555-5555-555555555555',
        '22222222-2222-2222-2222-222222222222', 'Ev', 'İstanbul', 'Kadıköy',
        'Örnek mahalle no 1', true);
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$select public.create_order(
      '[{"product_id":"33333333-3333-3333-3333-333333333333","qty":3}]'::jsonb,
      '55555555-5555-5555-5555-555555555555')$$,
  'create_order sunucu tarafinda siparis acar');
reset role;

select is((select count(*)::int from public.orders
            where status = 'pending' and total_try = 300), 1,
          'toplam sunucuda hesaplandi');

select * from finish();
rollback;
