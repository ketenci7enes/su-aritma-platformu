-- Su Arıtma Platformu — başlangıç şeması
-- Tüm zaman damgaları timestamptz (UTC depolama, Europe/Istanbul gösterim).
-- Tüm fiyatlar numeric(10,2). Her tabloda RLS açıktır.
-- Not: pgcrypto gerekmez; gen_random_uuid() PostgreSQL 13+ ile dahilidir.

-- ─────────────────────────────── enum'lar ───────────────────────────────
create type product_category as enum ('device', 'filter', 'part');
create type order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'installed', 'cancelled');
create type subscription_status as enum ('active', 'paused', 'cancelled');
create type appointment_status as enum ('booked', 'completed', 'cancelled');
create type appointment_type as enum ('install', 'filter_change', 'service');
create type slot_status as enum ('free', 'held', 'booked');
create type hardness_level as enum ('soft', 'medium', 'hard', 'very_hard');
create type ticket_issue as enum ('pressure', 'leak', 'taste', 'other');
create type ticket_status as enum ('open', 'assigned', 'resolved');
create type lead_status as enum ('new', 'contacted', 'won', 'lost');

-- ─────────────────────────────── yardımcılar ───────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────── profiles ───────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auth kullanıcısı oluşunca profil aç (magic link ile 1:1).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────── adresler ───────────────────────────────
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Ev',
  il text not null,
  ilce text not null,
  line text not null,
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index addresses_profile_idx on public.addresses (profile_id);

-- ─────────────────────────────── ürünler ───────────────────────────────
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category product_category not null,
  price_try numeric(10, 2) not null check (price_try >= 0),
  stages int,
  capacity_lpd int,
  specs jsonb not null default '{}'::jsonb,
  stock int not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  summary text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index products_category_idx on public.products (category);

-- ─────────────────────────────── siparişler ───────────────────────────────
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete restrict,
  status order_status not null default 'pending',
  total_try numeric(10, 2) not null check (total_try >= 0),
  payment_ref text,
  shipping_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_profile_idx on public.orders (profile_id, created_at desc);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  qty int not null check (qty > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0)
);

create index order_items_order_idx on public.order_items (order_id);

-- ─────────────────────────────── kurulum / abonelik ───────────────────────────────
create table public.installations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  installed_at timestamptz not null default now(),
  warranty_until timestamptz,
  -- Üretilmiş kolon DEĞİL: timestamptz + interval immutable olmadığı için
  -- generated ... stored kullanılamaz. Değer BEFORE INSERT trigger'ı ile yazılır.
  filter_due_at timestamptz,
  created_at timestamptz not null default now()
);

create index installations_profile_idx on public.installations (profile_id);

create or replace function public.set_filter_due_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Her zaman türet: istemci gönderse bile yok sayılır, installed_at düzeltilirse tazelenir.
  new.filter_due_at := new.installed_at + interval '180 days';
  return new;
end;
$$;

create trigger installations_filter_due
  before insert or update of installed_at on public.installations
  for each row execute function public.set_filter_due_at();

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  device_id uuid references public.products (id) on delete set null,
  status subscription_status not null default 'active',
  next_billing_at timestamptz,
  provider_ref text,
  created_at timestamptz not null default now()
);

create index subscriptions_profile_idx on public.subscriptions (profile_id);

-- ─────────────────────────────── bölge / teknisyen ───────────────────────────────
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  technician_count int not null default 0 check (technician_count >= 0),
  avg_install_hours int not null default 24 check (avg_install_hours > 0),
  active_customers int not null default 0 check (active_customers >= 0),
  map_x numeric(5, 2),
  map_y numeric(5, 2)
);

create table public.technicians (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  telegram_chat_id text,
  region_id uuid references public.regions (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index technicians_region_idx on public.technicians (region_id) where is_active;

-- ─────────────────────────────── randevular ───────────────────────────────
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  installation_id uuid references public.installations (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  technician_id uuid not null references public.technicians (id) on delete restrict,
  slot_start timestamptz not null,
  status appointment_status not null default 'booked',
  type appointment_type not null default 'install',
  created_at timestamptz not null default now()
);

create index appointments_profile_idx on public.appointments (profile_id, slot_start desc);

-- Aynı teknisyen + aynı başlangıç için iptal edilmemiş iki randevu olamaz.
-- Slot kilidini bypass eden doğrudan insert'lere karşı ikinci savunma hattı.
create unique index appointments_technician_start_uidx
  on public.appointments (technician_id, slot_start)
  where status = 'booked';

create table public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians (id) on delete cascade,
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  status slot_status not null default 'free',
  held_until timestamptz,
  held_by uuid references public.profiles (id) on delete set null,
  check (slot_end > slot_start)
);

-- Aynı teknisyen + aynı başlangıç iki kez olamaz (slot yarışı DB seviyesinde).
create unique index appointment_slots_technician_start_uidx
  on public.appointment_slots (technician_id, slot_start);

create index appointment_slots_open_idx
  on public.appointment_slots (slot_start)
  where status = 'free';

-- Slotu atomik olarak 10 dk süreyle tut. free ya da süresi dolmuş held ise başarılı.
create or replace function public.hold_appointment_slot(p_slot_id uuid, p_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  -- Kimlik taklidi ve kalıcı slot DoS'unu önle: yalnızca kendi profil adına hold.
  if p_slot_id is null or p_profile_id is null or auth.uid() is distinct from p_profile_id then
    return false;
  end if;

  -- Süresi dolmuş hold'ları fırsatçı olarak temizle (pg_cron yoksa da).
  perform public.release_expired_slot_holds();

  update public.appointment_slots
     set status = 'held',
         held_until = now() + interval '10 minutes',
         held_by = p_profile_id
   where id = p_slot_id
     and (status = 'free' or (status = 'held' and held_until < now()));

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function public.confirm_appointment_slot(p_slot_id uuid, p_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  -- Yalnızca kendi adına onaylama yapılabilir.
  if p_slot_id is null or p_profile_id is null or auth.uid() is distinct from p_profile_id then
    return false;
  end if;

  update public.appointment_slots
     set status = 'booked',
         held_until = null
   where id = p_slot_id
     and status = 'held'
     and held_by = p_profile_id
     and held_until > now();

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function public.release_expired_slot_holds()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update public.appointment_slots
     set status = 'free', held_until = null, held_by = null
   where status = 'held' and held_until < now();
  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- Süzülen hold'ları dakikada bir serbest bırak. pg_cron yoksa (local/dev)
-- hold RPC'si ve slots_read_free politikası süresi dolmuş hold'u zaten boş sayar.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;

    -- Idempotent: aynı isimli job varsa yeniden zamanlama.
    if not exists (select 1 from cron.job where jobname = 'release-expired-slot-holds') then
      perform cron.schedule(
        'release-expired-slot-holds',
        '* * * * *',
        'select public.release_expired_slot_holds()'
      );
    end if;
  end if;
exception when others then
  raise warning 'pg_cron schedule kurulamadı: %', sqlerrm;
end;
$$;

-- ─────────────────────────────── su sertliği ───────────────────────────────
create table public.water_hardness (
  id uuid primary key default gen_random_uuid(),
  il text not null,
  ilce text,
  hardness_ppm int not null check (hardness_ppm >= 0),
  level hardness_level not null,
  source text,
  unique nulls not distinct (il, ilce)
);

create index water_hardness_lookup_idx on public.water_hardness (il, ilce);

-- ─────────────────────────────── destek ───────────────────────────────
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  installation_id uuid references public.installations (id) on delete set null,
  issue_type ticket_issue not null,
  note text,
  status ticket_status not null default 'open',
  created_at timestamptz not null default now()
);

create index support_tickets_profile_idx on public.support_tickets (profile_id, created_at desc);

-- ─────────────────────────────── B2B ───────────────────────────────
create table public.b2b_leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text not null,
  phone text not null,
  sector text not null default 'horeca',
  city text not null,
  message text,
  status lead_status not null default 'new',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────── yorumlar ───────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  author_name text not null,
  city text,
  rating int not null check (rating between 1 and 5),
  text text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index reviews_approved_idx on public.reviews (created_at desc) where is_approved;

-- ─────────────────────────────── RLS ───────────────────────────────
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.installations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.regions enable row level security;
alter table public.technicians enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_slots enable row level security;
alter table public.water_hardness enable row level security;
alter table public.support_tickets enable row level security;
alter table public.b2b_leads enable row level security;
alter table public.reviews enable row level security;

-- profiles: yalnızca kendi kaydı
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- addresses: yalnızca kendi adresleri
create policy "addresses_all_own" on public.addresses for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- products: herkes aktif ürünleri okur (yazma yalnızca service role)
create policy "products_public_read" on public.products for select using (is_active);

-- orders / order_items: kendi siparişi
create policy "orders_select_own" on public.orders for select using (auth.uid() = profile_id);
create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = profile_id);
create policy "order_items_select_own" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()));
create policy "order_items_insert_own" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()));

-- installations / subscriptions: kendi kaydı
create policy "installations_select_own" on public.installations for select using (auth.uid() = profile_id);
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = profile_id);
create policy "subscriptions_update_own" on public.subscriptions for update
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- regions: herkes okur
create policy "regions_public_read" on public.regions for select using (true);

-- technicians: yalnızca giriş yapmış kullanıcı ad+telefon görmez; public okuma yok.
create policy "technicians_no_public_read" on public.technicians for select using (false);

-- appointments: kendi randevusu
create policy "appointments_select_own" on public.appointments for select using (auth.uid() = profile_id);
create policy "appointments_insert_own" on public.appointments for insert with check (auth.uid() = profile_id);

-- slots: giriş yapmış kullanıcı boş slotları görür; yazma yalnızca RPC/service role
create policy "slots_read_free" on public.appointment_slots for select
  to authenticated using (
    status = 'free'
    or (status = 'held' and held_until < now())
    or held_by = auth.uid()
  );

-- water_hardness: herkes okur
create policy "water_hardness_public_read" on public.water_hardness for select using (true);

-- support_tickets: kendi ticket'ı
create policy "tickets_select_own" on public.support_tickets for select using (auth.uid() = profile_id);
create policy "tickets_insert_own" on public.support_tickets for insert with check (auth.uid() = profile_id);

-- b2b_leads: formu herkes doldurabilir; okuma yalnızca service role
create policy "b2b_leads_public_insert" on public.b2b_leads for insert with check (true);

-- reviews: onaylı olanlar herkese; kendi yorumunu görebilir
create policy "reviews_public_read" on public.reviews for select using (is_approved or auth.uid() = profile_id);
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = profile_id);

-- ─────────────────────────────── yetkiler ───────────────────────────────
grant usage on schema public to anon, authenticated, service_role;
grant select on public.products, public.regions, public.water_hardness, public.reviews to anon, authenticated;
grant insert on public.b2b_leads to anon, authenticated;
grant select, insert, update on public.profiles, public.addresses, public.orders, public.order_items,
  public.installations, public.subscriptions, public.appointments, public.support_tickets,
  public.reviews to authenticated;
grant select on public.appointment_slots to authenticated;
grant execute on function public.hold_appointment_slot(uuid, uuid) to authenticated;
grant execute on function public.confirm_appointment_slot(uuid, uuid) to authenticated;
grant execute on function public.release_expired_slot_holds() to authenticated;
grant all on all tables in schema public to service_role;
grant all on all functions in schema public to service_role;
