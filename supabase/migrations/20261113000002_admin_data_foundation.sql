-- 20261113000002_admin_data_foundation.sql
-- Amaç: yönetici panelinin veri temeli — stok denetim izi, iptalde stok iadesi,
-- user_roles tabanlı admin yetkisi ve b2b_leads anon insert'inin kapatılması.
-- Önkoşul: 20261111000001_init.sql + 20261113000001_security_hardening.sql
-- Kural: docs/DATABASE_RULES.md

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

-- Yazma yalnız SECURITY DEFINER fonksiyonlardan; okuma admin (aşağıda politika).
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


-- ─────────────────────── ödeme onayı: stok düşüşü + hareket ───────────────────────
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


-- ─────────────────────── iptal: stok iadesi ───────────────────────
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
-- service_role / SQL ile yapılır (bkz. supabase/README.md).
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

-- cancel_order'ın gövdesi aynen korunur; tek fark sahiplik koşulu:
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


-- ─────────────────────── elle stok girişi ───────────────────────
-- Admin paneli ürünün başlangıç adedini buradan girer; her değişiklik harekete yazılır.
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
     (case when v_current = 0 and p_note is not null then 'initial' else 'manual' end)::public.stock_reason,
     (select auth.uid()), p_note);

  return p_new_stock;
end;
$$;

revoke all on function public.set_product_stock(uuid, int, text) from public, anon, authenticated;
grant execute on function public.set_product_stock(uuid, int, text) to authenticated;


-- ─────────────────────── b2b formu: yazma sunucuya taşındı ───────────────────────
-- Anon form yazımı artık POST /api/b2b-lead üzerinden service_role ile yapılır.
drop policy if exists "b2b_leads_insert" on public.b2b_leads;

-- KRİTİK: tablo düzeyi REVOKE, hardening'in verdiği KOLON grant'lerini silmez.
-- Önce kolon yetkileri, sonra tablo yetkisi kaldırılır; kalanı has_column_privilege ile test edilir.
revoke insert (company, contact_name, phone, sector, city, message)
  on public.b2b_leads from anon, authenticated;
revoke all on public.b2b_leads from anon, authenticated;
