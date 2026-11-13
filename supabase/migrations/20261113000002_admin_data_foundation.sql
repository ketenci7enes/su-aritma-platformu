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
