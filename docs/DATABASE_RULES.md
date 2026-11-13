# AquaPure — Veritabanı Talimat Dosyası v2 (Supabase / PostgreSQL)

> **Bağlayıcıdır.** MUST = zorunlu, MUST NOT = kesinlikle yasak. Plan ile çelişirse bu dosya kazanır; çelişkiyi raporla, kendi başına karar verme.
> Konum: `docs/DATABASE_RULES.md`. `CLAUDE.md` / `AGENTS.md` içinden referans ver.
> v2, gerçek `init.sql` ve `config.toml` denetlenip PostgreSQL üzerinde test edilerek yazıldı (§0).

## 0. Mevcut şemanın denetim sonucu (özet)

`init.sql` Postgres'te çalıştırılıp 9 saldırı + 49 meşru akış testi yapıldı.

| # | Bulgu | Önem | Durum |
|---|---|---|---|
| 1 | `installations.filter_due_at` üretilmiş kolon: `timestamptz + interval` immutable değil → **tüm migration hata verir, `db reset` çalışmaz** | Kritik | `init.sql` düzenlenecek (§0.1) |
| 2 | `orders_insert_own`: istemci `status='paid'`, `total_try=0` ile sipariş açabilir; `order_items.unit_price`'ı kendisi yazar | Kritik | `create_order` RPC |
| 3 | `reviews_insert_own`: kullanıcı kendi yorumunu `is_approved=true` yapıp yayınlayabilir, satın almadan yorum yazar | Kritik | kolon yetkisi + doğrulanmış-satın-alma policy |
| 4 | `subscriptions_update_own`: kullanıcı `next_billing_at`, `status`, `provider_ref` alanlarını değiştirebilir | Kritik | `set_subscription_status` RPC |
| 5 | `appointments_insert_own`: slot kilidini atlayıp doğrudan randevu (hatta `status='completed'`) açılır; slot ile randevu birbirine bağlı değil | Yüksek | `book_appointment` / `cancel_appointment` RPC + `slot_id` |
| 6 | `b2b_leads` anon insert `with check (true)`: `status='won'` yazılabilir, sınırsız spam | Yüksek | kolon yetkisi + `status='new'` + kısıt |
| 7 | `support_tickets` insert: `status='resolved'`, başkasının `installation_id`'si | Orta | policy + kolon yetkisi |
| 8 | `hold_appointment_slot`: bir kullanıcı tüm slotları art arda tutabilir; `release_expired_slot_holds()` anon'a açık; `search_path = public` | Orta | tek-hold kuralı, revoke, `search_path = ''` |
| 9 | `grant ...` blokları gerçekte kısıtlamıyor: Supabase varsayılan olarak `public`'teki yeni tabloları `anon`/`authenticated`'a **tam yetkiyle** açar; tek koruma RLS | Orta | `revoke all` + minimum `grant` |
| 10 | `pgcrypto` `public` şemasına 36 fonksiyon döküyor; `gen_random_uuid()` zaten dahili | Düşük | satır silinir |
| 11 | Eksik FK indexleri (11 adet), `addresses` için tek-varsayılan kuralı yok, telefon/uzunluk kısıtı yok | Düşük | migration |

Okuma izolasyonu (başkasının siparişi/profili, `technicians`, `b2b_leads`) **doğru çalışıyordu**; RLS'in `select` tarafı sağlam.

### 0.1 `init.sql` için iki düzeltme
`init.sql` hiçbir veritabanında çalışamadığı için (hata satır 122) **hiçbir yere uygulanmış olamaz**; bu yüzden §2'deki "uygulanmış migration'ı düzenleme" kuralının istisnasıdır, doğrudan düzenle:

1. `installations` tablosunda şu satırı değiştir:
   `filter_due_at timestamptz generated always as (installed_at + interval '180 days') stored,`
   → `filter_due_at timestamptz,`
   ve tablonun altına trigger ekle:
```sql
create or replace function public.set_filter_due_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.filter_due_at is null then
    new.filter_due_at := new.installed_at + interval '180 days';
  end if;
  return new;
end; $$;
create trigger installations_filter_due before insert on public.installations
  for each row execute function public.set_filter_due_at();
```
2. İlk satırdaki `create extension if not exists pgcrypto;` satırını sil.

Sonra `supabase/migrations/20261113000001_security_hardening.sql` eklenir (bu repoyla birlikte verildi).
**Not:** hardening migration, `hold_appointment_slot(uuid, uuid)` ve `confirm_appointment_slot` imzalarını kaldırır. İstemci kodu `hold_appointment_slot(slotId)` + `book_appointment(slotId, type, orderId, installationId)` çağıracak şekilde güncellenmelidir.

## 1. Başlamadan önce
1. `supabase/migrations/*` dosyalarını tamamen oku. Olanı yeniden yazma; eksik olanı yeni migration ile ekle.
2. `docs/superpowers/plans/` planlarını oku. Bu dosyayla çelişen bir plan maddesi bulursan dur ve raporla.
3. Aykırı bir şey bulursan sessizce düzeltme: raporla, sonra **yeni migration** ile düzelt.

## 2. Migration kuralları
- **MUST** her değişiklik `supabase/migrations/YYYYMMDDHHMMSS_aciklama.sql` ile; tek mantıksal değişiklik, tek dosya.
- **MUST NOT** `main`'e girmiş / bir ortama uygulanmış migration'ı düzenleme (§0.1 istisnası dışında). Düzeltme = yeni migration.
- **MUST NOT** Dashboard'dan migration'sız kalıcı şema değişikliği.
- **MUST** her PR'da `supabase db reset` sıfırdan, hatasız çalışmalı. (Bu kural olsaydı bulgu #1 yakalanırdı.)
- **MUST** yıkıcı değişiklik 3 adımda: yeni kolon → veri taşı → sonraki migration'da eskiyi sil.
- **MUST** yeni tablo, aynı migration'da RLS + policy + yetki (§5, §6) ile gelir.
- **MUST** üretilmiş (`generated ... stored`) kolon yalnızca **immutable** ifade kullanır. `timestamptz + interval`, `now()`, `current_date` immutable DEĞİLDİR → trigger veya RPC kullan.
- **MUST NOT** gereksiz extension ekleme. `gen_random_uuid()` dahilidir, `pgcrypto` gerekmez. Extension gerekiyorsa `with schema extensions`.

## 3. İsimlendirme ve tipler
| Konu | Kural |
|---|---|
| Tablo/kolon | `snake_case`, tablo adı çoğul |
| PK | `id uuid primary key default gen_random_uuid()` |
| FK | `<tekil>_id`, **her FK'ya index**, `on delete` davranışı açık |
| Zaman | `timestamptz` (asla `timestamp`) |
| **Para** | `numeric(12,2)`, kolon adı `_try` ile biter (`price_try`, `total_try`, `unit_price`). **MUST NOT** `float/real/double/money`. İşlem sunucuda yapılır. (Mevcut `numeric(10,2)` kalır; Iyzico da ondalık string bekler, kuruş-integer'a çevirmek gereksiz refactor.) |
| Durum alanları | Mevcut yapıyla uyumlu **Postgres enum** (TS tipleri `gen types` ile birlik tipi olur). Yeni değer eklemek = **tek başına bir migration** (`alter type ... add value`). Enum değeri silme/yeniden adlandırma yok. |
| JSON | `jsonb`; ilişkisel/sorgulanan veri jsonb'ye gömülmez. Sipariş adres snapshot'ı gibi bilinçli kopyalar istisnadır. |
| Boolean | `is_/has_` öneki, `not null default` |
| Her tabloda | `created_at`; değişen tabloda `updated_at` + `set_updated_at()` |

- **MUST** zorunlu alan `not null`; doğrulama DB'de de: `CHECK` (uzunluk, aralık, telefon `^[+0-9 ()-]{10,20}$`), `UNIQUE`, FK. Yalnızca frontend doğrulamasına güvenme.
- **MUST** sipariş/ödeme/kurulum FK'ları `on delete restrict`.

## 4. Auth ve roller
- `auth.users`'a dokunma. `public.profiles` 1-1; oluşturma `handle_new_user` trigger'ı ile. Trigger, metadata'yı **doğrulayıp** kopyalar (geçersiz telefon kayıt akışını bozmamalı).
- **MUST NOT** yetki kararında `user_metadata`/`raw_user_meta_data` kullanma (kullanıcı değiştirebilir). Profil gösterim verisi için kopyalamak serbest.
- **MUST** roller (`admin`, `technician`, `b2b`) ayrı `user_roles` tablosunda veya `app_metadata`'da. `profiles`'a kendi kendine yükseltilebilir rol kolonu koyma. *(Şu an yok; admin paneli eklendiğinde bu kurala göre eklenecek.)*

## 5. RLS
- **MUST** `public`'teki her tabloda RLS açık. Policy'siz tablo = kimse erişemez; bilinçli olmalı.
- **MUST** policy'ler işlem başına ayrı (`for all` yasak), `to anon|authenticated` açık, `(select auth.uid())` biçiminde.
- **MUST** `update` policy'sinde `using` + `with check`.
- **MUST NOT** `using (true)` / `with check (true)` (yalnızca herkese açık katalog `select`'i hariç).
- **MUST** `insert` policy'si, kullanıcının **kendi belirlememesi gereken** alanları sabitler: `status = 'open'`, `is_approved = false`, `status = 'new'` gibi. İlişkili kayıt (installation, order) sahibine ait mi diye `exists(...)` ile doğrular.
- **MUST** anon'a yalnızca: `products`, `regions`, `water_hardness`, `reviews` (select) ve `b2b_leads` (kolon-kısıtlı insert).

## 6. Yetkiler (GRANT) — RLS'in ikinci kilidi
Supabase `public`'teki yeni tabloları varsayılan olarak `anon`/`authenticated`'a tam yetkiyle açar. Bu yüzden:
- **MUST** hardening migration'daki desen korunur: önce `revoke all ... from anon, authenticated` (tablolar + fonksiyonlar, `from public` dahil) ve `alter default privileges` ile varsayılanlar kapatılır; sonra yalnızca gerekenler `grant` edilir.
- **MUST** kullanıcıdan yazılabilen tablolarda **kolon-bazlı** yetki: örn. `grant insert (profile_id, product_id, author_name, city, rating, text) on reviews`; `profiles` için `grant update (full_name, phone)`. `status`, `is_approved`, `price`, `role` gibi alanlar hiçbir zaman istemciye açılmaz.
- **MUST** yeni tablo eklenince grant da aynı migration'da yazılır. Yeni fonksiyon eklenince `revoke ... from public, anon, authenticated` + gerekene `grant execute`.
- **Dikkat:** kolon-bazlı insert yetkisi varken istemci `select('*')` ile insert sonrası dönüş istiyorsa `select` yetkisi de olmalı; yoksa `Prefer: return=minimal` kullan.

## 7. Yazma yalnızca RPC ile (iş mantığı)
- **MUST** şu işlemler **tek transaction'lık RPC** ile yapılır ve tablolara istemci `insert/update` yetkisi **yoktur**: sipariş oluşturma (`create_order`), ödeme onayı (`mark_order_paid`, yalnızca `service_role`), slot tutma/randevu/iptal (`hold_appointment_slot`, `book_appointment`, `cancel_appointment`), abonelik durumu (`set_subscription_status`).
- **MUST NOT** RPC parametresi olarak kullanıcı id'si alma. Kimlik her zaman `(select auth.uid())`.
- **MUST** `security definer` fonksiyonlarda `set search_path = ''` + şema-nitelikli nesneler; fonksiyon içinde sahiplik kontrolü; `revoke from public, anon, authenticated` + gerekene `grant execute`.
- **MUST** view'lar `security_invoker = true`.
- **MUST NOT** trigger içinde dış HTTP çağrısı; dış dünya için `outbox_events` (§10).
- **MUST** hata mesajları makine-okunur kod olsun (`insufficient_stock`, `slot_not_held`, `invalid_order_transition`...) ki UI eşleyebilsin.

## 8. Alan kuralları (gerçek şemaya göre)
### Sipariş / ödeme
- Durum makinesi: `pending → paid → shipped → delivered → installed`; `pending|paid → cancelled`. Geçersiz geçişi trigger engeller (service_role dahil).
- Fiyat, toplam, adres snapshot'ı **sunucuda** (`create_order`) belirlenir; `order_items` birim fiyat **ve ürün adı** kopyalar. İstemciden gelen fiyat/toplam asla kullanılmaz.
- Stok `mark_order_paid` içinde atomik düşer (`stock >= qty` koşuluyla); aynı webhook iki kez gelirse idempotenttir. Yetersiz stokta exception → webhook işleyicisi iade akışına yönlenir.
- `orders.payment_ref` benzersizdir (kısmi unique index). Kart verisi hiçbir yerde tutulmaz.
- Sipariş/ödeme/kurulum kaydı hard delete edilmez; silme talebinde anonimleştirme.
### Randevu / slot
- Çift rezervasyon DB seviyesinde engellenir: `appointment_slots (technician_id, slot_start)` unique + `appointments (slot_id)` kısmi unique. Slot ↔ randevu `slot_id` ile bağlıdır.
- Kullanıcı başına **tek aktif hold**; başarısız yeni hold, eski hold'u bozmaz. Kullanıcı başına en fazla 5 gelecek randevu. Süresi dolan hold hem cron'la hem sorgu koşuluyla serbest kalır.
- Slotları **kim üretecek** belirli olmalı (cron/RPC ile `service_role`); istemci slot yazmaz.
### Abonelik
- Durum geçişi yalnızca RPC ile: `active↔paused`, `active|paused → cancelled`; `cancelled` terminal. Fatura alanları (`next_billing_at`, `provider_ref`) yalnızca `service_role` / webhook yazar.
### Yorum
- Yorum yalnızca ürünü **teslim almış/kurulumu yapılmış** kullanıcıdan; `is_approved` istemciden yazılamaz (moderasyon `service_role`).
### Formlar (B2B)
- Anon insert yalnızca kolon-kısıtlı + uzunluk/telefon kısıtlı. **Spam koruması DB'de yapılamaz**: üretimde form bir Route Handler üzerinden (Turnstile/hCaptcha + rate limit) `service_role` ile yazılmalı; o gün anon insert grant'i kaldırılır.
### Katalog / bölge
- `products` silinmez, `is_active=false` yapılır. `regions.active_customers`/`technician_count` herkese açık okunuyor: **iş kararı**, gizli tutulacaksa herkese açık view'a taşı.
- Müşterinin teknisyen adını/telefonunu görmesi gerekirse `technicians` tablosunu açma; yalnızca `ad` + `telefon` döndüren, sahiplik kontrollü bir RPC/view yaz.

## 9. Anahtarlar ve config
- `SUPABASE_SERVICE_ROLE_KEY` hiçbir zaman `NEXT_PUBLIC_` olmaz, client'a/log'a/repoya girmez. Yalnızca Route Handler/Server Action'da; webhook'larda önce imza doğrulaması.
- `supabase/config.toml`:
  - `enable_confirmations` → **`true`** (e-posta doğrulanmadan hesap açılmasın; yerelde Inbucket ile test edilir).
  - `major_version`, hosted projenin PostgreSQL sürümüyle **aynı** olmalı (şema `unique nulls not distinct` kullanıyor: PG15+ gerekir).
  - `additional_redirect_urls` yalnızca tam adresler; üretim adresleri (`https://alanadi.com/auth/callback`, `/panel`) dashboard'da/`config push` ile eklenir; `**` joker yok.
  - Storage kullanılacaksa bucket'lar `config.toml`'da tanımlanır (`[storage.buckets.*]`); varsayılan private, yalnızca `product-images` public.
  - `[db.seed] enabled = true, sql_paths = ["./seed.sql"]` ve `seed.sql` yalnızca katalog/referans verisi (idempotent: `on conflict ... do update`).
  - `max_rows = 1000` kalsın; istemci sorguları yine de sayfalanır.

## 10. KVKK ve otomasyon (henüz eksik — Faz 2'den önce eklenecek)
Bu tablolar şemada yok; eklenirken §3–§7 kuralları uygulanır:
- `consents` (aydınlatma/açık rıza/pazarlama; sürüm, `accepted_at`, `withdrawn_at`; geçmiş silinmez), hesap anonimleştirme RPC'si, `audit_log` (yalnızca admin okur).
- `payments` + `payment_events` (`unique (provider, provider_event_id)`), iade durumu.
- `outbox_events` (n8n/Telegram/SMS): yalnızca `service_role`; payload'da kişisel veri yok, yalnızca id'ler.
- `user_roles` / admin yetkisi. Log ve hata mesajlarında e-posta/telefon/adres yok.

## 11. Uygulama (Next.js) tarafı
- Tipler **elle yazılmaz**: `supabase gen types typescript` → `web/src/lib/supabase/database.types.ts`; CI'da güncellik kontrolü. `createClient<Database>()`.
- Veri erişimi tek katmandan (`data-access/*`); iki implementasyon: `demo` (localStorage) ve `supabase`, **aynı arayüz**. Demo mod RPC davranışını da taklit eder (sipariş toplamı hesabı, slot hold, durum geçişi) ki iki mod ayrışmasın.
- Satır ↔ domain dönüşümü (snake_case↔camelCase) tek yerde.
- Oturum doğrulamada `getUser()` kullan (`getSession()` tek başına yetmez).
- **MUST NOT** `select('*')`; sayfalamasız liste yok.

## 12. Test ve kalite kapısı (her DB PR'ında)
1. `supabase db reset` hatasız.
2. Supabase Advisor / `supabase db lint`: RLS kapalı tablo yok, indexsiz FK yok, `search_path`'siz `security definer` yok.
3. **Zorunlu regresyon testleri** (pgTAP veya Vitest entegrasyon): aşağıdaki saldırıların **hepsi engellenmeli**:
   - `status='paid'`/`total=0` ile sipariş açma · `order_items`'a elle fiyat yazma
   - `is_approved=true` ile yorum · satın almadan yorum
   - abonelik `next_billing_at`/`status` değiştirme
   - slotsuz doğrudan randevu · başkasının slotunu book etme · süresi dolmuş hold ile book
   - `b2b_leads`'e `status='won'` · `support_tickets`'a `status='resolved'`
   - `release_expired_slot_holds()` / `mark_order_paid()` çağırma (anon/authenticated)
   - başkasının sipariş/profil/adres/randevusuna erişim · anon'un kullanıcı tablolarına erişimi
4. Meşru akış testleri: sipariş (sunucu toplamı, stok, çift ürün satırı birleştirme), `mark_order_paid` idempotensi, geçersiz durum geçişi, hold→book→cancel, tek-hold kuralı, abonelik geçişleri.
5. `database.types.ts` yeniden üretilmiş ve commit'li; `npm run typecheck && npm test` geçer.

## 13. Yasaklar (özet)
1. RLS kapalı tablo · 2. `using/with check (true)` ile kullanıcı verisi · 3. `user_metadata` ile yetkilendirme · 4. `service_role`'ü client'a koymak · 5. para için float · 6. uygulanmış migration'ı düzenlemek · 7. istemciden `status/is_approved/price/role` yazılabilmesi · 8. istemciden doğrudan `orders/order_items/appointments/subscriptions` yazımı · 9. kart verisi saklamak · 10. client'tan gelen fiyat/toplama güvenmek · 11. sipariş/ödeme hard delete · 12. `search_path`'siz `security definer` · 13. `security_invoker`'sız view · 14. trigger'da dış HTTP · 15. tipleri elle yazmak, `select('*')` · 16. slot çakışmasını yalnızca uygulama kodunda kontrol etmek · 17. RPC'ye kullanıcı id'si parametresi · 18. immutable olmayan üretilmiş kolon · 19. `revoke` yapmadan `grant` ile "kısıtladığını sanmak".

## 14. Görev bitirme kontrol listesi
- [ ] Yeni migration tek amaçlı, `db reset` geçiyor
- [ ] Yeni tabloda RLS + işlem başına policy + **kolon-bazlı grant**
- [ ] İstemci yazımı gereken yerde `insert` policy'si hassas alanları sabitliyor, aksi halde RPC
- [ ] FK indexleri, `not null`/`check` kısıtları
- [ ] RPC'ler `search_path = ''`, kimlik `auth.uid()`'den, `revoke`+`grant execute`
- [ ] §12'deki saldırı regresyon testleri yazıldı ve geçiyor
- [ ] `database.types.ts` güncel; demo mod arayüzü uyumlu
- [ ] Advisor uyarısı yok
