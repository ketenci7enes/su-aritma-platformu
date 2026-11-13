-- 20261113000001_security_hardening.sql
-- Amaç: istemcinin fiyat/durum/onay alanlarını kendi belirlemesini engellemek,
-- iş mantığını (sipariş, randevu, abonelik) güvenli RPC'lere taşımak,
-- yetkileri en az ayrıcalığa indirmek. Bkz. docs/DATABASE_RULES.md

-- ───────────────────────── 1) Fonksiyon güvenliği (search_path) ─────────────────────────
alter function public.set_updated_at() set search_path = '';
alter function public.release_expired_slot_holds() set search_path = '';

-- handle_new_user: metadata'dan gelen veriyi doğrula; geçersiz telefon kayıt akışını bozmasın.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := new.raw_user_meta_data ->> 'phone';
begin
  if v_phone is not null and v_phone !~ '^[+0-9 ()-]{10,20}$' then
    v_phone := null;
  end if;
  insert into public.profiles (id, full_name, phone)
  values (new.id, left(new.raw_user_meta_data ->> 'full_name', 120), v_phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ───────────────────────── 2) Eski/tehlikeli politikalar ve fonksiyonlar ─────────────────────────
drop policy "profiles_select_own" on public.profiles;
drop policy "profiles_update_own" on public.profiles;
drop policy "profiles_insert_own" on public.profiles;
drop policy "addresses_all_own" on public.addresses;
drop policy "orders_select_own" on public.orders;
drop policy "orders_insert_own" on public.orders;
drop policy "order_items_select_own" on public.order_items;
drop policy "order_items_insert_own" on public.order_items;
drop policy "installations_select_own" on public.installations;
drop policy "subscriptions_select_own" on public.subscriptions;
drop policy "subscriptions_update_own" on public.subscriptions;
drop policy "appointments_select_own" on public.appointments;
drop policy "appointments_insert_own" on public.appointments;
drop policy "slots_read_free" on public.appointment_slots;
drop policy "tickets_select_own" on public.support_tickets;
drop policy "tickets_insert_own" on public.support_tickets;
drop policy "b2b_leads_public_insert" on public.b2b_leads;
drop policy "reviews_public_read" on public.reviews;
drop policy "reviews_insert_own" on public.reviews;

-- Kimlik parametresi alan eski imzalar kalkar; kimlik her zaman auth.uid()'den gelir.
drop function public.hold_appointment_slot(uuid, uuid);
drop function public.confirm_appointment_slot(uuid, uuid);

-- ───────────────────────── 3) Şema eklemeleri ─────────────────────────
alter table public.order_items add column product_name text;            -- sipariş anı snapshot'ı
create unique index orders_payment_ref_uidx on public.orders (payment_ref) where payment_ref is not null;

alter table public.appointments add column slot_id uuid references public.appointment_slots (id) on delete set null;
create unique index appointments_slot_uidx on public.appointments (slot_id) where status = 'booked';

-- Doğrulama kısıtları (DB'de de doğrula)
alter table public.profiles
  add constraint profiles_phone_chk check (phone is null or phone ~ '^[+0-9 ()-]{10,20}$'),
  add constraint profiles_full_name_len check (full_name is null or char_length(full_name) <= 120);
alter table public.addresses
  add constraint addresses_len_chk check (char_length(title) <= 60 and char_length(il) <= 60
    and char_length(ilce) <= 60 and char_length(line) <= 300),
  add constraint addresses_phone_chk check (phone is null or phone ~ '^[+0-9 ()-]{10,20}$');
alter table public.support_tickets
  add constraint support_tickets_note_len check (note is null or char_length(note) <= 2000);
alter table public.reviews
  add constraint reviews_len_chk check (char_length(text) <= 2000 and char_length(author_name) <= 80);
alter table public.b2b_leads
  add constraint b2b_leads_len_chk check (char_length(company) <= 200 and char_length(contact_name) <= 120
    and char_length(city) <= 80 and char_length(sector) <= 40 and (message is null or char_length(message) <= 2000)),
  add constraint b2b_leads_phone_chk check (phone ~ '^[+0-9 ()-]{10,20}$');

-- Kullanıcı başına tek varsayılan adres
create unique index addresses_one_default_uidx on public.addresses (profile_id) where is_default;

create or replace function public.addresses_single_default()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_default then
    update public.addresses set is_default = false
     where profile_id = new.profile_id and id <> new.id and is_default;
  end if;
  return new;
end;
$$;

create trigger addresses_single_default
  before insert or update of is_default on public.addresses
  for each row execute function public.addresses_single_default();

-- Sipariş durum makinesi (service_role dahil herkes için geçerli)
create or replace function public.enforce_order_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if not (
         (old.status = 'pending'   and new.status in ('paid', 'cancelled'))
      or (old.status = 'paid'      and new.status in ('shipped', 'cancelled'))
      or (old.status = 'shipped'   and new.status = 'delivered')
      or (old.status = 'delivered' and new.status = 'installed')
    ) then
      raise exception 'invalid_order_transition: % -> %', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;

create trigger orders_status_transition
  before update of status on public.orders
  for each row execute function public.enforce_order_status_transition();

-- FK indexleri
create index appointments_technician_idx on public.appointments (technician_id);
create index appointments_installation_idx on public.appointments (installation_id);
create index appointments_order_idx on public.appointments (order_id);
create index installations_order_idx on public.installations (order_id);
create index installations_product_idx on public.installations (product_id);
create index subscriptions_device_idx on public.subscriptions (device_id);
create index order_items_product_idx on public.order_items (product_id);
create index reviews_profile_idx on public.reviews (profile_id);
create index reviews_product_idx on public.reviews (product_id);
create index support_tickets_installation_idx on public.support_tickets (installation_id);
create index appointment_slots_held_by_idx on public.appointment_slots (held_by) where held_by is not null;

-- ───────────────────────── 4) RLS politikaları (yeniden) ─────────────────────────
create policy "profiles_select_own" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "addresses_select_own" on public.addresses for select to authenticated
  using ((select auth.uid()) = profile_id);
create policy "addresses_insert_own" on public.addresses for insert to authenticated
  with check ((select auth.uid()) = profile_id);
create policy "addresses_update_own" on public.addresses for update to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "addresses_delete_own" on public.addresses for delete to authenticated
  using ((select auth.uid()) = profile_id);

create policy "orders_select_own" on public.orders for select to authenticated
  using ((select auth.uid()) = profile_id);
create policy "order_items_select_own" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.profile_id = (select auth.uid())));

create policy "installations_select_own" on public.installations for select to authenticated
  using ((select auth.uid()) = profile_id);
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated
  using ((select auth.uid()) = profile_id);
create policy "appointments_select_own" on public.appointments for select to authenticated
  using ((select auth.uid()) = profile_id);

create policy "slots_read_free" on public.appointment_slots for select to authenticated
  using (
    status = 'free'
    or (status = 'held' and held_until < now())
    or held_by = (select auth.uid())
  );

create policy "tickets_select_own" on public.support_tickets for select to authenticated
  using ((select auth.uid()) = profile_id);
create policy "tickets_insert_own" on public.support_tickets for insert to authenticated
  with check (
    (select auth.uid()) = profile_id
    and status = 'open'
    and (installation_id is null
         or exists (select 1 from public.installations i
                    where i.id = installation_id and i.profile_id = (select auth.uid())))
  );

create policy "b2b_leads_insert" on public.b2b_leads for insert to anon, authenticated
  with check (status = 'new');

create policy "reviews_read" on public.reviews for select to anon, authenticated
  using (is_approved or (select auth.uid()) = profile_id);
create policy "reviews_insert_verified" on public.reviews for insert to authenticated
  with check (
    (select auth.uid()) = profile_id
    and is_approved = false
    and product_id is not null
    and exists (
      select 1
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
       where o.profile_id = (select auth.uid())
         and o.status in ('delivered', 'installed')
         and oi.product_id = reviews.product_id
    )
  );

-- ───────────────────────── 5) RPC'ler ─────────────────────────
-- Sipariş: fiyat/toplam/adres sunucuda belirlenir. İstemci yalnızca {product_id, qty} ve adres id'si yollar.
create or replace function public.create_order(p_items jsonb, p_address_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_addr public.addresses%rowtype;
  v_p public.products%rowtype;
  v_order_id uuid;
  v_total numeric(10, 2) := 0;
  r record;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'invalid_items';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as i(product_id uuid, qty int)
     where i.product_id is null or i.qty is null or i.qty < 1 or i.qty > 100
  ) then
    raise exception 'invalid_items';
  end if;

  select * into v_addr from public.addresses where id = p_address_id and profile_id = v_uid;
  if not found then
    raise exception 'invalid_address';
  end if;

  insert into public.orders (profile_id, status, total_try, shipping_address)
  values (v_uid, 'pending', 0, jsonb_build_object(
    'title', v_addr.title, 'il', v_addr.il, 'ilce', v_addr.ilce, 'line', v_addr.line, 'phone', v_addr.phone))
  returning id into v_order_id;

  for r in
    select i.product_id, sum(i.qty)::int as qty
      from jsonb_to_recordset(p_items) as i(product_id uuid, qty int)
     group by i.product_id
  loop
    select * into v_p from public.products where id = r.product_id and is_active;
    if not found then
      raise exception 'product_unavailable';
    end if;
    if v_p.stock < r.qty then
      raise exception 'insufficient_stock';
    end if;
    insert into public.order_items (order_id, product_id, qty, unit_price, product_name)
    values (v_order_id, v_p.id, r.qty, v_p.price_try, v_p.name);
    v_total := v_total + v_p.price_try * r.qty;
  end loop;

  update public.orders set total_try = v_total where id = v_order_id;
  return v_order_id;
end;
$$;

-- Ödeme onayı: yalnızca service_role (webhook). Stok burada atomik düşer; tekrar gelen webhook zararsız.
create or replace function public.mark_order_paid(p_order_id uuid, p_payment_ref text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.order_status;
  v_ref text;
  r record;
begin
  select status, payment_ref into v_status, v_ref from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_status = 'paid' and v_ref is not distinct from p_payment_ref then
    return;  -- idempotent
  end if;
  if v_status <> 'pending' then
    raise exception 'order_not_pending';
  end if;
  for r in select product_id, qty from public.order_items where order_id = p_order_id loop
    update public.products set stock = stock - r.qty where id = r.product_id and stock >= r.qty;
    if not found then
      raise exception 'insufficient_stock';
    end if;
  end loop;
  update public.orders set status = 'paid', payment_ref = p_payment_ref where id = p_order_id;
end;
$$;

-- Slot tut (10 dk). Kullanıcı başına tek aktif hold; başarısız denemede eski hold korunur.
create or replace function public.hold_appointment_slot(p_slot_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_updated int;
begin
  if v_uid is null or p_slot_id is null then
    return false;
  end if;

  perform public.release_expired_slot_holds();

  update public.appointment_slots
     set status = 'held', held_until = now() + interval '10 minutes', held_by = v_uid
   where id = p_slot_id
     and slot_start > now()
     and (status = 'free' or (status = 'held' and held_until < now()));
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    return false;
  end if;

  update public.appointment_slots
     set status = 'free', held_until = null, held_by = null
   where held_by = v_uid and status = 'held' and id <> p_slot_id;
  return true;
end;
$$;

-- Hold'u randevuya çevir: slotu 'booked' yapar ve appointments satırını aynı transaction'da oluşturur.
create or replace function public.book_appointment(
  p_slot_id uuid,
  p_type public.appointment_type default 'install',
  p_order_id uuid default null,
  p_installation_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_slot public.appointment_slots%rowtype;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_slot from public.appointment_slots where id = p_slot_id for update;
  if not found or v_slot.status <> 'held' or v_slot.held_by is distinct from v_uid
     or v_slot.held_until is null or v_slot.held_until <= now() then
    raise exception 'slot_not_held';
  end if;

  if p_order_id is not null
     and not exists (select 1 from public.orders where id = p_order_id and profile_id = v_uid) then
    raise exception 'invalid_order';
  end if;
  if p_installation_id is not null
     and not exists (select 1 from public.installations where id = p_installation_id and profile_id = v_uid) then
    raise exception 'invalid_installation';
  end if;
  if (select count(*) from public.appointments
       where profile_id = v_uid and status = 'booked' and slot_start > now()) >= 5 then
    raise exception 'too_many_appointments';
  end if;

  update public.appointment_slots set status = 'booked', held_until = null where id = p_slot_id;

  insert into public.appointments (profile_id, technician_id, slot_id, slot_start, type, order_id, installation_id)
  values (v_uid, v_slot.technician_id, p_slot_id, v_slot.slot_start, p_type, p_order_id, p_installation_id)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.cancel_appointment(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_slot_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  update public.appointments set status = 'cancelled'
   where id = p_appointment_id and profile_id = v_uid and status = 'booked' and slot_start > now()
   returning slot_id into v_slot_id;
  if not found then
    raise exception 'cannot_cancel';
  end if;
  if v_slot_id is not null then
    update public.appointment_slots set status = 'free', held_by = null, held_until = null where id = v_slot_id;
  end if;
end;
$$;

create or replace function public.set_subscription_status(p_subscription_id uuid, p_status public.subscription_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_cur public.subscription_status;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select status into v_cur from public.subscriptions
   where id = p_subscription_id and profile_id = v_uid for update;
  if not found then
    raise exception 'subscription_not_found';
  end if;
  if not (
       (v_cur = 'active' and p_status in ('paused', 'cancelled'))
    or (v_cur = 'paused' and p_status in ('active', 'cancelled'))
  ) then
    raise exception 'invalid_subscription_transition';
  end if;
  update public.subscriptions set status = p_status where id = p_subscription_id;
end;
$$;

-- ───────────────────────── 6) Yetkiler (en son; en az ayrıcalık) ─────────────────────────
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from public, anon, authenticated;

-- Herkese açık katalog
grant select on public.products, public.regions, public.water_hardness, public.reviews to anon, authenticated;

-- Kullanıcıya özel okuma
grant select on public.profiles, public.addresses, public.orders, public.order_items, public.installations,
  public.subscriptions, public.appointments, public.appointment_slots, public.support_tickets to authenticated;

-- Yazma: yalnızca gereken kolonlar (status/is_approved/fiyat gibi alanlar istemciden yazılamaz)
grant update (full_name, phone) on public.profiles to authenticated;
grant insert, update, delete on public.addresses to authenticated;
grant insert (profile_id, installation_id, issue_type, note) on public.support_tickets to authenticated;
grant insert (profile_id, product_id, author_name, city, rating, text) on public.reviews to authenticated;
grant insert (company, contact_name, phone, sector, city, message) on public.b2b_leads to anon, authenticated;

-- RPC'ler
grant execute on function public.create_order(jsonb, uuid) to authenticated;
grant execute on function public.hold_appointment_slot(uuid) to authenticated;
grant execute on function public.book_appointment(uuid, public.appointment_type, uuid, uuid) to authenticated;
grant execute on function public.cancel_appointment(uuid) to authenticated;
grant execute on function public.set_subscription_status(uuid, public.subscription_status) to authenticated;

-- mark_order_paid ve release_expired_slot_holds yalnızca service_role / cron
grant all on all tables in schema public to service_role;
grant all on all functions in schema public to service_role;
