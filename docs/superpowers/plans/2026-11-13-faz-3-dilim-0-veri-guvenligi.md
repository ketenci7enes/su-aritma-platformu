# FAZ 3 / Dilim 0 — Veri Güvenliği ve Admin Temeli: Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Veritabanının hiç çalışmamasına yol açan şema hatasını düzeltmek, istemcinin fiyat/durum/onay/rol yazmasını kapatmak ve yönetici yetkisini kendi kendine yükseltilemez biçimde kurmak.

**Architecture:** Üç katman. (1) `init.sql`'deki tek blocker satır onarılır (çalışmamış migration istisnası, `docs/DATABASE_RULES.md` §0.1). (2) Hazır `20261113000001_security_hardening.sql` uygulanır: revoke-first grant modeli, kolon-bazlı yetki, iş mantığı RPC'lere taşınır. (3) Eksik kalan üç parça yeni `20261113000002_admin_data_foundation.sql` ile eklenir: stok denetim izi + iptalde stok iadesi, `user_roles` tabanlı admin yetkisi, `b2b_leads` anon insert'inin kaldırılması.

**Tech Stack:** PostgreSQL 15 (Supabase local), Supabase CLI 3.1.0 (`npx supabase`), pgTAP, Next.js 15 Route Handler, Docker Desktop.

**Spec:** `docs/DATABASE_RULES.md` (bağlayıcı) + `docs/superpowers/plans/2026-11-11-su-aritma-platformu-yol-haritasi.md` FAZ 3.

---

## Global Constraints

- **`docs/DATABASE_RULES.md` bağlayıcıdır.** Plan onunla çelişirse kural kazanır; çelişki raporlanır.
- **`20261111000001_init.sql` yalnızca §0.1'deki iki düzeltme için düzenlenir.** Başka hiçbir değişiklik yapılmaz. Bu istisnanın gerekçesi: dosya hiçbir ortamda çalışmadı (`db reset` hata veriyordu).
- Yeni değişiklikler **her zaman** yeni migration: `20261113000002_admin_data_foundation.sql`. Zaman damgası sırası kritiktir; `20261113000001`'den **sonra** gelmelidir.
- `security definer` fonksiyonlarda `set search_path = ''` + tüm nesneler şema-nitelikli.
- Hata mesajları **makine-okunur kod** (`insufficient_stock`, `slot_not_held`), Türkçe metin değil (`DATABASE_RULES` §7).
- RPC'ye kullanıcı id'si parametresi **verilmez**; kimlik `(select auth.uid())`.
- `service_role` anahtarı `NEXT_PUBLIC_` öneki almaz, istemciye girmez.
- Her yeni tablo aynı migration'da: `enable row level security` + politika + `revoke all` + minimum `grant`.
- `for all` policy yasak; her işlem için ayrı politika (`DATABASE_RULES` §5).
- Conventional Commits; her görev tek commit.
- Docker Desktop açık olmalı: `docker info` başarılı dönmeli.

### Ortam hazırlığı (bir kez)

```powershell
docker info --format "{{.ServerVersion}}"
npx supabase start
npx supabase status
```

### pgTAP fixture (her test dosyasında)

```sql
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
```

Kullanıcı olarak işlem: `set local role authenticated;` + `set local request.jwt.claims = '{"sub":"<uuid>","role":"authenticated"}';` → sonra **`reset role;` zorunlu**.

**Her test dosyasının sonuna** (fixture'ın parçası, ayrı yazılmaz):

```sql
select * from finish();
rollback;
```

Test komutu: `npx supabase test db`.

---

## Review Focus

Sessizce kırılabilecek beş yer, en olasıdan başlayarak. Her biri ilgili görevin testine bağlanmıştır.

1. **Stok iki kez düşmesi / hiç düşmemesi** — satış ile iptal aynı siparişte yarışırsa ya da webhook tekrarlarsa. (Task 3)
2. **Admin yükseltmesinin geri gelmesi** — `user_roles`'a istemci yazabildiği an tüm model çöker. (Task 4)
3. **Hiç çalışmayan şema** — `init.sql`'e bir gün yeniden immutable olmayan ifade girmesi. (Task 1)
4. **Anon form üzerinden şişirme** — grant kaldırıldı ama route handler sınırsız gövde kabul ederse açık kalır. (Task 5)
5. **Harness/Tip kayması** — `database.types.ts` elle yazılıp şemadan kopması. (Task 6)

---

## Dosya Yapısı

| Dosya | Sorumluluk |
|---|---|
| `supabase/migrations/20261111000001_init.sql` | Yalnızca §0.1 düzeltmesi (pgcrypto, generated column) |
| `supabase/migrations/20261113000001_security_hardening.sql` | Hazır, olduğu gibi uygulanır |
| `supabase/migrations/20261113000002_admin_data_foundation.sql` | Stok izi, iptal iadesi, admin rolü, b2b kapatma |
| `supabase/tests/001_init_boots.sql` | Şemanın gerçekten kurulduğu |
| `supabase/tests/002_attack_regressions.sql` | §12 saldırı listesi |
| `supabase/tests/003_stock_ledger.sql` | Satış/iptal/idempotency |
| `supabase/tests/004_admin_role.sql` | Yetki yükseltme engeli |
| `supabase/tests/005_b2b_anon_closed.sql` | Anon insert reddi |
| `web/src/app/api/b2b-lead/route.ts` | B2B formunun sunucu ucu |
| `web/src/lib/rate-limit.ts` | Basit pencere tabanlı limiter |
| `web/src/lib/supabase/database.types.ts` | Üretilmiş tipler |

---

### Task 1: `init.sql` onarımı ve `db reset` kanıtı

**Files:**
- Modify: `supabase/migrations/20261111000001_init.sql` (yalnızca §0.1)
- Create: `supabase/tests/001_init_boots.sql`

**Interfaces:**
- Consumes: yok (ilk görev)
- Produces: çalışan şema; `public.set_filter_due_at()` trigger fonksiyonu

- [ ] **Step 1: Düşen testi yaz**

`supabase/tests/001_init_boots.sql` — `plan(5)`:

```sql
select ok(to_regclass('public.installations') is not null, 'installations tablosu kuruldu');
select has_column('public', 'installations', 'filter_due_at', 'filter_due_at kolonu var');
select ok(
  (select provolatile from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_filter_due_at') = 'v',
  'filter_due_at trigger fonksiyonu var');
select is(
  (select count(*)::int from pg_trigger where tgname = 'installations_filter_due'),
  1, 'installations_filter_due trigger tanimli');
select ok(not exists (
  select 1 from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
   where a.attrelid = 'public.installations'::regclass and a.attgenerated <> ''),
  'generated kolon kalmadi');
```

- [ ] **Step 2: Testin düştüğünü doğrula**

Run: `npx supabase db reset`
Expected: FAIL — `ERROR: generation expression is not immutable` (init.sql, `installations` tablosu). `db reset` hiç tamamlanmaz, test dosyası hiç koşmaz.

- [ ] **Step 3: §0.1 düzeltmesini uygula**

İki değişiklik, başka hiçbir şey:

1. `create extension if not exists pgcrypto;` satırı silinir (`gen_random_uuid()` PG13+ dahili).
2. `filter_due_at timestamptz generated always as (installed_at + interval '180 days') stored` → `filter_due_at timestamptz` + tablo altına `public.set_filter_due_at()` ve `installations_filter_due` BEFORE INSERT trigger'ı.

Trigger gövdesi `DATABASE_RULES` §0.1'deki sürümden **bilinçli olarak güçlendirilmiştir**
(`before insert or update of installed_at`, koşulsuz atama): eski generated kolon `installed_at`
değişince değeri tazeliyordu, `is null` kontrolü o davranışı kaybederdi.

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npx supabase db reset` → hata yok.
Run: `npx supabase test db supabase/tests/001_init_boots.sql`
Expected: `1..5`, tümü `ok`, `All tests successful.`

Ek kanıt — trigger gerçekten değer yazıyor:

```sql
insert into public.installations (order_id, profile_id, product_id)
select o.id, o.profile_id, oi.product_id from public.orders o
  join public.order_items oi on oi.order_id = o.id limit 1;

select filter_due_at is not null as ok from public.installations limit 1;  -- t
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261111000001_init.sql supabase/tests/001_init_boots.sql
git commit -m "fix(db): init semasini calisir hale getir (immutable olmayan generated kolon)"
```

---

### Task 2: Hazır hardening migration'ı uygula ve saldırı regresyonlarını kanıtla

**Files:**
- Use: `supabase/migrations/20261113000001_security_hardening.sql` (değiştirilmez)
- Create: `supabase/tests/002_attack_regressions.sql`

**Interfaces:**
- Consumes: Task 1'in çalışan şeması
- Produces: `create_order(jsonb, uuid)`, `mark_order_paid(uuid, text)`, `hold_appointment_slot(uuid)`, `book_appointment(uuid, public.appointment_type, uuid, uuid)`, `cancel_appointment(uuid)`, `set_subscription_status(uuid, public.subscription_status)`; `order_items.product_name`; `appointments.slot_id`

- [ ] **Step 1: Testi yaz**

`supabase/tests/002_attack_regressions.sql` — fixture + `plan(11)`. `DATABASE_RULES` §12 listesinin tamamı:

```sql
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

select throws_ok($$select public.mark_order_paid('44444444-4444-4444-4444-444444444444', 'x')$$,
  '42501', null, 'musteri odeme onaylayamaz');

select throws_ok($$select public.release_expired_slot_holds()$$,
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
```

> `create_order` `auth.uid()` kullanır; `service_role` altında `request.jwt.claims` set ederek kullanıcıyı taklit ediyoruz. `set local role service_role` içinde `auth.uid()` JWT'den okunur — gerçek webhook akışı da böyle çalışır.

- [ ] **Step 2: Testin düştüğünü doğrula**

Run: `npx supabase db reset` — bu adımda `20261113000001` **henüz uygulanmıyorsa** dosyayı `supabase/migrations/` altına koy ve reset et.
Expected: FAIL — politika hâlâ eski (`orders_insert_own`), `sahte paid siparis` assertion düşer.

> Not: `20261113000001_security_hardening.sql` repoda hazır duruyor. Testi yazdıktan sonra `db reset` onu uygular ve testler geçer. "Düşen test" kanıtı için dosyayı geçici olarak `supabase/migrations/` dışına al, reset et, testi koş, sonra geri koy. Bu adımı atlamak TDD disiplinini bozar.

- [ ] **Step 3: Migration'ı uygula**

Dosya değiştirilmez. Yalnızca `db reset` ile sıraya girer. Uygulanmadan önce beş şeyi doğrula:

1. `drop policy` adlarının tamamı `init.sql`'de var (doğrulandı: `profiles_insert_own`, `addresses_all_own`, `slots_read_free`, `tickets_select_own`, `tickets_insert_own`, `reviews_public_read`, `b2b_leads_public_insert` mevcut).
2. `release_expired_slot_holds` gövdesi şema-nitelikli (`public.`) — `search_path = ''` ile kırılmaz (doğrulandı).
3. `appointments` tablosunda `slot_start` ve `type` kolonları var; `slot_id` bu migration'da ekleniyor (doğrulandı).
4. **Varsayılan yetkiler gerçekten kapandı mı:** `alter default privileges` yalnız `postgres` rolünün oluşturduğu nesneleri kapsar. Migration'lar Supabase'de `postgres` olarak koşar; yine de doğrula:

```sql
select defaclrole::regrole, defaclnamespace::regnamespace, defaclobjtype, defaclacl
  from pg_default_acl;
```

`anon`/`authenticated` için `=arwdDxt/...` benzeri bir kayıt görünmemeli.

5. **Veri taşınmış bir ortama uygulanacaksa** `addresses_one_default_uidx` patlayabilir:

```sql
select profile_id, count(*) from public.addresses
 where is_default group by 1 having count(*) > 1;
```

Yerel `db reset` senaryosunda tablo boş olduğu için risk yoktur; hosted ortamda bu kontrol zorunludur.

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npx supabase db reset` → hata yok.
Run: `npx supabase test db`
Expected: `001` ve `002` dosyaları `All tests successful.`

Ek doğrulama — varsayılan yetkiler gerçekten kapandı mı (yeni tablo tam yetkiyle açılmamalı):

```sql
begin;
create table public.__acl_probe (id int);
select has_table_privilege('anon', 'public.__acl_probe', 'INSERT') as anon_insert;   -- false
select has_table_privilege('authenticated', 'public.__acl_probe', 'UPDATE') as auth_update; -- false
rollback;
```

```powershell
cd web
npx vitest run     # mevcut 102 test bozulmamalı
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261113000001_security_hardening.sql supabase/tests/002_attack_regressions.sql
git commit -m "feat(db): guvenlik sertlestirme migration'i ve saldiri regresyon testleri"
```

---

### Task 3: Stok denetim izi + iptalde stok iadesi

> **Bu, indirilen migration'ın en büyük eksiği.** `mark_order_paid` stoğu düşürüyor ama `pending|paid → cancelled` geçişinde **hiçbir şey geri getirmiyor** ve düşüşün kaydı tutulmuyor. Sipariş iptal edilince stok kalıcı olarak kaybolur.

**Files:**
- Create: `supabase/migrations/20261113000002_admin_data_foundation.sql`
- Create: `supabase/tests/003_stock_ledger.sql`

**Interfaces:**
- Consumes: `public.orders`, `public.order_items`, `public.products`, `public.mark_order_paid(uuid, text)`
- Produces: `public.stock_reason` enum, `public.stock_movements` tablosu, `public.cancel_order(uuid) returns void`, `mark_order_paid`'in hareket yazan sürümü

- [ ] **Step 1: Düşen testi yaz**

`supabase/tests/003_stock_ledger.sql` — fixture + `plan(12)`:

```sql
insert into public.products (id, slug, name, category, price_try, stock)
values ('33333333-3333-3333-3333-333333333333', 'test-urun', 'Test Ürün', 'device', 100, 10);

insert into public.orders (id, profile_id, status, total_try)
values ('44444444-4444-4444-4444-444444444444',
        '22222222-2222-2222-2222-222222222222', 'pending', 300);
insert into public.order_items (order_id, product_id, qty, unit_price)
values ('44444444-4444-4444-4444-444444444444',
        '33333333-3333-3333-3333-333333333333', 3, 100);
```

`mark_order_paid` yalnız `service_role`; `cancel_order` kullanıcı adına:

```sql
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

-- aynı webhook tekrar: idempotent
set local role service_role;
select lives_ok(
  $$select public.mark_order_paid('44444444-4444-4444-4444-444444444444', 'pay-1')$$,
  'tekrar odeme onayi zararsiz');
reset role;

select is((select stock from public.products
            where id = '33333333-3333-3333-3333-333333333333'), 7, 'stok ikinci kez dusmedi');
select is((select count(*)::int from public.stock_movements
            where order_id = '44444444-4444-4444-4444-444444444444'), 1, 'tek sale hareketi var');

-- kullanıcı iptal eder: stok geri gelir
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$select public.cancel_order('44444444-4444-4444-4444-444444444444')$$,
  'musteri kendi paid siparisini iptal eder');
reset role;

select is((select stock from public.products
            where id = '33333333-3333-3333-3333-333333333333'), 10, 'iptalde stok geri geldi');

-- pending iptali stoğa dokunmaz
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
```

- [ ] **Step 2: Testin düştüğünü doğrula**

Run: `npx supabase db reset` → `npx supabase test db supabase/tests/003_stock_ledger.sql`
Expected: FAIL — `relation "public.stock_movements" does not exist`; ayrıca `cancel_order` yok.

- [ ] **Step 3: Migration'ı yaz**

`supabase/migrations/20261113000002_admin_data_foundation.sql` — stok bölümü:

```sql
-- ─────────────────────── stok denetim izi ───────────────────────
create type stock_reason as enum ('initial', 'manual', 'sale', 'cancel', 'return');

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  delta int not null check (delta <> 0),
  stock_after int not null check (stock_after >= 0),
  reason stock_reason not null,
  order_id uuid references public.orders (id) on delete restrict,
  actor_id uuid references public.profiles (id) on delete set null,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  constraint stock_movements_order_reason_chk
    check (reason not in ('sale', 'cancel', 'return') or order_id is not null)
);

-- Aynı sipariş + ürün + sebep iki kez yazılamaz → webhook ve çift iptal idempotent.
create unique index stock_movements_order_reason_uidx
  on public.stock_movements (order_id, product_id, reason) where order_id is not null;
create index stock_movements_product_idx
  on public.stock_movements (product_id, created_at desc);

alter table public.stock_movements enable row level security;

-- Yazma yalnız SECURITY DEFINER fonksiyonlardan; okuma admin (Task 4'te politika).
revoke all on public.stock_movements from anon, authenticated;
grant select on public.stock_movements to authenticated;
-- Hardening'in `grant all ... to service_role` bloğu bu tablodan ÖNCE koştu; açıkça tekrarla.
grant all on public.stock_movements to service_role;

-- Denetim izi değiştirilemez: update/delete her zaman hata verir.
create or replace function public.stock_movements_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'stock_movements_immutable';
end;
$$;

create trigger stock_movements_no_update_delete
  before update or delete on public.stock_movements
  for each row execute function public.stock_movements_immutable();
```

`mark_order_paid`'in hareket yazan sürümü (aynı imza, `create or replace` ACL'i korur):

```sql
create or replace function public.mark_order_paid(p_order_id uuid, p_payment_ref text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.order_status;
  v_ref text;
  v_after int;
  r record;
begin
  select status, payment_ref into v_status, v_ref
    from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_status = 'paid' and v_ref is not distinct from p_payment_ref then
    return;  -- idempotent
  end if;
  if v_status <> 'pending' then
    raise exception 'order_not_pending';
  end if;

  -- Ürün başına TEK hareket: aynı ürün iki kalemde geçse bile stok tek kez düşer
  -- ve unique indekse çakışma olmaz.
  for r in
    select oi.product_id, sum(oi.qty)::int as qty
      from public.order_items oi
     where oi.order_id = p_order_id
     group by oi.product_id
     order by oi.product_id
  loop
    update public.products
       set stock = stock - r.qty
     where id = r.product_id and stock >= r.qty
    returning stock into v_after;

    if not found then
      raise exception 'insufficient_stock';
    end if;

    insert into public.stock_movements (product_id, delta, stock_after, reason, order_id)
    values (r.product_id, -r.qty, v_after, 'sale', p_order_id);
  end loop;

  update public.orders set status = 'paid', payment_ref = p_payment_ref where id = p_order_id;
end;
$$;

revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;
```

İptal RPC'si:

```sql
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_status public.order_status;
  v_after int;
  r record;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select status into v_status
    from public.orders where id = p_order_id and profile_id = v_uid for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_status not in ('pending', 'paid') then
    raise exception 'invalid_order_transition';
  end if;

  if v_status = 'paid' then
    -- Yalnızca gerçekten düşülmüş stok geri gelir (pending iptali stoğa dokunmaz).
    for r in
      select product_id, (-sum(delta))::int as qty
        from public.stock_movements
       where order_id = p_order_id and reason = 'sale'
       group by product_id
    loop
      -- İade daha önce yapıldıysa stoğa DOKUNMA. Kontrol, stok artışından ÖNCE olmalı;
      -- aksi hâlde "önce artır, sonra çakışmayı yut" sessiz çift iade üretir.
      if exists (
        select 1 from public.stock_movements
         where order_id = p_order_id and product_id = r.product_id and reason = 'cancel'
      ) then
        continue;
      end if;

      update public.products set stock = stock + r.qty
       where id = r.product_id
      returning stock into v_after;

      -- Çakışma olursa yutma: unique indeks son savunma hattıdır, hata tüm işlemi geri alır.
      insert into public.stock_movements
        (product_id, delta, stock_after, reason, order_id, actor_id)
      values
        (r.product_id, r.qty, v_after, 'cancel', p_order_id, v_uid);
    end loop;
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

revoke all on function public.cancel_order(uuid) from public, anon, authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npx supabase db reset` → `npx supabase test db supabase/tests/003_stock_ledger.sql`
Expected: `1..12`, tümü `ok`

Ek kanıt (yarış): iki eşzamanlı iptal tek iade üretmeli. `select ... for update` sipariş satırını
serileştirir; ikinci çağrı `cancelled` görüp `invalid_order_transition` ile reddedilir. Ürün başına
`cancel` hareketinin varlığı stok artışından **önce** kontrol edilir; unique indeks yalnızca son
savunma hattıdır (çakışma olursa işlem hata verir, sessizce yutulmaz).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261113000002_admin_data_foundation.sql supabase/tests/003_stock_ledger.sql
git commit -m "feat(db): stok denetim izi ve iptalde stok iadesi"
```

---

### Task 4: Admin yetkisi — `user_roles`, kendi kendine yükseltilemez

> `profiles.role` **kullanılmıyor.** `DATABASE_RULES` §4: *"roller ayrı `user_roles` tablosunda veya `app_metadata`'da; `profiles`'a kendi kendine yükseltilebilir rol kolonu koyma."* Bu, önceki Dilim 1 planındaki `profiles.role` tasarımını geçersiz kılar.

**Files:**
- Modify: `supabase/migrations/20261113000002_admin_data_foundation.sql`
- Create: `supabase/tests/004_admin_role.sql`

**Interfaces:**
- Consumes: `public.profiles`, `public.products`, `public.stock_movements`, `public.reviews`, `public.orders`
- Produces: `public.app_role` enum, `public.user_roles` tablosu, `public.is_admin() returns boolean`, `public.upsert_product(...) returns uuid`, `public.set_product_price(uuid, numeric)`, `public.set_product_active(uuid, boolean)`, `public.moderate_review(uuid, boolean)`, `public.advance_order_status(uuid, public.order_status)`, `public.set_product_stock(uuid, int, text) returns int`, `cancel_order`'ın admin yetkili sürümü

- [ ] **Step 1: Düşen testi yaz**

`supabase/tests/004_admin_role.sql` — fixture + `plan(13)`:

```sql
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
```

- [ ] **Step 2: Testin düştüğünü doğrula**

Run: `npx supabase db reset` → `npx supabase test db supabase/tests/004_admin_role.sql`
Expected: FAIL — `relation "public.user_roles" does not exist`

- [ ] **Step 3: Migration'a ekle**

```sql
-- ─────────────────────── roller ───────────────────────
create type app_role as enum ('customer', 'technician', 'b2b', 'admin');

create table public.user_roles (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles (id) on delete set null,
  primary key (profile_id, role)
);

alter table public.user_roles enable row level security;

create policy "user_roles_select_self" on public.user_roles for select to authenticated
  using ((select auth.uid()) = profile_id);

-- INSERT/UPDATE/DELETE politikası YOK → istemci yazamaz. Rol ataması yalnız
-- service_role / SQL ile yapılır (bkz. README).
revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where profile_id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- ─────────────────────── admin yazma yüzeyi: YALNIZ RPC (§7) ───────────────────────
-- products.price, reviews.is_approved, orders.status istemciden yazılamaz (RULES §6, §13#7).
-- Bu yüzden tablo/kolon düzeyinde yazma yetkisi VERİLMEZ; yalnız okuma politikaları açılır.

alter table public.products add column updated_at timestamptz not null default now();
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create policy "products_admin_select" on public.products for select to authenticated
  using ((select public.is_admin()));

create policy "stock_movements_admin_select" on public.stock_movements for select to authenticated
  using ((select public.is_admin()));

create policy "reviews_admin_select" on public.reviews for select to authenticated
  using ((select public.is_admin()));

create policy "orders_admin_select" on public.orders for select to authenticated
  using ((select public.is_admin()));

-- Ürün oluştur/güncelle (silme yok: RULES §8 "products silinmez, is_active=false").
create or replace function public.upsert_product(
  p_id uuid,
  p_slug text,
  p_name text,
  p_category public.product_category,
  p_price_try numeric,
  p_summary text default null,
  p_is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_price_try is null or p_price_try < 0 then
    raise exception 'invalid_price';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'invalid_slug';
  end if;
  if p_name is null or char_length(p_name) > 200 then
    raise exception 'invalid_name';
  end if;

  if p_id is null then
    insert into public.products (slug, name, category, price_try, summary, is_active)
    values (p_slug, p_name, p_category, p_price_try, p_summary, p_is_active)
    returning id into v_id;
  else
    update public.products
       set slug = p_slug, name = p_name, category = p_category,
           price_try = p_price_try, summary = p_summary, is_active = p_is_active
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'product_not_found';
    end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.set_product_price(p_product_id uuid, p_price_try numeric)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_price_try is null or p_price_try < 0 then
    raise exception 'invalid_price';
  end if;
  update public.products set price_try = p_price_try where id = p_product_id;
  if not found then
    raise exception 'product_not_found';
  end if;
end;
$$;

create or replace function public.set_product_active(p_product_id uuid, p_is_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  update public.products set is_active = p_is_active where id = p_product_id;
  if not found then
    raise exception 'product_not_found';
  end if;
end;
$$;

create or replace function public.moderate_review(p_review_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  update public.reviews set is_approved = p_approve where id = p_review_id;
  if not found then
    raise exception 'review_not_found';
  end if;
end;
$$;

-- Sipariş durumunu yalnız paid SONRASI adımlarda ilerletir.
-- 'paid' → mark_order_paid (ödeme), 'cancelled' → cancel_order (stok iadesi) kullanır.
create or replace function public.advance_order_status(
  p_order_id uuid,
  p_new_status public.order_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_new_status not in ('shipped', 'delivered', 'installed') then
    raise exception 'use_order_workflow';
  end if;
  update public.orders set status = p_new_status where id = p_order_id;
  if not found then
    raise exception 'order_not_found';
  end if;
end;
$$;

-- cancel_order'ın Task 3'teki gövdesi aynen korunur; tek fark sahiplik koşulu:
--   where id = p_order_id and (profile_id = v_uid or public.is_admin()) for update;
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_status public.order_status;
  v_after int;
  r record;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select status into v_status
    from public.orders
   where id = p_order_id and (profile_id = v_uid or public.is_admin())
   for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_status not in ('pending', 'paid') then
    raise exception 'invalid_order_transition';
  end if;

  if v_status = 'paid' then
    for r in
      select product_id, (-sum(delta))::int as qty
        from public.stock_movements
       where order_id = p_order_id and reason = 'sale'
       group by product_id
    loop
      -- İade daha önce yapıldıysa stoğa DOKUNMA; kontrol artıştan ÖNCE olmalı.
      if exists (
        select 1 from public.stock_movements
         where order_id = p_order_id and product_id = r.product_id and reason = 'cancel'
      ) then
        continue;
      end if;

      update public.products set stock = stock + r.qty
       where id = r.product_id
      returning stock into v_after;

      insert into public.stock_movements
        (product_id, delta, stock_after, reason, order_id, actor_id)
      values
        (r.product_id, r.qty, v_after, 'cancel', p_order_id, v_uid);
    end loop;
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

revoke all on function public.upsert_product(uuid, text, text, public.product_category, numeric, text, boolean)
  from public, anon, authenticated;
grant execute on function public.upsert_product(uuid, text, text, public.product_category, numeric, text, boolean)
  to authenticated;

revoke all on function public.set_product_price(uuid, numeric) from public, anon, authenticated;
grant execute on function public.set_product_price(uuid, numeric) to authenticated;

revoke all on function public.set_product_active(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_product_active(uuid, boolean) to authenticated;

revoke all on function public.moderate_review(uuid, boolean) from public, anon, authenticated;
grant execute on function public.moderate_review(uuid, boolean) to authenticated;

revoke all on function public.advance_order_status(uuid, public.order_status)
  from public, anon, authenticated;
grant execute on function public.advance_order_status(uuid, public.order_status) to authenticated;

revoke all on function public.cancel_order(uuid) from public, anon, authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
```

Elle stok girişi (admin paneli ilk adedi buradan girer):

```sql
create or replace function public.set_product_stock(
  p_product_id uuid,
  p_new_stock int,
  p_note text default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current int;
  v_delta int;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_new_stock is null or p_new_stock < 0 then
    raise exception 'invalid_stock';
  end if;

  select stock into v_current from public.products where id = p_product_id for update;
  if not found then
    raise exception 'product_not_found';
  end if;

  v_delta := p_new_stock - v_current;
  if v_delta = 0 then
    return v_current;
  end if;

  update public.products set stock = p_new_stock where id = p_product_id;

  insert into public.stock_movements
    (product_id, delta, stock_after, reason, actor_id, note)
  values
    (p_product_id, v_delta, p_new_stock,
     case when v_current = 0 and p_note is not null then 'initial' else 'manual' end,
     (select auth.uid()), p_note);

  return p_new_stock;
end;
$$;

revoke all on function public.set_product_stock(uuid, int, text) from public, anon, authenticated;
grant execute on function public.set_product_stock(uuid, int, text) to authenticated;
```

> Neden tablo/kolon grant'i yok: `grant update (status)` verilseydi admin paneli `pending → paid`
> geçişini `mark_order_paid`'i atlayarak yapabilirdi — ödeme alınmadan `paid`, stok düşmeden satış.
> Bu yüzden durum ilerletme `advance_order_status` RPC'sine, fiyat/stok/onay yazımı da ayrı RPC'lere
> taşındı. `mark_order_paid` hâlâ tek ödeme kanalıdır (service_role).

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npx supabase db reset` → `npx supabase test db supabase/tests/004_admin_role.sql`
Expected: `1..13`, tümü `ok`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261113000002_admin_data_foundation.sql supabase/tests/004_admin_role.sql
git commit -m "feat(db): user_roles tabanli admin yetkisi ve urun yonetimi RLS"
```

---

### Task 5: `b2b_leads` anon insert'ini kaldır, sunucu ucuna taşı

> Karar: **anon insert kaldırılır.** `DATABASE_RULES` §8: *"üretimde form Route Handler üzerinden (Turnstile/hCaptcha + rate limit) service_role ile yazılmalı; o gün anon insert grant'i kaldırılır."* Bu görev o günü bugüne alır.

**Files:**
- Modify: `supabase/migrations/20261113000002_admin_data_foundation.sql`
- Create: `supabase/tests/005_b2b_anon_closed.sql`
- Create: `web/src/lib/rate-limit.ts`
- Create: `web/src/lib/rate-limit.test.ts`
- Create: `web/src/app/api/b2b-lead/route.ts`
- Modify: `web/src/lib/validation.ts`
- Modify: `web/src/components/b2b/b2b-form.tsx`

**Interfaces:**
- Consumes: `public.b2b_leads`, `b2bLeadSchema`
- Produces: `POST /api/b2b-lead` → `{ id: string }` (201) / `{ error: string }` (400, 429, 500); `checkRateLimit(key: string, limit: number, windowMs: number): boolean`

- [ ] **Step 1: Düşen testleri yaz**

`supabase/tests/005_b2b_anon_closed.sql` — fixture + `plan(3)`:

```sql
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
```

`web/src/lib/rate-limit.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, __resetRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => { __resetRateLimit(); vi.useRealTimers(); });

  it("limit altindaki istekleri gecirir", () => {
    expect(checkRateLimit("ip-1", 3, 60_000)).toBe(true);
    expect(checkRateLimit("ip-1", 3, 60_000)).toBe(true);
    expect(checkRateLimit("ip-1", 3, 60_000)).toBe(true);
  });

  it("limit asilinca reddeder", () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit("ip-2", 3, 60_000);
    expect(checkRateLimit("ip-2", 3, 60_000)).toBe(false);
  });

  it("anahtarlari ayri tutar", () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit("ip-3", 3, 60_000);
    expect(checkRateLimit("ip-4", 3, 60_000)).toBe(true);
  });

  it("pencere dolunca yeniden izin verir", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i += 1) checkRateLimit("ip-5", 3, 1000);
    expect(checkRateLimit("ip-5", 3, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(checkRateLimit("ip-5", 3, 1000)).toBe(true);
  });
});
```

- [ ] **Step 2: Testlerin düştüğünü doğrula**

Run: `npx supabase db reset` → `npx supabase test db supabase/tests/005_b2b_anon_closed.sql`
Expected: FAIL — insert **başarılı olur** (grant hâlâ açık).
Run: `cd web && npx vitest run src/lib/rate-limit.test.ts`
Expected: FAIL — `Cannot find module './rate-limit'`

- [ ] **Step 3: Migration'ı ve kodu yaz**

Migration eki:

```sql
-- anon form yazımı sunucuya taşındı; doğrudan istemci insert'i kapalı.
drop policy if exists "b2b_leads_insert" on public.b2b_leads;

-- KRİTİK: tablo düzeyi REVOKE, hardening'in verdiği KOLON grant'lerini silmez.
-- Önce kolon yetkileri, sonra tablo yetkisi kaldırılır; kalanı has_column_privilege ile test edilir.
revoke insert (company, contact_name, phone, sector, city, message)
  on public.b2b_leads from anon, authenticated;
revoke all on public.b2b_leads from anon, authenticated;
```

`web/src/lib/rate-limit.ts` — süreç-içi sabit pencere; **tek örnek** varsayımıyla çalışır, çok örnekli dağıtımda Redis/Upstash'e taşınmalı. Map süresi dolmuş anahtarlardan temizlenir, aksi hâlde sahte anahtarlar belleği büyütür:

```ts
const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 5_000;

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function __resetRateLimit(): void {
  buckets.clear();
}
```

`web/src/app/api/b2b-lead/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { b2bLeadSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_BODY_BYTES = 8 * 1024;

// IP yalnızca AÇIKÇA güvenilen proxy başlığından okunur. Varsayılan kapalıdır:
// aksi hâlde istemci her istekte farklı `cf-connecting-ip` gönderip limiti atlatır.
function clientKey(request: Request): string {
  if (process.env.TRUSTED_PROXY !== "true") return "client";

  const trusted =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return trusted || "client"; // başlık yoksa tek kova → bypass yok
}

// Gövdeyi akış olarak, kümülatif BAYT sayarak okur: content-length uydurulsa da
// (chunked istek), sınır aşıldığında okuma iptal edilir ve bellek şişmez.
async function readLimitedBody(request: Request, max: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

export async function POST(request: Request) {
  if (!checkRateLimit(clientKey(request), LIMIT, WINDOW_MS)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  const raw = await readLimitedBody(request, MAX_BODY_BYTES);
  if (raw === null) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = b2bLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("b2b_leads")
    .insert({
      company: parsed.data.company,
      contact_name: parsed.data.contactName,
      phone: parsed.data.phone,
      city: parsed.data.city,
      sector: parsed.data.sector,
      message: parsed.data.message ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
```

`web/src/lib/validation.ts` — `b2bLeadSchema` alanlarına DB `check` kısıtlarıyla uyumlu üst sınır ekle (aksi hâlde 400 yerine 500 döner):

```ts
company: z.string().trim().min(2, "Firma adı zorunlu").max(200, "Firma adı çok uzun"),
contactName: z.string().trim().min(2, "İletişim kişisi zorunlu").max(120, "İletişim kişisi çok uzun"),
city: z.string().trim().min(2, "Şehir zorunlu").max(80, "Şehir çok uzun"),
message: z.string().trim().max(2000, "Mesaj en fazla 2000 karakter").optional(),
```

`b2b-form.tsx` düzeltmesi: `addB2BLead(parsed.data)` yerine

```ts
const response = await fetch("/api/b2b-lead", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(parsed.data),
});
if (!response.ok) throw new Error("lead_failed");
const { id } = (await response.json()) as { id: string };
setReference(id);
```

Demo modda Supabase yapılandırılmamışsa istek `500` döner; form bunu mevcut `error` dalında gösterir. Demo store bağımlılığı kaldırılır (kullanılmıyorsa import silinir).

- [ ] **Step 4: Testlerin geçtiğini doğrula**

Run: `npx supabase db reset` → `npx supabase test db supabase/tests/005_b2b_anon_closed.sql` → `1..3`, `ok`
Run: `cd web && npx vitest run src/lib/rate-limit.test.ts` → 4 test `ok`
Run: `cd web && npx tsc --noEmit` → temiz
Run: `cd web && npx vitest run` → mevcut testler yeşil

Ek doğrulama — tarayıcı DevTools'da anon key ile `POST /rest/v1/b2b_leads` → **401/403** dönmeli.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261113000002_admin_data_foundation.sql supabase/tests/005_b2b_anon_closed.sql web/src/lib/rate-limit.ts web/src/lib/rate-limit.test.ts web/src/app/api/b2b-lead/route.ts web/src/components/b2b/b2b-form.tsx
git commit -m "feat(security): b2b lead yazimini sunucuya tasi ve anon insert'i kapat"
```

---

### Task 6: `config.toml`, üretilmiş tipler ve katalog seed'i

**Files:**
- Modify: `supabase/config.toml`
- Create: `supabase/seed.sql`
- Create: `web/src/lib/supabase/database.types.ts` (üretilir)

**Interfaces:**
- Consumes: tamamlanmış şema
- Produces: `Database` tipi; `seed.sql` içinde katalog verisi

- [ ] **Step 1: `config.toml`'u düzelt**

`DATABASE_RULES` §9 gereği:

- `[auth.email] enable_confirmations = true`
- `[db.seed] enabled = true`, `sql_paths = ["./seed.sql"]`
- `additional_redirect_urls` yalnızca tam adresler (joker yok)

- [ ] **Step 2: `seed.sql` yaz**

Yalnızca katalog/referans verisi, idempotent:

```sql
insert into public.products (slug, name, category, price_try, stock, summary, is_active)
values ('aquapure-p350', 'AquaPure P350', 'device', 12490.00, 8, '3 kademeli reverse osmosis', true)
on conflict (slug) do update
  set name = excluded.name, price_try = excluded.price_try, summary = excluded.summary;
```

`DATABASE_RULES` §3: `products` silinmez, `is_active=false` yapılır — seed de silmez.

- [ ] **Step 3: Tipleri üret**

```powershell
npx supabase gen types typescript --local > web/src/lib/supabase/database.types.ts
```

Elle düzenleme yok. `web/src/lib/supabase/client.ts` → `createClient<Database>(url, anonKey, ...)`.

- [ ] **Step 5: CI'a veritabanı kapısını ekle**

`docs/DATABASE_RULES.md` §2 "her PR'da `supabase db reset` hatasız" diyor; bu dilimin varlık nedeni
tam olarak "init.sql çalışmıyordu ve kimse fark etmedi". Bu yüzden kontrol CI'a bağlanır.

`.github/workflows/ci.yml` — yeni, bağımsız iş:

```yaml
  db:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Sürüm sabit: sürpriz CLI güncellemesi migration davranışını kaydırmasın.
      - uses: supabase/setup-cli@v1
        with:
          version: 3.1.0
      - run: supabase start
      - run: supabase db reset
      - run: supabase test db
      - if: always()
        run: supabase stop --no-backup
```

- [ ] **Step 6: Doğrula**

Run: `npx supabase db reset` → hata yok, seed uygulanır.
Run: `cd web && npx tsc --noEmit` → temiz.
Run: `cd web && npx vitest run` → yeşil.
Run: `npx supabase test db` → tüm dosyalar yeşil.

- [ ] **Step 7: Commit**

```bash
git add supabase/config.toml supabase/seed.sql web/src/lib/supabase/database.types.ts web/src/lib/supabase/client.ts .github/workflows/ci.yml
git commit -m "chore(db): e-posta dogrulamasi, seed, uretilmis tipler ve CI db kapisi"
```

---

### Task 7: Dokümantasyon, admin atama ve Definition of Done

**Files:**
- Create: `supabase/README.md`
- Modify: `docs/DATABASE_RULES.md` (yalnızca uygulanmış gerçeği yansıtacak not)

**Interfaces:**
- Consumes: Task 1–6
- Produces: yönetici atama prosedürü (UUID tabanlı), çalıştırma komutları

- [ ] **Step 1: README'yi yaz**

```markdown
# Supabase — yerel geliştirme

## Komutlar
npx supabase start
npx supabase db reset      # migration + seed, sıfırdan
npx supabase test db       # pgTAP
npx supabase status

## Yönetici atama
Rol asla e-posta ile atanmaz (e-posta doğrulanmamışken ele geçirilebilir).
Önce kullanıcı bir kez giriş yapar, sonra UUID ile:

select id, full_name from public.profiles where id = '<KULLANICI_UUID>';

insert into public.user_roles (profile_id, role)
values ('<KULLANICI_UUID>', 'admin')
on conflict do nothing;

Kontrol:
select p.id, p.full_name, r.role
  from public.user_roles r join public.profiles p on p.id = r.profile_id
 where r.role = 'admin';

## Notlar
- `20261111000001_init.sql` yalnızca çalışmama hatası için düzeltildi (immutable generated kolon).
- İstemci `orders`, `order_items`, `appointments`, `subscriptions`, `user_roles`, `stock_movements` yazamaz.
- `b2b_leads` yalnız `POST /api/b2b-lead` üzerinden yazılır.
```

- [ ] **Step 2: DoD'yi doğrula**

Hepsi kanıtlanmış olmalı:

- `npx supabase db reset` sıfırdan hatasız (Task 1 blocker'ı).
- `npx supabase test db` → 5 dosya `All tests successful.`
- Saldırılar engelli: sahte `paid` sipariş, elle fiyat, onaysız yorum, abonelik fatura alanı, slotsuz randevu, `resolved` ticket, anon lead insert, anon `mark_order_paid`, kendine admin.
- Admin bile siparişi doğrudan `paid` yapamıyor (`advance_order_status` reddediyor); fiyat/onay/stok yazımı yalnız RPC'den.
- `products`/`reviews`/`orders` üzerinde istemciye verilmiş tablo veya kolon yazma yetkisi yok: `has_table_privilege('authenticated','public.products','UPDATE')` → `false`.
- `anon` `b2b_leads` üzerinde ne tablo ne kolon düzeyinde insert yetkisi taşımıyor (`has_column_privilege` → `false`).
- `paid` sipariş iptalinde stok geri geliyor; `pending` iptali stoğa dokunmuyor; webhook iki kez gelince stok iki kez düşmüyor.
- `stock_movements` update/delete reddediliyor (`stock_movements_immutable`).
- `cd web && npx vitest run && npx tsc --noEmit` temiz.
- `database.types.ts` commit'li.
- CI'da `db` işi `supabase db reset` + `supabase test db` koşuyor ve yeşil.
- `has_table_privilege('service_role', 'public.stock_movements', 'SELECT')` → `true` (yeni tablolar hardening'in `grant all` bloğundan sonra oluştu).

- [ ] **Step 3: Commit**

```bash
git add supabase/README.md docs/DATABASE_RULES.md
git commit -m "docs(db): yerel komutlar, UUID tabanli admin atama ve DoD"
```

---

## Bilinen ve bilinçli kabul edilen açıklar

Bunlar bu dilimde kapanmıyor; yol haritasına taşınır:

1. **Stok rezervasyonu yok.** `create_order` yalnız kontrol eder; stok `mark_order_paid` anında düşer. Son ürün için 10 kişi pending sipariş açabilir, 9'u ödeme anında `insufficient_stock` alır. İş kararı: rezervasyon (TTL'li hold) Faz 2.1'e.
2. **Rate limit süreç-içi ve proxy başlığına bağlı.** Çok örnekli dağıtımda Upstash/Redis gerekir. Proxy başlıkları yalnızca `TRUSTED_PROXY=true` iken okunur (varsayılan kapalı); açıldığında başlığı platformun yazdığı doğrulanmalı, aksi hâlde istemci IP uydurup limiti atlar.
3. **Turnstile/hCaptcha yok.** Route handler hazır; anahtar eklenince `token` doğrulaması eklenecek.
4. **Slot üretimi.** Hangi cron/RPC'nin slot açtığı henüz tanımlı değil (§8).
5. **KVKK tabloları** (`consents`, `audit_log`, `payments`, `outbox_events`) yok (§10).
6. **`regions.active_customers` herkese açık** — iş kararı; gizli tutulacaksa public view'a taşınır.

## Sonraki dilim

Dilim 1 — admin panel UI (ürün ekleme, fiyat/stok, dashboard). Bu plandaki `is_admin()`, `user_roles`, `set_product_stock` ve RLS üzerine kurulur; `profiles.role` tasarımı kullanılmaz.
