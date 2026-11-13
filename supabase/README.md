# Supabase — yerel geliştirme

## Komutlar

```powershell
npx supabase start
npx supabase db reset      # migration + seed, sıfırdan
npx supabase test db       # pgTAP (supabase/tests/*.sql)
npx supabase status
npx supabase stop --no-backup
```

Tipleri yeniden üret (şema değiştiğinde):

```powershell
npx supabase gen types typescript --local > web/src/lib/supabase/database.types.ts
```

> PowerShell'de yönlendirme BOM/bozuk kodlama üretebilir; dosyayı UTF-8 (BOM'suz)
> yazın: `[System.IO.File]::WriteAllText($path, $out, (New-Object System.Text.UTF8Encoding($false)))`.

## Yönetici atama

Rol asla e-posta ile atanmaz (e-posta doğrulanmamışken ele geçirilebilir).
Önce kullanıcı bir kez giriş yapar, sonra UUID ile:

```sql
select id, full_name from public.profiles where id = '<KULLANICI_UUID>';

insert into public.user_roles (profile_id, role)
values ('<KULLANICI_UUID>', 'admin')
on conflict do nothing;
```

Kontrol:

```sql
select p.id, p.full_name, r.role
  from public.user_roles r join public.profiles p on p.id = r.profile_id
 where r.role = 'admin';
```

Rolü geri almak için ilgili satırı silin (`user_roles` üzerinde istemci yazma yetkisi yoktur;
işlem SQL Editor veya `service_role` ile yapılır).

## Notlar

- `20261111000001_init.sql` yalnızca çalışmama hatası için düzeltildi (immutable olmayan
  generated kolon → `set_filter_due_at()` trigger'ı).
- İstemci `orders`, `order_items`, `appointments`, `subscriptions`, `user_roles`,
  `stock_movements` yazamaz.
- Admin yazımı tablo/kolon grant'i ile değil, yalnız RPC ile yapılır:
  `upsert_product`, `set_product_price`, `set_product_active`, `set_product_stock`,
  `moderate_review`, `advance_order_status`, `cancel_order`.
- `b2b_leads` yalnız `POST /api/b2b-lead` üzerinden yazılır (anon insert kapalı).
- `seed.sql` yalnızca katalog verisidir ve idempotenttir; stok/pasiflik değerlerini ezmez.
  Ürün silinmez, `is_active = false` ile pasife alınır.
- Testler: `supabase/tests/00{1..5}_*.sql` — her dosya kendi `begin; … rollback;` bloğunda
  çalışır, `plan(n)` ile bitecek test sayısını bildirir.
