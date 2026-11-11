# AquaPure — Su Arıtma Platformu

Su arıtma cihazları için premium e-ticaret + satış sonrası otomasyon platformu.
Next.js 15 (App Router) + Tailwind CSS v4 + TypeScript strict + Supabase şeması.

> Faz 0 ve Faz 1 uygulandı. Faz 2 (canlı Iyzico/n8n/SMS) için arayüzler hazır.

## Hızlı başlangıç

```bash
cd web
cp .env.example .env.local   # opsiyonel; boşsa demo mod
npm install
npm run dev                  # http://localhost:3000
```

## Demo mod

`NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` tanımlı değilse uygulama **demo modda** çalışır:

- Sipariş, adres, destek bildirimi ve randevular tarayıcıda (`localStorage`) tutulur.
- Ödeme `MockPaymentProvider` ile anında onaylanır; kart bilgisi istenmez.
- Magic link e-postası gönderilmez; girilen e-posta ile oturum açılır.
- n8n/Telegram çağrıları `console.info("[automation:mock] ...")` olarak loglanır.

Supabase anahtarlarını girdiğinizde istemci devreye girer; şema için
`supabase/migrations/20261111000001_init.sql` (RLS + slot kilidi dahil).

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu (Turbopack) |
| `npm run build` | Üretim derlemesi |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest birim/entegrasyon testleri |
| `npm run e2e` | Playwright uçtan uca testler |
| `npm run format` | Prettier |
| `npx @lhci/cli autorun` | Lighthouse bütçe denetimi |

## Yapı

```
web/
  src/app/            # Rotalar (vitrin, quiz, sepet, ödeme, panel, B2B, KVKK)
  src/components/     # Atomic design: ui / layout / home / shop / quiz / panel
  src/lib/
    data/             # Ürün, bölge, yorum, su sertliği seed
    quiz/             # Öneri motoru (saf fonksiyon, testli)
    appointments/     # Slot üretimi + 10 dk hold/confirm mantığı
    payments/         # PaymentProvider arayüzü + MockPaymentProvider
    store/            # Zustand sepet (persist) + demo veri store'u
  e2e/                # Playwright senaryoları
supabase/migrations/  # PostgreSQL şeması, RLS, RPC'ler
.github/workflows/    # CI: format, lint, typecheck, test, build, e2e, lighthouse
```

## Fazlar

- **Faz 0 — Temel:** iskelet, CI, tasarım token'ları, atomlar, layout. ✅
- **Faz 1 — Site + Panel:** ana sayfa, e-ticaret, quiz, müşteri paneli, B2B, kalite kapısı. ✅
- **Faz 2 — Canlı otomasyon:** Iyzico, n8n, Telegram, SMS, kargo, yasal paket, prod. ⏳

## Kararlar

Karar günlüğü ve gerekçeler: `docs/superpowers/plans/2026-11-11-su-aritma-platformu-yol-haritasi.md`.
Uygulama planları: `docs/superpowers/plans/2026-11-11-faz-0-detayli-plan.md`,
`docs/superpowers/plans/2026-11-11-faz-1-detayli-plan.md`.

## Lisans

Özel proje — tüm hakları saklıdır.
