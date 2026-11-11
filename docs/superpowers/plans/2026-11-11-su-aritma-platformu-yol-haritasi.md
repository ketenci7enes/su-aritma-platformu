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

**Açık kararlar (yol boyunca netleşecek):** marka adı, domain, gerçek ürün kataloğu verisi, il bazlı sertlik verisi kaynağı, Iyzico üye işyeri hesabı, SMS sağlayıcısı (Netgsm/Twilio), n8n hosting (Cloud vs VPS), kargo entegrasyonu sağlayıcısı, admin yaklaşımı (öneri: ilk aşamada Supabase Studio).

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
| `profiles` | id (auth.users), full_name, phone, created_at | Müşteri; magic link auth ile 1:1 |
| `addresses` | id, profile_id, il, ilce, line, title | profile_id → profiles |
| `products` | id, slug, name, category(device/filter/part), price_try, stages, capacity_lpd, specs(jsonb), stock, images[] | Cihaz + yedek parça + filtre aynı tabloda category ile |
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

**DoD:** Sahte bir test siparişi gerçek ödemeyle alınır, kurulum randevusu teknisyenin Telegram'ına düşer, 170 gün tetiği sandbox'ta doğrulanır.

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

---

*Bu belge canlıdır: kararlar netleştikçe Decision Log güncellenir. Orijinal PRD: `docs/PRD.md`.*
