# FAZ 3 / Dilim 1 — Yönetici Paneli Veri Temeli: Uygulama Planı

> ## ⛔ BU PLAN GEÇERSİZ — yerine `2026-11-13-faz-3-dilim-0-veri-guvenligi.md`
>
> 12–13 Kasım 2026'da gelen `DATABASE_RULES.md` (bağlayıcı) ve test edilmiş
> `20261113000001_security_hardening.sql` bu plandaki altı kararı geçersiz kıldı:
>
> 1. **Migration sırası yanlış:** `20261112000001_admin_panel.sql`, `20261113000001_security_hardening.sql`'den **önce** sıralanır. Hardening'in `revoke all` bloğu admin panelinin tüm grant'lerini silerdi. Yeni dilim `20261113000002_admin_data_foundation.sql` kullanır.
> 2. **`profiles.role` yasak:** `DATABASE_RULES` §4 rolü ayrı `user_roles` tablosunda (veya `app_metadata`) istiyor. Yeni tasarım `user_roles` + `is_admin()`.
> 3. **Stok trigger'ı kaldırıldı:** Stok artık `mark_order_paid` (service_role) içinde düşer. Bu plandaki `on_order_status_change` trigger'ı eklenirse stok **iki kez** düşerdi.
> 4. **`init.sql` hiç çalışmıyordu:** `filter_due_at ... generated always as (installed_at + interval '180 days')` immutable olmadığı için `db reset` hata veriyordu. Bu plandaki tüm "db reset + test" adımları havada kalıyordu.
> 5. **Hata mesajları:** Türkçe `raise exception` metinleri yerine makine-okunur kodlar (`insufficient_stock`) zorunlu (§7).
> 6. **Test listesi eksikti:** `DATABASE_RULES` §12'deki 11 saldırı sınıfı ve `paid → cancelled` stok iadesi bu planda yoktu.
>
> Tarihsel kayıt olarak saklanır. Uygulanacak plan: `docs/superpowers/plans/2026-11-13-faz-3-dilim-0-veri-guvenligi.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yönetici rolünü, ürün/stok şemasını ve satışta otomatik stok düşüşünü veritabanında kurmak; RLS ve stok davranışını gerçek pgTAP testleriyle kanıtlamak.

**Architecture:** Tek yeni migration dosyası (`20261112000001_admin_panel.sql`) mevcut `init.sql`'i değiştirmeden üstüne ekler. Yetki tek kaynaktan gelir: `public.is_admin()` (SECURITY DEFINER). Stok değişimi yalnız SECURITY DEFINER fonksiyonlardan ve `orders` durum tetikleyicisinden yapılır; `stock_movements` değiştirilemez denetim izidir. Testler pgTAP ile `supabase test db` üzerinden koşar ve `request.jwt.claims` ile gerçek RLS davranışını doğrular.

**Tech Stack:** PostgreSQL 15 (Supabase local), Supabase CLI 3.1.0 (`npx supabase`), pgTAP, Docker Desktop.

**Spec:** `docs/superpowers/plans/2026-11-11-su-aritma-platformu-yol-haritasi.md` — bölüm **FAZ 3**, alt bölümler 3.0–3.10. Bu dilim yalnız veritabanı katmanını kapsar (görev listesi 3.1–3.5).

---

## Global Constraints

- **`supabase/migrations/20261111000001_init.sql` DEĞİŞTİRİLMEZ.** Tüm eklemeler yeni dosyaya gider.
- Tüm zaman damgaları `timestamptz`; tüm fiyatlar `numeric(10,2)`; para birimi TRY.
- Her yeni tabloda RLS **açık** olmalı; politika tanımlanmayan işlem reddedilir.
- `service_role` anahtarı hiçbir istemci dosyasına girmez; bu dilimde anahtar hiç kullanılmaz.
- Yeni kullanıcıya dönük metinlerde Türkçe hata mesajı kullanılır (fonksiyon `raise exception` metinleri).
- Conventional Commits; **her görev tek commit**; her commit `git-push-guard` hook'undan geçer.
- Mevcut test paketi bozulmaz: `cd web && npx vitest run` → 15 dosya / 102 test yeşil kalmalı.
- `npx supabase` kullanılır (global kurulum yok). Komutlar depo kökünden, `supabase/` dizininin üstünden çalıştırılır.
- Docker Desktop açık olmalı: `docker info` başarılı dönmelidir.

### Ortam hazırlığı (ilk görevden önce, bir kez)

```powershell
docker info --format "{{.ServerVersion}}"   # boş/hata verirse Docker Desktop'ı başlatın
npx supabase start                           # ilk çalıştırmada imajları indirir (5-10 dk)
npx supabase status                          # API URL 54321, DB 54322 görünmeli
```

### Ortak pgTAP test fixture'ı

Her test dosyası bağımsız koşar ve şu iskeleti kullanır. `plan(N)` değeri dosyadaki assertion sayısıdır.

```sql
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions, auth;

-- pgTAP fonksiyonları `extensions` şemasındadır; kısıtlı rollerle assertion
-- çalıştırabilmek için bu izin gerekir (transaction içinde, rollback ile geri alınır).
grant usage on schema extensions to anon, authenticated;

-- Test kullanıcıları: auth.users insert'i handle_new_user trigger'ını tetikler,
-- böylece public.profiles satırı otomatik doğar.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin@test.local', '',
   now(), now(), now(), '{}', '{}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'musteri@test.local', '',
   now(), now(), now(), '{}', '{}');
```

Kullanıcı olarak işlem yapma kalıbı (her kullanımdan sonra `reset role` zorunlu):

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
-- ... assertion ...
reset role;
```

Test komutu: `npx supabase test db` (tüm dosyalar) veya
`npx supabase test db supabase/tests/001_admin_role.sql`.

---

## Review Focus

Bu dilimin sessizce kırılabilecek beş yeri, en olasıdan başlayarak:

1. **Kendini admin yapma** — müşteri kendi `profiles` satırını `update ... set role='admin'` ile yükseltebiliyorsa tüm yetki modeli çöker. RLS satır düzeyidir, kolonu korumaz; kolon yetkisi kapatılmalı. (Task 1)
2. **Sahte "ödedim" siparişi** — istemci doğrudan `status='paid'` sipariş yazabilirse tetikleyici sahte satışla stok düşürür. Sipariş oluşturma istemciden kaldırılmalı. (Task 7)
3. **Son adet yarışı** — aynı ürünün son adedi için iki eşzamanlı satış ikisi de başarılı olursa stok negatife düşer. `update ... where stock >= qty` koşulu şart. (Task 5)
4. **Aynı `paid` olayının tekrarı** — webhook veya çift tetik stok iki kez düşürür. `sale` hareketi idempotent olmalı. (Task 5)
5. **Pending iptali** — hiç düşülmemiş sipariş iptal edilince stok **artmamalı**; yoksa bedava stok üretilir. (Task 5)

---

## Dosya Yapısı

| Dosya | Sorumluluk |
|---|---|
| `supabase/migrations/20261112000001_admin_panel.sql` | Tüm şema değişiklikleri (tek dosya, görevler sırayla ekler) |
| `supabase/tests/001_admin_role.sql` | Rol modeli + `is_admin()` + yetki yükseltme engeli |
| `supabase/tests/002_products_schema.sql` | `products` yeni kolonları ve kısıtları |
| `supabase/tests/003_stock_movements_schema.sql` | Hareket tablosu kısıtları ve idempotency indeksi |
| `supabase/tests/004_set_product_stock.sql` | Elle stok girişi fonksiyonu |
| `supabase/tests/005_order_stock.sql` | Satışta düşüş, iptalde artış, idempotency, yetersiz stok |
| `supabase/tests/006_products_rls.sql` | Ürün ve hareket tablosu RLS'i |
| `supabase/tests/007_orders_hardening.sql` | Sipariş oluşturmanın istemciden kaldırılması |
| `supabase/README.md` | Yerel komutlar + admin atama SQL'i (yeni dosya) |

---

### Task 1: Rol modeli, `is_admin()` ve yetki yükseltme engeli

**Files:**
- Create: `supabase/migrations/20261112000001_admin_panel.sql`
- Create: `supabase/tests/001_admin_role.sql`

**Interfaces:**
- Consumes: `public.profiles` (id, full_name, phone), `auth.users`, `handle_new_user()` trigger
- Produces: `public.user_role` enum (`'customer' | 'admin'`), `public.profiles.role`, `public.is_admin() returns boolean`

- [ ] **Step 1: Düşen testi yaz**

`supabase/tests/001_admin_role.sql` — ortak fixture + `plan(5)`:

```sql
select is(
  (select role::text from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  'customer', 'yeni profil varsayılan olarak customer');

update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111';

select ok(public.is_admin() is not true, 'oturum yokken is_admin false');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select ok(public.is_admin(), 'admin kullanıcı için is_admin true');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok(public.is_admin() is not true, 'müşteri için is_admin false');
select throws_ok(
  $$update public.profiles set role = 'admin'
    where id = '22222222-2222-2222-2222-222222222222'$$,
  '42501', null, 'müşteri kendini admin yapamaz');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Testin düştüğünü doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/001_admin_role.sql`
Expected: FAIL — `column "role" does not exist` / `function public.is_admin() does not exist`

- [ ] **Step 3: Migration'ı yaz**

`supabase/migrations/20261112000001_admin_panel.sql`:

```sql
-- FAZ 3 — Yönetici paneli veri temeli
-- Mevcut init şemasını değiştirmez; yalnız ekler.

create type user_role as enum ('customer', 'admin');

alter table public.profiles
  add column role user_role not null default 'customer';

create index profiles_admin_idx on public.profiles (id) where role = 'admin';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- KRİTİK: RLS satır düzeyidir, kolonu korumaz. Bu kısım olmadan herhangi bir
-- müşteri "update profiles set role='admin'" ile kendini yönetici yapabilir.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
revoke insert on public.profiles from authenticated;
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/001_admin_role.sql`
Expected: `ok 1` … `ok 5`, `1..5`, `All tests successful.`

Ek doğrulama (yönetici atamanın hâlâ çalıştığını kanıtla):

```powershell
npx supabase db reset
# Studio'da veya psql'de:
# update public.profiles set role='admin' where id='<uuid>';
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261112000001_admin_panel.sql supabase/tests/001_admin_role.sql
git commit -m "feat(db): admin rolu, is_admin() ve yetki yukseltme engeli"
```

---

### Task 2: `products` alanları, slug kısıtı ve `updated_at`

**Files:**
- Modify: `supabase/migrations/20261112000001_admin_panel.sql` (dosya sonuna ekle)
- Create: `supabase/tests/002_products_schema.sql`

**Interfaces:**
- Consumes: `public.products` (id, slug, category, price_try, stock), `public.set_updated_at()`
- Produces: `products.sku`, `products.cost_try`, `products.low_stock_note`, `products.updated_at`

- [ ] **Step 1: Düşen testi yaz**

`supabase/tests/002_products_schema.sql` — ortak fixture + `plan(6)`:

```sql
select has_column('public', 'products', 'updated_at', 'updated_at kolonu var');
select has_column('public', 'products', 'sku', 'sku kolonu var');
select has_column('public', 'products', 'cost_try', 'cost_try kolonu var');
select has_column('public', 'products', 'low_stock_note', 'low_stock_note kolonu var');

select throws_ok(
  $$insert into public.products (slug, name, category, price_try)
    values ('Gecersiz Slug!', 'X', 'device', 10)$$,
  '23514', null, 'gecersiz slug bicimi reddedilir');

insert into public.products (id, slug, name, category, price_try, stock)
values ('33333333-3333-3333-3333-333333333333', 'test-urun', 'Test Ürün', 'device', 100, 10);

update public.products set name = 'Test Ürün 2'
 where id = '33333333-3333-3333-3333-333333333333';

select ok(
  (select updated_at > created_at from public.products
    where id = '33333333-3333-3333-3333-333333333333'),
  'guncellemede updated_at ilerler');
```

- [ ] **Step 2: Testin düştüğünü doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/002_products_schema.sql`
Expected: FAIL — `column "updated_at" does not exist` (test 1)

- [ ] **Step 3: Migration'a ekle**

```sql
-- ─────────────────────────── products tamamlanması ───────────────────────────
alter table public.products
  add column updated_at timestamptz not null default now(),
  add column sku text,
  add column cost_try numeric(10, 2),
  add column low_stock_note text;

alter table public.products
  add constraint products_sku_unique unique (sku),
  add constraint products_cost_try_check check (cost_try is null or cost_try >= 0),
  add constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/002_products_schema.sql`
Expected: `1..6`, tümü `ok`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261112000001_admin_panel.sql supabase/tests/002_products_schema.sql
git commit -m "feat(db): products sku, maliyet ve updated_at alanlari"
```

---

### Task 3: `stock_movements` denetim tablosu

**Files:**
- Modify: `supabase/migrations/20261112000001_admin_panel.sql`
- Create: `supabase/tests/003_stock_movements_schema.sql`

**Interfaces:**
- Consumes: `public.products`, `public.orders`, `public.profiles`
- Produces: `public.stock_movements` (id, product_id, delta, stock_after, reason, order_id, actor_id, note, created_at) — yalnız ekleme

- [ ] **Step 1: Düşen testi yaz**

`supabase/tests/003_stock_movements_schema.sql` — ortak fixture + `plan(5)`:

```sql
select has_table('public', 'stock_movements', 'stock_movements tablosu var');

insert into public.products (id, slug, name, category, price_try, stock)
values ('33333333-3333-3333-3333-333333333333', 'test-urun', 'Test Ürün', 'device', 100, 10);

select throws_ok(
  $$insert into public.stock_movements (product_id, delta, stock_after, reason)
    values ('33333333-3333-3333-3333-333333333333', 0, 10, 'manual')$$,
  '23514', null, 'sifir delta reddedilir');

select throws_ok(
  $$insert into public.stock_movements (product_id, delta, stock_after, reason)
    values ('33333333-3333-3333-3333-333333333333', -1, -5, 'manual')$$,
  '23514', null, 'negatif stock_after reddedilir');

-- Idempotency: aynı sipariş + ürün için ikinci 'sale' hareketi yazılamaz.
-- (order_id NULL olan kayıtlar kısmi unique indekste çakışmaz; bu yüzden gerçek sipariş gerekir.)
insert into public.orders (id, profile_id, status, total_try)
values ('44444444-4444-4444-4444-444444444444',
        '22222222-2222-2222-2222-222222222222', 'pending', 100);

insert into public.stock_movements (product_id, delta, stock_after, reason, order_id)
values ('33333333-3333-3333-3333-333333333333', -1, 9, 'sale',
        '44444444-4444-4444-4444-444444444444');

select throws_ok(
  $$insert into public.stock_movements (product_id, delta, stock_after, reason, order_id)
    values ('33333333-3333-3333-3333-333333333333', -1, 8, 'sale',
            '44444444-4444-4444-4444-444444444444')$$,
  '23505', null, 'ayni siparis+urun icin ikinci sale hareketi reddedilir');

select has_index('public', 'stock_movements', 'stock_movements_sale_order_uidx',
  'sale idempotency indeksi var');
```

- [ ] **Step 2: Testin düştüğünü doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/003_stock_movements_schema.sql`
Expected: FAIL — `relation "public.stock_movements" does not exist`

- [ ] **Step 3: Migration'a ekle**

```sql
-- ─────────────────────────── stok hareketleri ───────────────────────────
create type stock_reason as enum ('initial', 'manual', 'sale', 'cancel', 'return');

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  delta int not null check (delta <> 0),
  stock_after int not null check (stock_after >= 0),
  reason stock_reason not null,
  order_id uuid references public.orders (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index stock_movements_product_idx
  on public.stock_movements (product_id, created_at desc);
create index stock_movements_order_idx
  on public.stock_movements (order_id) where order_id is not null;
create unique index stock_movements_sale_order_uidx
  on public.stock_movements (order_id, product_id) where reason = 'sale';

-- Yalnız ekleme: update/delete politikası tanımlanmaz.
alter table public.stock_movements enable row level security;
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/003_stock_movements_schema.sql`
Expected: `1..5`, tümü `ok`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261112000001_admin_panel.sql supabase/tests/003_stock_movements_schema.sql
git commit -m "feat(db): stock_movements denetim tablosu"
```

---

### Task 4: `set_product_stock()` — elle stok girişi

**Files:**
- Modify: `supabase/migrations/20261112000001_admin_panel.sql`
- Create: `supabase/tests/004_set_product_stock.sql`

**Interfaces:**
- Consumes: `public.is_admin()`, `public.products.stock`, `public.stock_movements`
- Produces: `public.set_product_stock(p_product_id uuid, p_new_stock int, p_note text default null) returns int`

- [ ] **Step 1: Düşen testi yaz**

`supabase/tests/004_set_product_stock.sql` — ortak fixture + `plan(6)`:

```sql
insert into public.products (id, slug, name, category, price_try, stock)
values ('33333333-3333-3333-3333-333333333333', 'test-urun', 'Test Ürün', 'device', 100, 20);

-- 1) müşteri çağıramaz
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$select public.set_product_stock('33333333-3333-3333-3333-333333333333', 5, null)$$,
  '42501', null, 'musteri stok belirleyemez');
reset role;

-- 2) admin belirler
update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111';
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is(public.set_product_stock('33333333-3333-3333-3333-333333333333', 5, 'sayım'),
          5, 'admin yeni stok adedini doner');
reset role;

select is((select stock from public.products where id = '33333333-3333-3333-3333-333333333333'),
          5, 'urun stogu guncellendi');

select is((select delta from public.stock_movements
            where product_id = '33333333-3333-3333-3333-333333333333' and reason = 'manual'),
          -15, 'hareket kaydi deltayi tutar');

select is((select note from public.stock_movements
            where product_id = '33333333-3333-3333-3333-333333333333' and reason = 'manual'),
          'sayım', 'not kaydedilir');

-- 3) negatif stok reddedilir
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok(
  $$select public.set_product_stock('33333333-3333-3333-3333-333333333333', -1, null)$$,
  '22023', null, 'negatif stok reddedilir');
reset role;
```

- [ ] **Step 2: Testin düştüğünü doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/004_set_product_stock.sql`
Expected: FAIL — `function public.set_product_stock(uuid, integer, unknown) does not exist`

- [ ] **Step 3: Migration'a ekle**

```sql
-- ─────────────────────────── elle stok girişi ───────────────────────────
create or replace function public.set_product_stock(
  p_product_id uuid,
  p_new_stock int,
  p_note text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current int;
  v_delta int;
begin
  if not public.is_admin() then
    raise exception 'Bu islem icin yonetici yetkisi gerekli.'
      using errcode = '42501';
  end if;
  if p_new_stock is null or p_new_stock < 0 then
    raise exception 'Stok adedi negatif olamaz.' using errcode = '22023';
  end if;

  select stock into v_current
    from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Urun bulunamadi.' using errcode = 'P0002';
  end if;

  v_delta := p_new_stock - v_current;
  if v_delta = 0 then
    return v_current;
  end if;

  update public.products set stock = p_new_stock where id = p_product_id;

  insert into public.stock_movements
    (product_id, delta, stock_after, reason, actor_id, note)
  values
    (p_product_id, v_delta, p_new_stock, 'manual', auth.uid(), p_note);

  return p_new_stock;
end;
$$;

revoke all on function public.set_product_stock(uuid, int, text) from public;
grant execute on function public.set_product_stock(uuid, int, text) to authenticated;
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/004_set_product_stock.sql`
Expected: `1..6`, tümü `ok`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261112000001_admin_panel.sql supabase/tests/004_set_product_stock.sql
git commit -m "feat(db): set_product_stock RPC ve elle stok hareketi"
```

---

### Task 5: Satışta otomatik düşüş, iptalde geri artış

**Files:**
- Modify: `supabase/migrations/20261112000001_admin_panel.sql`
- Create: `supabase/tests/005_order_stock.sql`

**Interfaces:**
- Consumes: `public.orders`, `public.order_items`, `public.products.stock`, `public.stock_movements`
- Produces: `public.apply_order_stock(p_order_id uuid)`, `public.restore_order_stock(p_order_id uuid)`, trigger `orders_stock_after_status`

- [ ] **Step 1: Düşen testi yaz**

`supabase/tests/005_order_stock.sql` — ortak fixture + `plan(7)`:

```sql
insert into public.products (id, slug, name, category, price_try, stock)
values ('33333333-3333-3333-3333-333333333333', 'test-urun', 'Test Ürün', 'device', 100, 10);

insert into public.orders (id, profile_id, status, total_try)
values ('44444444-4444-4444-4444-444444444444',
        '22222222-2222-2222-2222-222222222222', 'pending', 300);

insert into public.order_items (order_id, product_id, qty, unit_price)
values ('44444444-4444-4444-4444-444444444444',
        '33333333-3333-3333-3333-333333333333', 3, 100);

-- 1) pending → paid: stok düşer
update public.orders set status = 'paid'
 where id = '44444444-4444-4444-4444-444444444444';

select is((select stock from public.products
            where id = '33333333-3333-3333-3333-333333333333'),
          7, 'satista stok 3 azaldi');

select is((select sum(delta)::int from public.stock_movements
            where order_id = '44444444-4444-4444-4444-444444444444' and reason = 'sale'),
          -3, 'sale hareketi yazildi');

-- 2) aynı duruma tekrar geçiş: değişmez (idempotent)
update public.orders set status = 'paid'
 where id = '44444444-4444-4444-4444-444444444444';

select is((select stock from public.products
            where id = '33333333-3333-3333-3333-333333333333'),
          7, 'ayni paid gecisi stogu ikinci kez dusurmez');

-- 3) yetersiz stok: sipariş paid olmaz, işlem geri alınır
insert into public.orders (id, profile_id, status, total_try)
values ('55555555-5555-5555-5555-555555555555',
        '22222222-2222-2222-2222-222222222222', 'pending', 800);
insert into public.order_items (order_id, product_id, qty, unit_price)
values ('55555555-5555-5555-5555-555555555555',
        '33333333-3333-3333-3333-333333333333', 8, 100);

select throws_ok(
  $$update public.orders set status = 'paid'
     where id = '55555555-5555-5555-5555-555555555555'$$,
  'P0001', null, 'yetersiz stokta satis reddedilir');

select is((select stock from public.products
            where id = '33333333-3333-3333-3333-333333333333'),
          7, 'basarisiz satista stok degismez');

select is((select status::text from public.orders
            where id = '55555555-5555-5555-5555-555555555555'),
          'pending', 'basarisiz satista siparis paid olmaz');

-- 4) paid → cancelled: stok geri gelir
update public.orders set status = 'cancelled'
 where id = '44444444-4444-4444-4444-444444444444';

select is((select stock from public.products
            where id = '33333333-3333-3333-3333-333333333333'),
          10, 'iptalde stok geri yukseldi');
```

- [ ] **Step 2: Testin düştüğünü doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/005_order_stock.sql`
Expected: FAIL — ilk `update ... paid` sonrası stok 10 kalır → `stok 3 azaldi` testi düşer

- [ ] **Step 3: Migration'a ekle**

```sql
-- ─────────────────────────── sipariş → stok köprüsü ───────────────────────────
create or replace function public.apply_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_after int;
begin
  if exists (
    select 1 from public.stock_movements
    where order_id = p_order_id and reason = 'sale'
  ) then
    return;
  end if;

  for r in
    select oi.product_id, sum(oi.qty)::int as qty
      from public.order_items oi
     where oi.order_id = p_order_id
     group by oi.product_id
     order by oi.product_id
  loop
    update public.products
       set stock = stock - r.qty
     where id = r.product_id
       and stock >= r.qty
    returning stock into v_after;

    if not found then
      raise exception 'Stok yetersiz: % adet (urun %)', r.qty, r.product_id
        using errcode = 'P0001';
    end if;

    insert into public.stock_movements
      (product_id, delta, stock_after, reason, order_id)
    values
      (r.product_id, -r.qty, v_after, 'sale', p_order_id);
  end loop;
end;
$$;

create or replace function public.restore_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_after int;
begin
  if exists (
    select 1 from public.stock_movements
    where order_id = p_order_id and reason in ('cancel', 'return')
  ) then
    return;
  end if;

  if not exists (
    select 1 from public.stock_movements
    where order_id = p_order_id and reason = 'sale'
  ) then
    return;   -- pending iptali: dusulmemis stok geri artmaz
  end if;

  for r in
    select product_id, (-sum(delta))::int as qty
      from public.stock_movements
     where order_id = p_order_id and reason = 'sale'
     group by product_id
  loop
    update public.products set stock = stock + r.qty
     where id = r.product_id
    returning stock into v_after;

    insert into public.stock_movements
      (product_id, delta, stock_after, reason, order_id)
    values
      (r.product_id, r.qty, v_after, 'cancel', p_order_id);
  end loop;
end;
$$;

create or replace function public.on_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    perform public.apply_order_stock(new.id);
  elsif new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    perform public.restore_order_stock(new.id);
  end if;
  return new;
end;
$$;

create trigger orders_stock_after_status
  after update of status on public.orders
  for each row execute function public.on_order_status_change();

-- Bu fonksiyonlar yalnız tetikleyiciden çalışmalı.
revoke all on function public.apply_order_stock(uuid) from public;
revoke all on function public.restore_order_stock(uuid) from public;
```

> **Neden `after update of status`, `after insert` değil?** Yeni sipariş `pending` doğar; `order_items`
> aynı işlemde sonradan eklenir. `insert`'te stok düşmek yarım ödemeleri de sayardı. Sipariş
> **her zaman `pending`** açılır, stok yalnız `paid`'e geçişte düşer.

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/005_order_stock.sql`
Expected: `1..7`, tümü `ok`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261112000001_admin_panel.sql supabase/tests/005_order_stock.sql
git commit -m "feat(db): satista otomatik stok dususu ve iptalde geri artis"
```

---

### Task 6: Ürün ve stok hareketi RLS politikaları

**Files:**
- Modify: `supabase/migrations/20261112000001_admin_panel.sql`
- Create: `supabase/tests/006_products_rls.sql`

**Interfaces:**
- Consumes: `public.is_admin()`, `public.products`, `public.stock_movements`
- Produces: `products_read_active`, `products_admin_read_all`, `products_admin_insert`, `products_admin_update`, `products_admin_delete`, `stock_movements_admin_read` politikaları + tablo yetkileri

- [ ] **Step 1: Düşen testi yaz**

`supabase/tests/006_products_rls.sql` — ortak fixture + `plan(8)`:

```sql
insert into public.products (id, slug, name, category, price_try, stock, is_active) values
  ('33333333-3333-3333-3333-333333333333', 'aktif-urun', 'Aktif', 'device', 100, 5, true),
  ('66666666-6666-6666-6666-666666666666', 'pasif-urun', 'Pasif', 'device', 100, 5, false);

insert into public.stock_movements (product_id, delta, stock_after, reason)
values ('33333333-3333-3333-3333-333333333333', -1, 4, 'manual');

update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111';

-- 1) anon yalnız aktif ürünü görür
set local role anon;
select is((select count(*)::int from public.products), 1, 'anon yalniz aktif urunu gorur');
reset role;

-- 2-3) müşteri yazamaz
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$insert into public.products (slug, name, category, price_try)
    values ('yeni-urun', 'Yeni', 'device', 100)$$,
  '42501', null, 'musteri urun ekleyemez');

-- DİKKAT: RLS UPDATE'i hata fırlatmaz, sessizce 0 satır günceller.
-- Bu yüzden "hata bekle" değil, "fiyat değişmedi" doğrulanır.
update public.products set price_try = 1
 where id = '33333333-3333-3333-3333-333333333333';

select is((select price_try from public.products
            where id = '33333333-3333-3333-3333-333333333333'),
          100::numeric, 'musteri fiyat degistiremez (RLS 0 satir gunceller)');

select is((select count(*)::int from public.stock_movements), 0,
          'musteri stok hareketlerini goremez');
reset role;

-- 4-6) admin her şeyi görür ve yazar
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is((select count(*)::int from public.products), 2, 'admin pasif urunleri de gorur');
insert into public.products (slug, name, category, price_try)
values ('yeni-urun', 'Yeni', 'device', 100);
select is((select count(*)::int from public.stock_movements), 1,
          'admin stok hareketlerini gorur');
reset role;

-- 7-8) yazma gerçekten kalıcı
select is((select count(*)::int from public.products where slug = 'yeni-urun'), 1,
          'admin urun ekleyebildi');
select is((select count(*)::int from public.products where is_active = false), 1,
          'pasif urun silinmeden korunur');
```

- [ ] **Step 2: Testin düştüğünü doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/006_products_rls.sql`
Expected: FAIL — Task 6 uygulanmadan `products` tablosuna `authenticated` için insert/update/delete
yetkisi hiç verilmemiş, bu yüzden "admin ürün ekleyebildi" (`ok 7`) düşer. Ayrıca admin pasif ürünleri
göremez (init'teki `products_public_read` yalnız `is_active` satırlarını açar) → `ok 5` de düşer.

- [ ] **Step 3: Migration'a ekle**

```sql
-- ─────────────────────────── ürün RLS'i ───────────────────────────
drop policy if exists "products_public_read" on public.products;

create policy "products_read_active" on public.products
  for select using (is_active = true);

create policy "products_admin_read_all" on public.products
  for select to authenticated using (public.is_admin());

create policy "products_admin_insert" on public.products
  for insert to authenticated with check (public.is_admin());

create policy "products_admin_update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "products_admin_delete" on public.products
  for delete to authenticated using (public.is_admin());

grant insert, update, delete on public.products to authenticated;

-- ─────────────────────────── hareket RLS'i ───────────────────────────
create policy "stock_movements_admin_read" on public.stock_movements
  for select to authenticated using (public.is_admin());

-- insert/update/delete yetkisi YOK: yazma yalnız SECURITY DEFINER fonksiyonlardan.
grant select on public.stock_movements to authenticated;
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/006_products_rls.sql`
Expected: `1..8`, tümü `ok`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261112000001_admin_panel.sql supabase/tests/006_products_rls.sql
git commit -m "feat(db): urun ve stok hareketi RLS politikalari"
```

---

### Task 7: Sipariş oluşturmayı istemciden kaldır

**Files:**
- Modify: `supabase/migrations/20261112000001_admin_panel.sql`
- Create: `supabase/tests/007_orders_hardening.sql`

**Interfaces:**
- Consumes: `public.orders`, `public.order_items`
- Produces: (kaldırma) `orders_insert_own` ve `order_items_insert_own` politikaları silinir; `insert` yetkisi `authenticated`'dan alınır

- [ ] **Step 1: Düşen testi yaz**

`supabase/tests/007_orders_hardening.sql` — ortak fixture + `plan(3)`:

```sql
insert into public.products (id, slug, name, category, price_try, stock)
values ('33333333-3333-3333-3333-333333333333', 'test-urun', 'Test Ürün', 'device', 100, 10);

-- Sipariş ve kalemi, test kullanıcısı adına önceden (postgres olarak) oluşturulur.
-- Aksi hâlde aşağıdaki 3. assertion FK ihlali (23503) alır ve "yetki reddi"ni kanıtlamaz.
insert into public.orders (id, profile_id, status, total_try)
values ('44444444-4444-4444-4444-444444444444',
        '22222222-2222-2222-2222-222222222222', 'pending', 100);

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select throws_ok(
  $$insert into public.orders (profile_id, status, total_try)
    values ('22222222-2222-2222-2222-222222222222', 'paid', 0)$$,
  '42501', null, 'musteri sahte paid siparis yazamaz');

select throws_ok(
  $$insert into public.orders (profile_id, status, total_try)
    values ('22222222-2222-2222-2222-222222222222', 'pending', 100)$$,
  '42501', null, 'musteri pending siparis de yazamaz');

select throws_ok(
  $$insert into public.order_items (order_id, product_id, qty, unit_price)
    values ('44444444-4444-4444-4444-444444444444',
            '33333333-3333-3333-3333-333333333333', 1, 0)$$,
  '42501', null, 'musteri siparis kalemi yazamaz');
reset role;
```

- [ ] **Step 2: Testin düştüğünü doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db supabase/tests/007_orders_hardening.sql`
Expected: FAIL — ilk iki insert **başarılı olur** (politika hâlâ açık), testler düşer

- [ ] **Step 3: Migration'a ekle**

```sql
-- ─────────────────────────── sipariş oluşturma sıkılaştırma ───────────────────────────
-- Istemci siparis olusturamaz: tutar ve durum sunucuda belirlenmeli.
-- Siparis olusturma Faz 2.1'de odeme webhook'una (service_role) tasinacak.
drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "order_items_insert_own" on public.order_items;

revoke insert on public.orders from authenticated;
revoke insert on public.order_items from authenticated;
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npx supabase db reset` ardından `npx supabase test db`
Expected: `1..3` (bu dosya) ve tüm dosyalar `All tests successful.`

Ek doğrulama — uygulama bozulmadı:

```powershell
cd web
npx vitest run      # 102 test yeşil kalmalı
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261112000001_admin_panel.sql supabase/tests/007_orders_hardening.sql
git commit -m "fix(db): istemcinin siparis olusturmasini kaldir"
```

---

### Task 8: `supabase/README.md` — çalıştırma ve yönetici atama notu

**Files:**
- Create: `supabase/README.md`

**Interfaces:**
- Consumes: tamamlanmış migration ve test komutları
- Produces: dokümantasyon (kod bağımlılığı yok)

- [ ] **Step 1: README'yi yaz**

İçerik şu başlıkları taşır (kısa, komut odaklı):

```markdown
# Supabase — yerel geliştirme

## Gereksinimler
- Docker Desktop açık
- Node 20+ (CLI `npx supabase` ile çalışır, global kurulum gerekmez)

## Komutlar
npx supabase start
npx supabase db reset          # migration'ları sıfırdan uygular
npx supabase test db           # pgTAP testleri
npx supabase status            # URL ve anahtarlar

## Yönetici atama
Önce kullanıcı magic link ile bir kez giriş yapmalı (profiles satırı doğar).

update public.profiles p
   set role = 'admin'
  from auth.users u
 where u.id = p.id
   and u.email = 'yonetici@ornek.com';

Kontrol:
select u.email, p.role
  from public.profiles p join auth.users u on u.id = p.id
 where p.role = 'admin';

## Notlar
- `20261111000001_init.sql` değiştirilmez; yeni değişiklikler yeni migration dosyasına gider.
- İstemci `orders`/`order_items` yazamaz (FAZ 3). Sipariş oluşturma Faz 2.1 webhook'una taşınacak.
```

- [ ] **Step 2: Doğrula**

Run: `Get-Content supabase/README.md`
Expected: dosya mevcut, yukarıdaki başlıkları içeriyor

- [ ] **Step 3: Commit**

```bash
git add supabase/README.md
git commit -m "docs(db): yerel supabase komutlari ve admin atama notu"
```

---

## Dilim 1 Definition of Done

- `npx supabase db reset` temiz çalışıyor; 8 test dosyası `All tests successful.`
- Müşteri kendini admin yapamıyor (`42501`) — testle kanıtlı.
- Admin ürün ekleyip fiyat/stok güncelleyebiliyor; müşteri yazamıyor — testle kanıtlı.
- `pending → paid` stoğu düşürüyor, tekrar `paid` düşürmüyor, yetersiz stokta satış reddediliyor,
  `paid → cancelled` stoğu geri getiriyor, `pending → cancelled` stoğa dokunmuyor — testle kanıtlı.
- Her stok değişikliği `stock_movements`'ta; tablo update/delete edilemiyor.
- İstemci sipariş oluşturamıyor — testle kanıtlı.
- `cd web && npx vitest run` → 102 test yeşil; `npx tsc --noEmit` temiz.
- Yeni migration `init.sql`'e dokunmadı (`git diff --stat supabase/migrations/20261111000001_init.sql` boş).
- Reviewer onayı alındı (AGENTS.md: `evren/deepseek-v4-flash`, düşerse `openrouter/nvidia/nemotron-3.5-lightning:free`).

## Sonraki dilim (bu plana dahil değil)

Dilim 2 — repository katmanı ve vitrinin DB'den okunması (yol haritası görev 3.6–3.7).
