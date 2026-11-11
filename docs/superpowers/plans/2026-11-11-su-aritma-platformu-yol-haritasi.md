# Su Arıtma Platformu — Ultra Detaylı Yol Haritası

> **Agentic workers:** Bu belge ana yol haritasıdır; görev görev uygulanır, adımlar `- [ ]` söz dizimiyle takip edilir. Her kod yazan görev, kullanıcıya "bitti" denmeden ÖNCE bağımsız **reviewer** subagent'ı ile denetlenir (AGENTS.md kuralı: CRITICAL/HIGH bulgu → düzelt + yeniden incele, toplam en fazla 3 inceleme turu). Her fazın başlangıcında o faza ait ayrıntılı implementasyon planı (writing-plans formatında) çıkarılır.

**Hedef:** Su arıtma cihazları için premium e-ticaret + satış sonrası tam otomasyon platformu: vitrin, cihaz seçici quiz, sepet/ödeme, magic link'li müşteri paneli, kurulum randevusu, filtre sağlık takibi ve 6 aylık filtre aboneliği.

**Mimari:** Next.js (App Router) vitrin + müşteri paneli tek uygulamada; Supabase (PostgreSQL + RLS, Auth magic link, Edge Functions) veri ve iş katmanı; ödeme provider'dan bağımsız **PaymentProvider** abstraction (ilk implementasyon Iyzico, Faz 1'de mock provider ile uçtan uca test); n8n + Telegram Bot + SMS otomasyon katmanı (Faz 2'de canlı).

**Teknoloji Yığını:** Next.js 15 (App Router, RSC), React 19, TypeScript strict, Tailwind CSS v4, Framer Motion + GSAP ScrollTrigger, @react-three/fiber (yalnız hero, lazy + reduced-motion fallback), Zustand (sepet), Supabase JS v2, Vitest + Testing Library, Playwright, Lighthouse CI, Vercel deploy.

**Spek:** `docs/PRD.md` — bu plan PRD'den argümanlanır; uygulayıcı ikisini de okur.

**Para birimi / yerel:** TRY, tr-TR. **Dil:** Türkçe (çoklu dil kapsam dışı).

---

## 1. Kesinleşen Kararlar (Decision Log)

| # | Konu | Karar | Gerekçe |
|---|------|-------|---------|
| K1 | Backend | **Supabase** (PostgreSQL + Auth + Edge Functions + Storage) | Magic link auth hazır, RLS ile güvenlik, hızlı geliştirme, PRD uyumu |
| K2 | Ödeme | **Provider abstraction** (`PaymentProvider` arayüzü), ilk implementasyon **Iyzico** | TR pazarı (TL, taksit, yerel kartlar, recurring); Stripe sonradan eklenebilir |
| K3 | Fazlama | **Faz 1: site + panel** (otomasyon mock), **Faz 2: canlı otomasyon** | Erken görülür ürün, düşük risk, dış servis hesapları Faz 2'ye sarkar |
| K4 | Seviye | **Gerçek iş, production-grade** | Gerçek veri modeli/fiyat yapısı; mock veri yalnızca geçici dolgu |
| K5 | Tema | **B — "Saflık" (açık tema)** | Beyaz zemin + su mavisi; temizlik/güven hissi (kullanıcı seçimi) |
| K6 | Palet | **Su mavisi (#0284C7 çekirdek) + beyaz** | Kullanıcı seçimi |
| K7 | Accent (CTA) | **#60C21F canlı yeşil** — yalnızca birincil CTA + acil destek butonu | Kullanıcı seçimi; doğallık hissi, maviyle güçlü kontrast |
| K8 | Buton metni | Accent üzerinde **koyu yeşil-siyah #062813** | Beyaz metin #60C21F üzerinde WCAG AA başarısız (2.3:1); Spotify deseni |
| K9 | 3D strateji | **CSS/SVG-öncelikli**; 3D yalnız hero'da R3F ile **lazy-load**; **Spline KULLANILMAZ** | Spline embed'leri Lighthouse'u düşürür — PRD'nin kendi performans hedefiyle çelişir |
| K10 | Animasyon | Framer Motion (UI mikro), GSAP ScrollTrigger (scroll anlatı) | PRD isteği; `prefers-reduced-motion` her zaman desteklenir |
| K11 | Font | **Inter Variable** (next/font, tek aile, başlıklarda tight tracking) | Tek değişken font = hızlı LCP; premium görünüm letter-spacing ile |
| K12 | Deploy | Vercel (web) + Supabase Cloud (veri) | Bakımsız, ölçeklenebilir başlangıç |
| K13 | Konum | `C:\Users\enesk\Projects\su-aritma` | Çalışma dizini |
| K14 | Admin | **Ayrı `/admin` route grubu + `profiles.role='admin'` + RLS** (FAZ 3) | Yetki DB'de tek yerde; tarayıcıya service-role anahtarı inmez; müşteri paneliyle karışmaz |
| K15 | Ürün kaynağı | **Veritabanı tek doğru kaynak**; statik katalog yalnız seed + fallback | Yöneticinin fiyat/stok değişikliği vitrine yansımalı |
| K16 | Stok | Başlangıç elle; satışta **otomatik düşüş**, iptalde geri artış; düşük stok uyarısı **yalnız vitrinde** (`stock ≤ 3`) | Kullanıcı kararı (2026-11-11) |

**Açık kararlar (yol boyunca netleşecek):** marka adı, domain, gerçek ürün kataloğu verisi, il bazlı sertlik verisi kaynağı, Iyzico üye işyeri hesabı, SMS sağlayıcısı (Netgsm/Twilio), n8n hosting (Cloud vs VPS), kargo entegrasyonu sağlayıcısı.

> ~~admin yaklaşımı~~ → **K14 ile kapandı** (FAZ 3).

---

## 2. Sistem Mimarisi

### 2.1 Bileşen Haritası

```
┌──────────────────────────┐      ┌───────────────────────────────┐
│  Next.js 15 (Vercel)     │      │  Supabase Cloud               │
│  - Vitrin (SSG/ISR)      │◄────►│  - PostgreSQL + RLS           │
│  - Müşteri Paneli (CSR)  │      │  - Auth (magic link/e-mail)   │
│  - Sepet (Zustand)       │      │  - Edge Functions             │
│  - Checkout              │      │  - Storage (ürün görselleri)  │
└──────────┬───────────────┘      └───────────┬───────────────────┘
           │ PaymentProvider                  │ webhook / olaylar
           ▼                                  ▼
   ┌────────────────┐                 ┌───────────────┐
   │ Iyzico (Faz 2) │                 │ n8n (Faz 2)   │──► Telegram Bot (teknisyen)
   │ Mock (Faz 1)   │                 │ workflow'lar  │──► SMS (Netgsm/Twilio)
   └────────────────┘                 └───────────────┘──► E-posta (SMTP/Resend)
```

**Katman sorumluluk sınırı:** Doğrulama, ödeme ve kilitleme gerektiren işlemler (slot rezervasyonu, webhook işleme) → Supabase Edge Functions. Bildirim ve zaman bazlı orkestrasyon (170 gün sayacı, hatırlatmalar) → n8n (Faz 2'de canlı, Faz 1'de arayüz hazır + mock tetikleme).

### 2.2 Ödeme Abstraction (K2)

```typescript
interface PaymentProvider {
  createCheckoutSession(order: Order): Promise<CheckoutSession>      // form/redirect URL'si döner
  verifyWebhookSignature(rawBody: string, headers: Headers): boolean
  createSubscription(plan: FilterPlan, customerRef: string): Promise<SubscriptionRef>
  cancelSubscription(ref: SubscriptionRef): Promise<void>
  handleWebhook(event: WebhookEvent): Promise<void>                  // idempotent zorunlu
}
```

Implementasyonlar: `MockPaymentProvider` (Faz 1 — başarılı/başarısız simülasyonu, anında callback), `IyzicoPaymentProvider` (Faz 2). Kart verisi **asla** bizim sistemden geçmez (Iyzico form/redirect).

### 3. Veri Modeli (Supabase / PostgreSQL)

İlişkisel şema — PRD §5 gereği Müşteriler, Cihazlar, Teknisyenler, Bölgeler, Randevular ilişkili. **Her tabloda RLS policy zorunlu.**

| Tablo | Anahtar alanlar | İlişkiler / Notlar |
|---|---|---|
| `profiles` | id (auth.users), full_name, phone, **role(customer/admin)**, created_at | Müşteri; magic link auth ile 1:1. `role='admin'` → `/admin` erişimi (**FAZ 3**) |
| `addresses` | id, profile_id, il, ilce, line, title | profile_id → profiles |
| `products` | id, slug, sku, name, category(device/filter/part), price_try, cost_try, stages, capacity_lpd, specs(jsonb), stock, images[], is_active, updated_at | Cihaz + yedek parça + filtre aynı tabloda category ile. Vitrin kaynağı (**FAZ 3**) |
| `stock_movements` | id, product_id, delta, stock_after, reason(initial/manual/sale/cancel/return), order_id, actor_id, note, created_at | **FAZ 3** — değiştirilemez stok denetim izi; satışta otomatik yazılır |
| `orders` | id, profile_id, status(enum: pending/paid/shipped/delivered/installed), total_try, payment_ref | status akışı olayların tetikleyicisi |
| `order_items` | id, order_id, product_id, qty, unit_price | Fiyat anlık kopyalanır (tarihî doğruluk) |
| `subscriptions` | id, profile_id, device_id, status(active/paused/cancelled), next_billing_at, provider_ref | 6 aylık filtre aboneliği |
| `installations` | id, order_id, profile_id, product_id, installed_at, warranty_until | Kurulum tamamlanınca oluşur; filtre ömrü bundan hesaplanır |
| `technicians` | id, full_name, phone, telegram_chat_id, region_id, is_active | telegram_chat_id Faz 2 bildirimleri için |
| `regions` | id, name(il), technician_count, avg_install_hours | Teknisyen ağı + harita verisi |
| `appointments` | id, installation_id/order_id, technician_id, slot_start(timestamptz), status(booked/completed/cancelled), type(install/filter_change/service) | Slot çakışması DB seviyesinde unique index ile engellenir |
| `appointment_slots` | id, technician_id, slot_start, slot_end, status(free/held/booked) | `held` = checkout sırasında geçici kilit (TTL 10 dk) |
| `water_hardness` | id, il, ilce, hardness_ppm, level(enum: soft/medium/hard/very_hard) | Statik veri — il/ilçe sertlik haritası (quiz'in beyni) |
| `support_tickets` | id, profile_id, installation_id, issue_type(enum: pressure/leak/taste/other), note, status(open/assigned/resolved), created_at | Tek Tıkla Destek çıktısı |
| `b2b_leads` | id, company, contact_name, phone, sector(horeca), city, message, status | Kurumsal teklif formu |
| `reviews` | id, profile_id, product_id, rating, text, is_approved | Sosyal kanıt; onaysız görünmez |

**Şema kuralları:** timestamptz her yerde (UTC depola, gösterimde Europe/Istanbul), soft-delete yerine status enum'ları, tüm fiyatlar `numeric(10,2)`, enum'lar Postgres enum tipi olarak.

### 3.1 Randevu Slot Kilidi (race condition koruması)

`appointment_slots` üzerinde `UNIQUE(technician_id, slot_start)` + Edge Function atomik `UPDATE ... WHERE status='free'` ile slot geçici `held` yapılır; ödeme onayında `booked`, 10 dk TTL'de `free`'ye döner (pg_cron veya edge timeout).

### 3.2 Filtre Sağlık Barı ve 170 Gün Sayaç

- Filtre ömrü: `installed_at + 180 gün` → paneldeki progress bar `kalan/180` oranı.
- Abonelik tetiği: `installed_at + 170 gün` → n8n cron tarar (Faz 2), müşteriye SMS/mail + randevu linki. Faz 1'de `simulateNotification()` mock'u ile panelde gösterilir.

---

## 4. Tasarım Sistemi ("Saflık")

### 4.1 Renk Token'ları (Tailwind v4 theme)

| Token | Değer | Kullanım |
|---|---|---|
| `primary` (su mavisi) | `#0284C7` | Linkler, ikonlar, ikincil butonlar, vurgular |
| `primary-light` | `#7DD3FC` / `#E0F2FE` | Hover'lar, yumuşak zeminler |
| `primary-dark` | `#075985` | Basılı durumlar |
| `surface` | `#FFFFFF` / `#F8FAFC` | Sayfa zeminleri (beyaz öncelikli) |
| `ink` | `#0F172A` | Ana metin |
| `ink-soft` | `#5B7891` | İkincil metin |
| `border-soft` | `#E2EDF5` | Kenarlıklar, kart çizgileri |
| **`accent`** | **`#60C21F`** | Yalnızca: birincil CTA, "Sepete Ekle", "Tek Tıkla Destek" |
| `accent-hover` | `#6ECE2E` | CTA hover |
| `accent-text` | `#062813` | CDA üzerindeki metin (WCAG AA ≥ 4.5:1) |
| `accent-tint` | `#EAF9E0` | Başarı/abonelik rozetleri zemin |
| `danger` | `#DC2626` | Hata, iptal |
| `warning` | `#D97706` | Filtre ömrü <%20 uyarısı |

**Kural:** accent ekranda < %5 alan kaplar. Accent olmayan hiçbir öğe yeşil değildir (semantik başarı durumu hariç, o da accent-tint ailesinden).

### 4.2 Tipografi

- Inter Variable, `next/font/google`, `display: swap`.
- Ölçek (desktop/mobile): h1 48/36 · h2 36/28 · h3 24/20 · body 16/16 · small 14/14 · caption 12.
- Başlıklar: `font-weight 700-800`, `letter-spacing: -0.02em` (premium his buradan gelir).
- Satır yüksekliği gövdede 1.6.

### 4.3 Bileşen Kataloğu (Atomic Design)

- **Atoms:** Button (primary=accent / secondary=mavi outline / ghost), Input, Select, Badge, Spinner, Icon (Lucide), Tooltip, ProgressBar.
- **Molecules:** ProductCard, ReviewCard, Stepper (quiz), SlotPicker, FilterHealthBar, HardnessBadge, QuantitySelector.
- **Organisms:** Header (sticky, scroll'da blur), HeroSection, HowItWorks (scroll anlatı), TechnicianMap (SVG Türkiye), ProductGrid, ComparisonTable (X vs Y), CartDrawer, CheckoutFlow, SupportModal, AppointmentCalendar, Footer.
- **Templates:** HomeLayout, ShopLayout, PanelLayout (sidebar'lı müşteri paneli), B2BLayout.

### 4.4 Motion Kuralları

- Mikro etkileşimler: Framer Motion, `200-300ms`, `ease-out`.
- Scroll anlatıları (Nasıl Çalışır): GSAP ScrollTrigger, `scrub: true`.
- Hero: CSS ana su damlası/parçacık animasyonu (SVG, 60fps, JS yok); R3F 3D cihaz modeli **IntersectionObserver + lazy import**, mobilde ve `prefers-reduced-motion`'da devre dışı.
- Sayfa geçişleri: yok (hız öncelikli) — yalnız içerik fade-in.

### 4.5 Erişilebilirlik ve Performans Hedefleri

- WCAG 2.1 AA: kontrast, klavye navigasyonu, odak halkaları, ARIA (modal, harita, stepper).
- Lighthouse bütçeleri (CI'da zorunlu): Performance **≥ 90**, Accessibility **≥ 95**, Best Practices ≥ 95, SEO ≥ 95; LCP ≤ 2.5s (mobil 4G).
- Görseller: AVIF/WebP + `next/image`, hero'da statik görsel yok (SVG/CSS).

---

## 5. Sayfa Envanteri

| Rota | Tür | İçerik |
|---|---|---|
| `/` | SSG | Hero, Nasıl Çalışır, teknisyen haritası, sosyal kanıt, CTA bantları |
| `/urunler` | ISR | Cihaz + filtre + parça listesi; filtre badge'leri (aşama, kapasite) |
| `/urunler/[slug]` | ISR | Galeri, teknik özellik tablosu, X vs Y karşılaştırma, abonelik upsell, sepete ekleme |
| `/cihaz-bul` | CSR | Quiz modal/sayfa (Modül 1) |
| `/sepet` → `/odeme` | CSR | Checkout; slot seçimi teslimat sonrası bağlamında gösterilir |
| `/kurumsal` | SSG | HORECA landing + toplu teklif formu (b2b_leads) |
| `/panel` | CSR (auth) | Magic link girişi → dashboard |
| `/panel/siparisler` | CSR | Sipariş durumu akışı |
| `/panel/randevu` | CSR | SlotPicker takvimi (Modül 2) |
| `/panel/filtre` | CSR | Filtre sağlık barı + abonelik durumu (Modül 4) |
| `/panel/destek` | CSR | Tek Tıkla Destek + ticket geçmişi (Modül 2) |
| `/panel/profil` | CSR | Adres, iletişim |
| `/panel/giris` | CSR | Magic link talep ekranı |
| `/admin/giris` | CSR | **FAZ 3** — yönetici magic link girişi |
| `/admin` | CSR (auth) | **FAZ 3** — yönetim dashboard'u: KPI, kritik stok, son hareketler |
| `/admin/urunler` | CSR (auth) | **FAZ 3** — ürün tablosu + arama/filtre/sıralama |
| `/admin/urunler/yeni` | CSR (auth) | **FAZ 3** — yeni ürün formu |
| `/admin/urunler/[id]` | CSR (auth) | **FAZ 3** — ürün düzenleme + stok paneli + hareket geçmişi |
| `/admin/stok` | CSR (auth) | **FAZ 3** — stok durumu, hızlı güncelleme, kritik filtre |
| `/admin/yetkisiz` | CSR | **FAZ 3** — admin olmayan kullanıcıya bilgi |
| `/*` hata | — | 404/500 markalı sayfalar |

---

## 6. Faz Planı ve Görev Listeleri

> Her fazın sonu bir **Definition of Do** (bölüm 7) taşır. Faz başlangıcında writing-plans formatında ayrıntılı implementasyon planı çıkarılır — bu bölüm o planların ustasıdır.

### FAZ 0 — Temel (kurulum, ~1 gün)

- [ ] **0.1** Repo iskeleti: `create-next-app` (TS, App Router, Tailwind v4, ESLint), klasör yapısı `web/`, `supabase/`, `docs/`, `.github/`
- [ ] **0.2** tsconfig strict, path alias `@/`, Prettier, commit convention (Conventional Commits), `.gitignore` (`.superpowers/` dahil), `git init` + ilk commit
- [ ] **0.3** Supabase projesi + CLI bağlantısı, `supabase/migrations/` altyapısı, `.env.example` (NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, PAYMENT_PROVIDER, ...)
- [ ] **0.4** CI (GitHub Actions): typecheck + lint + vitest + build; PR'da zorunlu
- [ ] **0.5** Tasarım token'ları: Tailwind theme (bölüm 4.1 renkleri), Inter variable font, temel tipografi
- [ ] **0.6** Core atomları + ilk birim testleri: Button (3 varyant + focus + disabled), Input (+label/hata), Badge, Spinner
- [ ] **0.7** Layout iskeleti: Header, Footer, `not-found.tsx`

**DoD:** `npm run build` temiz, CI yeşil, Button/Input testleri geçiyor, tasarım token'ları dokümante.

### FAZ 1 — Site + Panel (otomasyon mock; ana üretim fazı)

#### 1A. Ana Sayfa
- [ ] Hero: CSS/SVG su damlası + parçacık animasyonu; başlık + accent CTA; LCP bütçesine uy
- [ ] R3F 3D cihaz (lazy, reduced-motion fallback, mobilde statik SVG)
- [ ] "Nasıl Çalışır": 4 adımlı scroll-tetiklemeli anlatı (GSAP): Sipariş → Otomatik Randevu → Kurulum → 6 Aylık Abonelik
- [ ] Teknisyen Ağı Haritası (Modül 3): inline SVG Türkiye, il hover → Tooltip ("Antalya: 12 Aktif Teknisyen · Ort. Kurulum 24 Saat"), veri `regions` tablosundan
- [ ] Sosyal kanıt: onaylı `reviews` kartları
- [ ] SEO: metadata, OG image, sitemap, robots, JSON-LD (Organization, Product)

#### 1B. E-Ticaret Çekirdeği
- [ ] `products` seed verisi (5 cihaz + filtre setleri + parçalar — gerçekçi mock)
- [ ] Ürün listesi: ProductGrid, kategori filtreleri, fiyat/aşama badge'leri
- [ ] Ürün detayı: galeri, teknik özellik tablosu, X vs Y karşılaştırma tablosu (modüler)
- [ ] Sepet: Zustand + localStorage persist (sayfa yenilenince korunur), CartDrawer
- [ ] Checkout: adres → ödeme (MockPaymentProvider) → sipariş kaydı → onay ekranı
- [ ] Abonelik upsell: sepette "Abonelik Başlat" seçeneği (ilk yıl indirimli mantığı)
- [ ] Sipariş sonrası: magic link e-postası gönder (Supabase Auth invite/magic link)

#### 1C. İnteraktif Cihaz Seçici — Quiz (Modül 1)
- [ ] Stepper wizard (modal veya tam ekran): il/ilçe seçimi → "analiz" animasyonu (1.5s, sertlik verisi lookup) → kişi sayısı → sonuç
- [ ] `water_hardness` statik veri: 81 il + büyük ilçeler (ppm + seviye enum) — kaynak araştırması ayrı görev
- [ ] Öneri motoru: sertlik seviyesi × kişi sayısı → kapasite eşleme → ürün sıralaması (kurallar `lib/quiz/recommend.ts`'de, saf fonksiyon, birim testli)
- [ ] Sonuç ekranı: "Bölgenizin yüksek kireçli suyu için en uygunu: Model X" + accent CTA ile sepete ekleme
- [ ] Kenar durumlar: sertlik verisi olmayan ilçe → varsayılan öneri + "veriniz yoksa orta sertlik varsayıyoruz" notu

#### 1D. Müşteri Paneli (Modül 2 + 4)
- [ ] Magic link giriş + oturum yönetimi (Supabase Auth, middleware koruması, link süresi dolunca açıklayıcı hata + yeniden gönder)
- [ ] Dashboard: aktif sipariş durumu akışı, cihaz kartı, filtre sağlık barı (Modül 4 görseli)
- [ ] Randevu: kargo "Teslim Edildi" olunca açılan takvim; SlotPicker (bölüm 3.1 kilit mantığı); held/booked akışı
- [ ] Tek Tıkla Destek: acil buton → modal (sorun tipi: basınç/sızıntı/tat/diğer) → `support_tickets` kaydı → mock n8n çağrısı (log'lanır, Faz 2'de gerçek endpoint'e yönlendirilir)
- [ ] Abonelik sayfası: durum, sonraki fatura tarihi, iptal akışı (mock)
- [ ] Profil: adres ekleme/düzenleme

#### 1E. Kurumsal (B2B)
- [ ] `/kurumsal` landing: HORECA sektörü anlatımı, yüksek kapasiteli cihaz vitrini
- [ ] Toplu teklif formu → `b2b_leads` + doğrulama + başarı/hata durumları

#### 1F. Kalite Kapısı (faz kapanışı)
- [ ] Playwright E2E: ana senaryolar (quiz→sepet→ödeme→onay; magic link→randevu; destek ticket'ı)
- [ ] Lighthouse CI bütçeleri karşılanıyor (mobil öncelikli denetim)
- [ ] Klavye ile tüm akışlar gezilebilir; odak halkaları görünür
- [ ] Responsive denetim: 360px → 1920px
- [ ] KVKK çerezi/izni iskeleti + aydınlatma metni taslağı

**DoD:** Tüm kullanıcı akışları mock ödeme ile uçtan uca çalışıyor; E2E ve Lighthouse CI yeşil; reviewer subagent onayı verilmiş.

### FAZ 2 — Canlı Otomasyon

> **Not (2026-11-11):** Aşağıdaki **2.9** maddesi ("Admin yaklaşımı kararı: Supabase Studio vs
> basit admin UI") bu fazda ayrı bir faz olarak detaylandırıldı — bkz. **FAZ 3**.
> 2.9 artık "Studio ile idare et" değil, "FAZ 3'teki `/admin` panelini kullan" olarak okunur.

- [ ] **2.1** Iyzico üye işyeri + `IyzicoPaymentProvider`: checkout form, 3D Secure, webhook (imza doğrulama + idempotent işleme), abonelik recurring
- [ ] **2.2** n8n kurulumu (Cloud veya VPS — karar K-açık) + workflow export'ları repo'da (`n8n/` klasörü):
  - WF-01 `order-delivered` → randevu modülü aktifleşir + müşteriye bilgilendirme
  - WF-02 `support-ticket-created` → bölge teknisyenine Telegram: "ACİL SERVİS: [Ad] - [Adres] - [Sorun] - [Telefon]"
  - WF-03 `filter-day-170` (cron, günlük tarama) → SMS/mail + randevu linki
  - WF-04 randevu hatırlatıcıları (24 saat önce)
  - WF-05 abonelik faturalama olayları
- [ ] **2.3** Telegram bot: teknisyen kayıt/ata (chat_id eşleme), acil mesaj formatı
- [ ] **2.4** SMS sağlayıcı entegrasyonu (Netgsm veya Twilio — karar bekliyor)
- [ ] **2.5** Kargo durumu tetiği: sağlayıcı API veya operasyonel manuel tetik → `orders.status='delivered'`
- [ ] **2.6** Gerçek veri girişi: ürün kataloğu (gerçek fiyatlar), sertlik verisi doğrulaması, teknisyen kadrosu
- [ ] **2.7** Yasal paket: mesafeli satış sözleşmesi, iade koşulları, KVKK aydınlatma metni, çerez politikası
- [ ] **2.8** Prod: domain + SSL, Vercel prod ortamı, env'ler, Sentry (hata) + basit uptime izleme
- [ ] **2.9** Admin yaklaşımı kararı: Supabase Studio (hızlı) vs basit admin UI (öneri: Studio ile başla, ihtiyaç olursa UI)

#### Faz 1'den devralınan ertelenen işler

- [ ] **2.10** Lighthouse **mobil** preset + mobil bütçeler (Faz 1'de yalnız masaüstü koşuldu)
- [ ] **2.11** `Link > Button` iç içe semantik borcu: CTA'ları tek bir `ButtonLink` atomuna indir
- [ ] **2.12** `Tooltip` atomunu `components/ui` altına taşı (Faz 1'de harita/destek içinde inline)
- [ ] **2.13** `web/README.md` Next şablon metnini gerçek proje dokümanıyla değiştir
- [ ] **2.14** Supabase/Iyzico/n8n **gerçek entegrasyon testleri** (Faz 1'de yalnız birim + mock E2E)
- [ ] **2.15** Teknisyen haritası verisini gerçek kadroya bağla; il bazlı `technicians` tablosundan besle (şu an sabit demo verisi)

**DoD:** Sahte bir test siparişi gerçek ödemeyle alınır, kurulum randevusu teknisyenin Telegram'ına düşer, 170 gün tetiği sandbox'ta doğrulanır; 2.10–2.15 kapanmış olur.

> **Faz 1 durumu (2026-11-11):** Faz 0 ve Faz 1 tamamlandı, commit `feat/faz-0-1-temel-site-panel`
> dalında. Doğrulama: 15 test dosyası / 102 test, `tsc`, ESLint, Prettier, `next build` (33 sayfa),
> Playwright 5/5, Lighthouse masaüstü 4 URL bütçe içinde. Yukarıdaki 2.10–2.15 maddeleri
> bilinçli olarak Faz 2'ye taşındı.

### FAZ 3 — Yönetici Paneli: Ürün, Fiyat, Stok

> **Karar (2026-11-11):** Vitrin ürünleri artık **veritabanından** okunur. `web/src/lib/data/products.ts`
> yalnızca (a) ilk seed verisi ve (b) Supabase yapılandırılmadığında yedek kaynak olarak kalır.
> Yöneticinin panelde yaptığı fiyat/stok değişikliği sitede **görünür**.
>
> **Stok kuralı:** Başlangıç adedini yönetici elle girer. Satış gerçekleştiğinde stok **otomatik**
> düşer; sipariş iptal/iade edilirse geri yükselir. Yönetici her zaman elle düzeltebilir
> (sayım farkı, hasar, iade). Düşük stok uyarısı **yalnızca müşteri arayüzünde** gösterilir —
> yöneticiye e-posta/Telegram bildirimi bu fazda yok.

#### 3.0 Kapsam

| İçeride | Dışarıda (bilinçli) |
|---|---|
| Yönetici girişi (magic link + DB'de rol) | Ayrı şifre/2FA sistemi |
| Ürün ekleme, düzenleme, pasife alma, silme | Sipariş/randevu/destek yönetim ekranları |
| Fiyat belirleme (TRY, 2 hane) | Kampanya/indirim motoru |
| Stok: elle giriş, satışta otomatik düşüş, iade ile geri artış | Çoklu depo / şube bazlı stok |
| Stok hareket geçmişi (denetim izi) | Tedarikçi/satın alma modülü |
| Vitrinde `stock <= 3` uyarısı | Yöneticiye düşük stok bildirimi |
| Ürün görseli (URL + Storage yükleme) | Görsel kırpma/editörü |
| Panelde özet dashboard | Grafik/rapor motoru (Faz 4+) |

#### 3.1 Yaklaşım karşılaştırması (neden bu yol)

| Yaklaşım | Değerlendirme |
|---|---|
| **A. Ayrı `/admin` route grubu + DB'de `admin` rolü + RLS** ✅ | Yetki tek yerde (DB). Tarayıcıya service-role anahtarı inmez. Müşteri paneliyle karışmaz. İleride sipariş/randevu yönetimi aynı yere eklenir. |
| B. Mevcut `/panel` içinde role göre menü | Daha az dosya; ama müşteri ve yönetici kod yolları iç içe geçer, her sayfada yetki kontrolü tekrarlanır. Reddedildi. |
| C. Env'de yönetici şifresi + service-role API route'ları | RLS tamamen atlanır; şifre tek savunma hattı; her yazma ucu elle korunmalı. Reddedildi. |

**Güvenlik modeli:** Yetkilendirme iki katmanlıdır.
1. **Arayüz katmanı** — admin olmayan kullanıcı `/admin/*` altında "yetkiniz yok" ekranı görür (UX).
2. **Gerçek sınır: RLS** — yazma politikaları `public.is_admin()` çağırır. Kullanıcı arayüzü
   atlatsa bile anon key + kendi JWT'si ile ürün yazamaz. Bu yüzden panelin istemci tarafında
   çalışması güvenlik açığı üretmez.

#### 3.2 Veritabanı değişiklikleri

**Yeni migration:** `supabase/migrations/20261112000001_admin_panel.sql`
(mevcut `20261111000001_init.sql` **değiştirilmez** — geçmiş korunur, değişiklik geri alınabilir kalır.)

**(a) Rol modeli**

```sql
create type user_role as enum ('customer', 'admin');

alter table public.profiles
  add column role user_role not null default 'customer';

create index profiles_role_idx on public.profiles (role) where role = 'admin';

-- RLS politikalarında kullanılacak tek yetki kaynağı.
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
```

**(a-2) Yetki yükseltmesini engelleme (kritik)**

`init.sql` içindeki `profiles_update_own` politikası kullanıcının **kendi satırını** güncellemesine
izin veriyor. `role` kolonu eklendiğinde bu politika tek başına şu saldırıya açık hâle gelir:

```sql
-- SALDIRI: herhangi bir müşteri kendini admin yapar
update public.profiles set role = 'admin' where id = auth.uid();
```

RLS satır düzeyinde çalışır, **kolon** düzeyinde çalışmaz. Bu yüzden kolon yetkileri kısılmalıdır:

```sql
-- Kullanıcı yalnız kendi adını/telefonunu değiştirebilir; role ASLA.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Profil satırı auth trigger'ı ile oluşur; istemci insert edemez (role enjeksiyonu kapalı).
revoke insert on public.profiles from authenticated;
```

> `role` ataması yalnız `postgres`/`service_role` (SQL, Studio) ile yapılır — bkz. (g).
> Doğrulama testi: müşteri JWT'si ile `update profiles set role='admin'` → `42501` hatası almalı.

> `is_admin()` **security definer**'dır: RLS politikası `profiles` tablosunu okurken tekrar RLS'e
> takılmaz (sonsuz özyineleme yok). `search_path` sabitlenmiştir.

**(b) `products` tamamlanması** — eksik denetim alanları ve doğrulamalar

```sql
alter table public.products
  add column updated_at timestamptz not null default now(),
  add column sku text unique,
  add column cost_try numeric(10,2) check (cost_try is null or cost_try >= 0),
  add column low_stock_note text;          -- yöneticinin stok notu (opsiyonel)

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Slug biçimi DB'de de garanti edilir (uygulama zod ile aynı kuralı uygular).
alter table public.products
  add constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Fiyat üst sınırı: numeric(10,2) zaten 99.999.999,99 ile sınırlı.
```

> `low_stock_threshold` **kolon olarak eklenmez.** Eşik ürün başına değişen bir iş kuralı değil,
> tek bir sabittir: `LOW_STOCK_THRESHOLD = 3` (`web/src/lib/products/stock.ts`). Sabit tutmak,
> panelde yanlışlıkla eşiği değiştirip uyarıyı kaybetme riskini ortadan kaldırır.

**(c) Stok hareketleri (denetim izi)**

```sql
create type stock_reason as enum ('initial', 'manual', 'sale', 'cancel', 'return');

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  delta int not null check (delta <> 0),           -- + giriş, - çıkış
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

-- Aynı sipariş için satış hareketi yalnızca BİR kez yazılabilir (idempotency).
create unique index stock_movements_sale_order_uidx
  on public.stock_movements (order_id, product_id)
  where reason = 'sale';
```

`stock_movements` **yalnızca ekleme** tablosudur: `update`/`delete` politikası hiç tanımlanmaz
(varsayılan: reddedilir). Yönetici geçmişi okuyabilir, değiştiremez.

**(d) Stok fonksiyonları**

```sql
-- Yöneticinin elle stok belirlemesi. Tek atomik nokta: stok + hareket birlikte yazılır.
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
    raise exception 'YETKISIZ' using errcode = '42501';
  end if;
  if p_new_stock is null or p_new_stock < 0 then
    raise exception 'GECERSIZ_STOK' using errcode = '22023';
  end if;

  select stock into v_current from public.products where id = p_product_id for update;
  if not found then
    raise exception 'URUN_BULUNAMADI' using errcode = 'P0002';
  end if;

  v_delta := p_new_stock - v_current;
  if v_delta = 0 then return v_current; end if;

  update public.products set stock = p_new_stock where id = p_product_id;

  insert into public.stock_movements (product_id, delta, stock_after, reason, actor_id, note)
  values (p_product_id, v_delta, p_new_stock, 'manual', auth.uid(), p_note);

  return p_new_stock;
end;
$$;

revoke all on function public.set_product_stock(uuid, int, text) from public;
grant execute on function public.set_product_stock(uuid, int, text) to authenticated;
```

```sql
-- Sipariş "paid" olduğunda stok düşer; iptalde geri gelir. Idempotenttir.
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
  -- Zaten uygulanmışsa hiçbir şey yapma (webhook tekrarı / çift tetik).
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
      raise exception 'YETERSIZ_STOK: % (urun %)', r.qty, r.product_id
        using errcode = 'P0001';
    end if;

    insert into public.stock_movements (product_id, delta, stock_after, reason, order_id)
    values (r.product_id, -r.qty, v_after, 'sale', p_order_id);
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
    return;  -- daha önce geri alındı
  end if;
  if not exists (
    select 1 from public.stock_movements
    where order_id = p_order_id and reason = 'sale'
  ) then
    return;  -- hiç düşülmemiş (pending iptali) → geri alınacak bir şey yok
  end if;

  for r in
    select product_id, -sum(delta)::int as qty
    from public.stock_movements
    where order_id = p_order_id and reason = 'sale'
    group by product_id
  loop
    update public.products set stock = stock + r.qty
     where id = r.product_id
    returning stock into v_after;

    insert into public.stock_movements (product_id, delta, stock_after, reason, order_id)
    values (r.product_id, r.qty, v_after, 'cancel', p_order_id);
  end loop;
end;
$$;

-- Bu fonksiyonlar YALNIZ tetikleyiciden çalışır. İstemciye execute verilirse
-- herhangi bir kullanıcı başkasının siparişi için stok düşürebilir/artırabilir.
revoke all on function public.apply_order_stock(uuid) from public;
revoke all on function public.restore_order_stock(uuid) from public;
revoke all on function public.on_order_status_change() from public;

-- Tetikleyiciler: paid'e geçişte düş, cancelled'a geçişte geri al.
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
  after insert or update of status on public.orders
  for each row execute function public.on_order_status_change();
```

> **Neden `order_items` insert'inde değil?** `pending` sipariş stoğu **rezerve etmez**. Aksi hâlde
> yarım bırakılan ödemeler stoğu kilitler. Stok, gerçek satış anında (`paid`) düşer. Bu ayrıca
> Iyzico webhook'u bağlandığında (Faz 2.1) hiçbir değişiklik gerektirmeden doğru davranıştır.
>
> **Yetersiz stokta ne olur?** `raise exception` tüm işlemi geri alır (transaction rollback).
> Demo/checkout akışı bu hatayı yakalayıp "Bu ürün için yeterli stok yok" mesajı gösterir.
> Araya giren eşzamanlı iki satış `update ... where stock >= qty` sayesinde yarışa girmez.
>
> **Sipariş oluşturma sözleşmesi (önemli):** Sipariş **`pending`** olarak açılır → `order_items`
> eklenir → ödeme onayında `status='paid'` yapılır. Stok tam bu geçişte düşer.
> Siparişi doğrudan `paid` olarak insert etmek **desteklenmez**: `after insert` tetikleyicisi
> çalıştığında `order_items` henüz yoktur, dolayısıyla stok düşmez ve sipariş "bedava satış"
> görünümü kazanır. Bu yüzden `orders` insert'i her zaman `pending` olmalıdır; ödeme webhook'u
> (Faz 2.1) ayrı bir `update ... set status='paid'` çağırır. Checkout kodu bu sözleşmeye uymalı,
> `apply_order_stock` çağrısını istemciye bırakmamalıdır.

**(e) RLS politikaları**

```sql
-- Ürünler: herkes yalnız aktif ürünleri okur; admin her şeyi okur ve yazar.
alter table public.products enable row level security;  -- init'te zaten açık

create policy "products_read_active" on public.products
  for select using (is_active = true);

create policy "products_admin_read_all" on public.products
  for select using (public.is_admin());

create policy "products_admin_insert" on public.products
  for insert with check (public.is_admin());

create policy "products_admin_update" on public.products
  for update using (public.is_admin()) with check (public.is_admin());

create policy "products_admin_delete" on public.products
  for delete using (public.is_admin());

-- Stok hareketleri: yalnız admin okur; yazma yalnız security definer fonksiyonlardan.
alter table public.stock_movements enable row level security;

create policy "stock_movements_admin_read" on public.stock_movements
  for select using (public.is_admin());
```

> `products_read_active` mevcut politikanın yerine geçer; uygulayıcı init'teki ürün politikasını
> bu dosyada `drop policy if exists` ile kaldırıp yeniden tanımlamalı (isim çakışması olmasın).

**(f) Görsel depolama**

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_admin_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
```

**(g) Yönetici atama (tek seferlik, SQL)**

```sql
-- Önce kullanıcı magic link ile bir kez giriş yapmış olmalı (profiles satırı doğar).
update public.profiles p
   set role = 'admin'
  from auth.users u
 where u.id = p.id
   and u.email = 'yonetici@ornek.com';

-- Doğrulama
select u.email, p.role from public.profiles p join auth.users u on u.id = p.id
where p.role = 'admin';
```

Bu komut `supabase/seed.sql`'e **konmaz** (sır/kimlik bilgisi repoya girmez); `supabase/README.md`
veya çalıştırma notunda belgelenir. Panelde "kullanıcıyı admin yap" ekranı bu fazda yoktur —
rol yükseltme bilinçli olarak DB'den, elle yapılır (en küçük saldırı yüzeyi).

#### 3.3 Uygulama katmanı

**Tek veri erişim noktası** — sayfalar doğrudan `supabase` veya `products.ts` çağırmaz:

```
web/src/lib/products/
├── repository.ts        # ProductRepository arayüzü + ortak tipler
├── supabase-repo.ts     # SupabaseRepository (sunucu tarafı, RLS'li)
├── demo-repo.ts         # DemoRepository (zustand store üzerinden)
├── seed.ts              # data/products.ts → Product[] dönüşümü (tek yönlü)
└── stock.ts             # LOW_STOCK_THRESHOLD = 3, stockState(), stockLabel()
```

| Fonksiyon | Supabase modu | Demo modu |
|---|---|---|
| `listProducts()` | `select * from products where is_active order by category, name` | store'daki `products` |
| `getProductBySlug(slug)` | `select ... where slug = $1 and is_active` | store'dan filtre |
| `listAllProducts()` (admin) | tüm satırlar | store'daki tümü |
| `createProduct(input)` | `insert ... returning *` | store'a ekle |
| `updateProduct(id, patch)` | `update ... returning *` | store'da güncelle |
| `setStock(id, newStock, note)` | `rpc('set_product_stock', …)` | `setStock` + hareket kaydı |
| `deleteProduct(id)` | `delete` (sipariş geçmişi varsa `is_active=false` önerilir) | store'dan çıkar |

- **Sunucu tarafı okuma:** vitrin sayfaları (`/urunler`, `/urunler/[slug]`, ana sayfa) Server
  Component olarak `listProducts()` çağırır; Supabase env yoksa `seed.ts` döner. Böylece demo mod
  bozulmadan çalışmaya devam eder.
- **Önbellek:** `export const revalidate = 60` + admin yazma sonrası `revalidatePath("/urunler")`,
  `revalidatePath("/urunler/[slug]", "page")`, `revalidatePath("/")`.
- **İstemci tarafı yazma:** admin formları tarayıcıdaki `@supabase/supabase-js` istemcisiyle
  yazar (oturum çerezde/localStorage'da). `@supabase/ssr` bağımlılığı **eklenmez**; SSR oturumu
  gerekirse Faz 4'e not düşülür.

**Tip güvenliği:** `supabase gen types typescript` çıktısı `web/src/lib/supabase/database.types.ts`
olarak üretilir ve repository'de kullanılır. Üretim komutu README'ye eklenir; CI'da şema
değişikliğinde tip farkı kontrol edilir.

**Demo modda admin:** Supabase yapılandırılmamışsa `/admin/giris` herhangi bir e-postayla oturum
açar ve demo kullanıcısına `role: "admin"` yazar; panelin üstünde kalıcı
"Demo mod — değişiklikler yalnız bu tarayıcıda" bandı görünür. Satış simülasyonunda
(`placeOrder`) stok, `stock_movements` mantığının aynısıyla düşer.

#### 3.4 Sayfa envanteri — `/admin`

| Rota | Tür | İçerik |
|---|---|---|
| `/admin/giris` | CSR | Magic link talebi; `emailRedirectTo: <origin>/admin` |
| `/admin` | CSR (auth) | Dashboard: KPI kartları, kritik stok listesi, son hareketler, hızlı işlemler |
| `/admin/urunler` | CSR (auth) | Ürün tablosu: görsel, ad, kategori, fiyat, stok, durum; arama, kategori filtresi, sıralama |
| `/admin/urunler/yeni` | CSR (auth) | Ürün oluşturma formu |
| `/admin/urunler/[id]` | CSR (auth) | Düzenleme formu + stok paneli + hareket geçmişi |
| `/admin/stok` | CSR (auth) | Tüm ürünlerin stok durumu; satır içi hızlı güncelleme; "kritik" filtresi |
| `/admin/yetkisiz` | CSR | Admin olmayan kullanıcıya açıklama + panele dönüş |

**Dashboard metin taslağı:**

```
┌──────────────────────────────────────────────────────────────┐
│ AquaPure · Yönetim                        yonetici@ornek.com  │
├──────────┬───────────────────────────────────────────────────┤
│ Ürünler  │  Genel Bakış                                      │
│ Stok     │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│          │  │Ürün 24 │ │Aktif 21│ │Kritik 3│ │Tükendi 2│     │
│          │  └────────┘ └────────┘ └────────┘ └────────┘      │
│          │                                                   │
│          │  Kritik stok (≤3)                                 │
│          │  • AquaPure Pro 6       2 adet   [Stok güncelle]  │
│          │  • Sediment Filtre 10"  1 adet   [Stok güncelle]  │
│          │                                                   │
│          │  Son stok hareketleri                             │
│          │  • −1  Home 5 · satış SP-2026-1042 · 12:04        │
│          │  • +20 Pro 6 · elle giriş · dün 09:30             │
└──────────┴───────────────────────────────────────────────────┘
```

#### 3.5 Ürün formu alanları

| Alan | Tip | Doğrulama | Not |
|---|---|---|---|
| `name` | metin | 3–120 karakter, zorunlu | |
| `slug` | metin | `^[a-z0-9]+(-[a-z0-9]+)*$`, tekil | Ad yazılırken otomatik türetilir (Türkçe karakter → ASCII); elle düzenlenebilir |
| `category` | seçim | `device`/`filter`/`part` | |
| `price_try` | sayı | > 0, 2 ondalık, ≤ 99.999.999,99 | TL olarak girilir, `numeric(10,2)` saklanır |
| `cost_try` | sayı | ≥ 0, opsiyonel | Panelde kâr marjı göstergesi (opsiyonel) |
| `stock` | tam sayı | ≥ 0 | Yeni üründe başlangıç adedi; düzenlemede **"Yeni stok adedi"** olarak gösterilir ve `set_product_stock` RPC'sine gider (hareket kaydı üretir) |
| `sku` | metin | opsiyonel, tekil | |
| `summary` | metin | ≤ 200 karakter | Kart açıklaması |
| `stages` | sayı | 1–12, opsiyonel | Cihazlarda |
| `capacity_lpd` | sayı | > 0, opsiyonel | |
| `specs` | anahtar-değer listesi | en fazla 20 satır | `jsonb` |
| `images` | URL listesi + dosya yükleme | en fazla 5, her biri ≤ 5 MB, jpeg/png/webp/avif | Supabase modunda Storage'a yüklenir; demo modda yalnız URL |
| `is_active` | anahtar | — | Pasif ürün vitrinde görünmez, silinmiş sayılmaz |
| `low_stock_note` | metin | ≤ 200, opsiyonel | Yönetici notu (müşteriye görünmez) |

**Silme davranışı:** Ürünün `order_items`/`installations` kaydı varsa silme **reddedilir** (FK
`restrict`); panel bunu yakalayıp "Sipariş geçmişi olan ürün silinemez, pasife alın" önerir.

**Fiyat değişikliği geçmişi:** `order_items.unit_price` anlık kopya olduğu için eski siparişler
etkilenmez; bu fazda ayrı fiyat geçmişi tablosu **yok** (gerekirse Faz 4).

#### 3.6 Vitrinde stok uyarısı (yalnızca müşteri arayüzü)

`web/src/lib/products/stock.ts`:

```ts
export const LOW_STOCK_THRESHOLD = 3;

export type StockState = "out" | "low" | "in";

export function stockState(stock: number): StockState {
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low";
  return "in";
}

export function stockLabel(stock: number): string | null {
  const state = stockState(stock);
  if (state === "out") return "Tükendi";
  if (state === "low") return `Son ${stock} adet`;
  return null;
}
```

| Durum | Koşul | Ürün kartı | Detay sayfası | Sepet davranışı |
|---|---|---|---|---|
| Normal | `stock > 3` | etiket yok | "Stokta" (success) | Ekle aktif |
| Düşük | `1 ≤ stock ≤ 3` | `Son 3 adet` (warning, turuncu) | `Son 3 adet` (warning) + "Tükenmek üzere" | Ekle aktif; adet `stock` ile sınırlı |
| Tükendi | `stock = 0` | `Tükendi` (danger), görsel %60 opak | `Tükendi` (danger) | Ekle **pasif**; `schema.org` → `OutOfStock` |

- Değişecek dosyalar: `components/shop/product-card.tsx`, `app/urunler/[slug]/page.tsx`,
  `lib/store/cart.ts` (adet üst sınırı), `app/sepet/page.tsx` (stok aşımı uyarısı).
- Erişilebilirlik: uyarı yalnız renkle değil **metinle** verilir; `aria-live="polite"` gerektiren
  dinamik durum yok (sunucu render'ı).
- Uyarı **admin panelinde gösterilmez**; panelde ayrı bir "Kritik stok" listesi vardır (bilgi amaçlı).

#### 3.7 Testler (TDD — önce test)

| Katman | Test | Beklenen |
|---|---|---|
| RLS (entegrasyon) | Müşteri JWT'si ile `insert into products` | Reddedilir (42501) |
| RLS | Admin JWT'si ile `insert/update/delete` | Başarılı |
| RLS | Anon `select products` | Yalnız `is_active = true` |
| RLS | Admin `select products` | Pasifler dahil tümü |
| Yetki | Müşteri `update profiles set role='admin'` | Reddedilir (42501) |
| Yetki | Müşteri `rpc('apply_order_stock', başka_sipariş)` | Reddedilir (fonksiyon execute yetkisi yok) |
| Yetki | Müşteri `insert into stock_movements` | Reddedilir (politika yok) |
| Stok | `set_product_stock` 20 → 5 | `stock=5`, hareket `delta=-15, reason='manual'` |
| Stok | Sipariş `pending → paid` | Stok düşer, `reason='sale'` hareketi |
| Stok | Aynı sipariş tekrar `paid` | Stok **değişmez** (idempotent) |
| Stok | Stok 2, sipariş 5 adet | `YETERSIZ_STOK` hatası, stok 2 kalır, sipariş `paid` olmaz |
| Stok | `paid → cancelled` | Stok geri yükselir, `reason='cancel'` |
| Stok | `pending → cancelled` | Stok değişmez (hiç düşülmemiş) |
| Birim | `stockState()` sınırları (0,1,3,4) | `out/low/low/in` |
| Birim | Ürün formu zod şeması (fiyat, slug, stok) | Geçersiz girdiler reddedilir |
| Bileşen | `ProductCard` stok 3 | "Son 3 adet" + warning varyantı |
| Bileşen | `ProductCard` stok 0 | Ekle butonu `disabled` |
| Demo store | `placeOrder` 2 adet | Stok 2 düşer, 0'ın altına inmez |
| E2E (Playwright) | Admin giriş → ürün ekle → `/urunler`'de görünür | Uçtan uca |
| E2E | Müşteri satın alır → admin panelde stok düşmüş | Uçtan uca |
| E2E | Müşteri hesabıyla `/admin` | `/admin/yetkisiz`'e yönlenir |

#### 3.8 Görev listesi

- [ ] **3.1** `20261112000001_admin_panel.sql`: enum'lar, `profiles.role`, `is_admin()`, `products` alanları
- [ ] **3.2** `stock_movements` tablosu + idempotency indeksi
- [ ] **3.3** `set_product_stock`, `apply_order_stock`, `restore_order_stock`, tetikleyiciler
- [ ] **3.4** RLS politikaları (products, stock_movements) + storage bucket ve politikaları
- [ ] **3.5** `supabase db reset` + yerel entegrasyon testleri (RLS + stok) yeşil
- [ ] **3.6** `supabase gen types` → `database.types.ts`; repository katmanı (`supabase-repo`, `demo-repo`, `seed`)
- [ ] **3.7** Vitrin sayfalarını repository'ye geçir; `revalidate` + `revalidatePath`
- [ ] **3.8** `stock.ts` + ürün kartı/detay/sepet stok uyarısı ve tükenme koruması
- [ ] **3.9** Admin kabuğu: `/admin` layout, yetki kapısı, `/admin/giris`
- [ ] **3.10** Dashboard (KPI, kritik stok, son hareketler)
- [ ] **3.11** Ürün listesi + yeni/düzenle formu + görsel yükleme
- [ ] **3.12** Stok sayfası + hareket geçmişi
- [ ] **3.13** Demo mod paritesi: admin CRUD + satışta stok düşüşü localStorage'da
- [ ] **3.14** E2E + dokümantasyon (admin atama SQL'i, `gen types` komutu, README)

#### 3.9 DoD (Definition of Done)

- Admin, siteye magic link ile girip `/admin`'e ulaşıyor; admin olmayan kullanıcı yazma yapamıyor.
- Yeni ürün eklenip vitrinde görünüyor; fiyat değişikliği vitrine yansıyor.
- Stok elle girilebiliyor; satışta otomatik düşüyor; iptalde geri geliyor; yetersiz stokta satış engelleniyor.
- `stock <= 3` olduğunda vitrinde "Son X adet", `0` olduğunda "Tükendi" ve sepete ekleme kapalı.
- Her stok değişikliği `stock_movements`'ta izlenebiliyor (kim, ne zaman, neden).
- `tsc`, ESLint, Prettier, `next build` temiz; yeni testler yeşil; E2E admin akışı geçiyor.
- Reviewer subagent/`orchestra_review` onayı alınmış.

#### 3.10 Riskler ve açık kararlar

| Risk / karar | Etki | Önlem |
|---|---|---|
| Admin paneli istemci tarafında çalışıyor | SSR'da admin verisi görünmez | Güvenlik RLS'te; SSR gerekirse Faz 4'te `@supabase/ssr` |
| `products` FK `restrict` nedeniyle silme reddi | Yönetici şaşırır | Panel "pasife al" önerir, hatayı Türkçe açıklar |
| Fiyat değişikliği geçmişi yok | Eski fiyatlar izlenemez | `order_items.unit_price` snapshot'ı yeterli; tam geçmiş Faz 4 |
| Görsel yükleme Storage kotası | Kota dolabilir | 5 MB/dosya, 5 dosya/ürün sınırı; demo modda URL |
| `regions.plate` uyumsuzluğu (önceki fazdan) | Harita/DB tutarsızlığı | Bu fazın kapsamı dışı; Faz 2.15 ile kapatılacak |
| `orders_insert_own` politikası hâlâ gevşek | İstemci `total_try`/`status` yazabilir | Stok tetikleyicisi `paid`'e geçişte çalıştığı için sahte `paid` siparişi stok düşürebilir → **üretimde bu politika sıkılaştırılmalı** (Faz 2.1 webhook + service role). Demo modda kabul edilebilir. |

> **Not:** Son satır kritik. Stok otomasyonu devreye girdiği anda `orders` insert politikası
> gerçek bir yetki sınırı hâline gelir. Faz 3 canlıya alınmadan önce `orders_insert_own`
> politikası kaldırılıp sipariş oluşturma webhook'a taşınmalı **veya** bu faz bilinçli olarak
> yalnız demo/yerel ortamda çalıştırılmalıdır.

---

## 7. Test ve Kalite Stratejisi

| Katman | Araç | Kapsam |
|---|---|---|
| Birim | Vitest + Testing Library | Öneri motoru, sepet reducer, filtre ömrü hesabı, form doğrulamalar, buton/atom davranışları |
| Entegrasyon | Vitest + Supabase local | RLS policy'ler, slot kilidi, webhook idempotency |
| E2E | Playwright | Quiz→sepet→ödeme→onay; magic link→randevu; destek ticket; B2B formu |
| Performans | Lighthouse CI | Bölüm 4.5 bütçeleri, her PR'da |
| Bağımsız denetim | reviewer subagent | Her kod görevi sonrası (AGENTS.md kuralı) |

**Süreç kuralları:** Conventional Commits; her görev tek commit; TDD (test önce); CRITICAL/HIGH bulgu kapanmadan faz bitmez.

## 8. Review Focus (uygulayıcıya: bu listeye test ekle)

1. **Sepet kalıcılığı** — sayfa yenilenince sepet kaybolmamalı → localStorage persist unit test.
2. **Bilinmeyen ilçe sertliği** — quiz çökmemeli, varsayılan öneri dönmeli → `recommend()` test.
3. **Slot yarışı** — iki eşzamanlı istek aynı slotu alamamalı → entegrasyon testi (bölüm 3.1).
4. **Webhook tekrarı** — aynı olay iki kez gelirse çift sipariş/çift fatura olmamalı → idempotency test.
5. **Magic link süresi** — süresi dolmuş link açıklayıcı hata vermeli, sessiz 404 değil → E2E.
6. **Saat dilimi** — filtre ömrü ve 170 gün sayacı UTC depola / Istanbul göster → sınır günü test.

7. **Yetki sınırı (FAZ 3)** — admin olmayan kullanıcı ürün yazamamalı; arayüz kapısı aşılsa bile RLS reddetmeli → RLS entegrasyon testi.
8. **Stok yarışı (FAZ 3)** — aynı ürünün son 1 adedi için iki eşzamanlı satış: biri başarılı, diğeri `YETERSIZ_STOK` almalı; stok negatife düşmemeli → paralel entegrasyon testi.
9. **Stok idempotency (FAZ 3)** — aynı sipariş için `paid` olayı iki kez işlenirse stok iki kez düşmemeli → webhook tekrar testi.
10. **Düşük stok eşiği (FAZ 3)** — `stock=3` uyarı gösterir, `stock=4` göstermez; `stock=0` sepete eklemeyi kapatır → sınır testi.

## 9. Riskler

| Risk | Etki | Önerilen önlem |
|---|---|---|
| Iyzico üye işyeri onay süreci gecikmesi | Faz 2 gecikir | Faz 1'de mock ile ilerle; hesap başvurusunu erken başlat |
| İl sertlik verisinin doğruluğu | Yanlış öneri → güven kaybı | Kaynağı çapraz doğrula; quiz'te "size en yakın sonucu" disclaimer'ı |
| 3D'ün mobil performansı | Lighthouse düşer | Lazy + reduced-motion + mobilde SVG fallback (K9) |
| n8n bakımı (self-host) | Otomasyon çöker | n8n Cloud ile başla, VPS'e geçiş opsiyonu |
| KVKK/yasal eksiklik | Canlıya alamaz | 2.7 görevini canlıya almadan önce bitir |

## 10. Zaman Çizelgesi (tahmi̇ni̇)

| Faz | Tahmin | Not |
|---|---|---|
| 0 — Temel | ~1 gün | |
| 1 — Site + Panel | ~2-3 hafta (agent hızında günler) | 6 alt epik, sıralı bağımlılıklar |
| 2 — Canlı Otomasyon | ~1-2 hafta + dış hesap bekleme süreleri | Iyzico/SMS/n8n hesapları paralel açılmalı |
| 3 — Yönetici Paneli | ~4-6 gün (agent hızında) | Migration + repository geçişi + admin UI; Faz 2'den bağımsız başlayabilir |

---

*Bu belge canlıdır: kararlar netleştikçe Decision Log güncellenir. Orijinal PRD: `docs/PRD.md`.*
