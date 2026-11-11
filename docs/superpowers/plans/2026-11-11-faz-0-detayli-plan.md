# FAZ 0 — Temel: Detaylı Uygulama Planı

> Ana yol haritası: `docs/superpowers/plans/2026-11-11-su-aritma-platformu-yol-haritasi.md`
> Spek: `docs/PRD.md` · Karar günlüğü: yol haritası §1

**Hedef:** Üzerine Faz 1'in kurulacağı, CI'ı yeşil, test altyapısı çalışan Next.js 15 iskeleti.

**Kapsam dışı:** İş özellikleri (Faz 1), gerçek Supabase projesi (kimlik bilgisi yok → migration + istemci altyapısı yeterli).

## Görevler

### 0.1 Repo iskeleti
- `web/` Next.js 15 (App Router, TS, Tailwind v4, ESLint, src dir, `@/*`)
- `supabase/migrations/`, `docs/`, `.github/workflows/`
- **Doğrulama:** `npm run build` çalışır.

### 0.2 Kalite tabanı
- `tsconfig` strict + `noUncheckedIndexedAccess`
- Prettier + `prettier-plugin-tailwindcss`, `.prettierrc`
- Conventional Commits (README'de belgelenir), `.gitignore` (`.superpowers/`, `.env*`)
- **Doğrulama:** `npm run format:check` ve `npm run typecheck`.

### 0.3 Supabase altyapısı
- `supabase/config.toml` (CLI varsayılanları), `supabase/migrations/0001_init.sql`
- Şema: profiles, addresses, products, orders, order_items, subscriptions, installations,
  technicians, regions, appointments, appointment_slots, water_hardness, support_tickets,
  b2b_leads, reviews + enum'lar + RLS policy'leri + slot unique index
- `.env.example` (URL, ANON_KEY, SERVICE_ROLE_KEY, PAYMENT_PROVIDER, N8N_WEBHOOK_URL)
- `web/src/lib/supabase/client.ts` — env yoksa `null` döner (demo mod)
- **Doğrulama:** migration dosyası `supabase db lint` olmadan da okunabilir; istemci env'siz derlenir.

### 0.4 CI
- `.github/workflows/ci.yml`: install → format:check → lint → typecheck → test → build
- **Doğrulama:** adımlar lokalde aynı komutlarla yeşil.

### 0.5 Tasarım token'ları
- Tailwind v4 `@theme` (yol haritası §4.1 renkleri), Inter Variable `next/font`, tipografi ölçeği
- **Doğrulama:** token'lar `globals.css` içinde; sayfa Inter ile render edilir.

### 0.6 Atomlar + testler (TDD)
- Button (primary/secondary/ghost, disabled, focus-visible), Input (label + hata + aria-invalid),
  Badge, Spinner, ProgressBar, Select, Tooltip
- **Doğrulama:** her atom için Vitest + Testing Library testi; RED → GREEN.

### 0.7 Layout iskeleti
- Header (sticky, scroll'da blur), Footer, `not-found.tsx`, `error.tsx`
- **Doğrulama:** build + lint; klavye ile menü gezilebilir.

**DoD:** `npm run build`, `npm test`, `npm run lint`, `npm run typecheck` temiz; CI yeşil;
Buton/Input testleri geçiyor; token'lar dokümante.
