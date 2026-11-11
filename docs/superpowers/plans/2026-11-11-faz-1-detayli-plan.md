# FAZ 1 — Site + Panel (mock otomasyon): Detaylı Uygulama Planı

> Ana yol haritası: `docs/superpowers/plans/2026-11-11-su-aritma-platformu-yol-haritasi.md`
> Spek: `docs/PRD.md`

**Hedef:** Vitrin (ana sayfa, ürünler, quiz, sepet, mock ödeme) + müşteri paneli
(sipariş, randevu, filtre sağlığı, destek, abonelik, profil) + B2B formu, uçtan uca çalışır.

**Ortam kararı:** Gerçek Supabase/Iyzico/n8n kimlik bilgisi yok. Faz 1, `PAYMENT_PROVIDER=mock`
ve Supabase env yokken **demo mod**'da çalışır: veri `localStorage`'da, otomasyon çağrıları
`console.info`'ya loglanır. Env verilince Supabase istemcisi devreye girer (şema hazır).

## 1A. Ana sayfa
- CSS/SVG su damlası + parçacık animasyonu (JS'siz, `prefers-reduced-motion` destekli)
- Hero: başlık + accent CTA; cihaz görseli CSS 3D (lazy client bileşen, reduced-motion'da statik)
- "Nasıl Çalışır": 4 adım, Framer Motion `useScroll` ile scroll ilerlemesi
- Teknisyen haritası: inline SVG Türkiye silueti + il işaretleri + hover/focus tooltip
- Sosyal kanıt: onaylı yorum kartları
- SEO: metadata, OG, sitemap, robots, JSON-LD (Organization + Product)

## 1B. E-ticaret çekirdeği
- `products` seed: 5 cihaz + filtre setleri + parçalar
- `/urunler`: ProductGrid, kategori filtresi, badge'ler
- `/urunler/[slug]`: galeri (SVG), teknik tablo, karşılaştırma, abonelik upsell, sepete ekle
- Sepet: Zustand + `persist` (localStorage), CartDrawer, adet, toplam
- `/odeme`: adres → mock ödeme → sipariş kaydı → onay; `PaymentProvider` abstraction
- Sipariş sonrası magic link (Supabase varsa gönderir; demo modda ekranda gösterir)

## 1C. Quiz
- `/cihaz-bul`: il/ilçe → 1.5s analiz → kişi sayısı → sonuç
- `water_hardness` seed (81 il + seçili ilçeler); bilinmeyen ilçe → orta sertlik varsayımı
- `lib/quiz/recommend.ts` saf fonksiyon + birim testleri
- Sonuç: gerekçe metni + accent CTA (sepete ekle)

## 1D. Müşteri paneli
- `/panel/giris`: magic link talebi (Supabase) / demo giriş (e-posta)
- Panel guard: oturum yoksa `/panel/giris`'e yönlendir
- Dashboard: sipariş durumu akışı, cihaz kartı, filtre sağlık barı (180 gün, 170. gün uyarısı)
- Randevu: SlotPicker; `held` (10 dk TTL) → `booked`; çakışma engeli
- Destek: acil buton → sorun tipi modalı → ticket + mock n8n log'u
- Abonelik: durum, sonraki fatura, iptal (mock)
- Profil: adres ekle/düzenle/sil

## 1E. Kurumsal
- `/kurumsal`: HORECA anlatımı + yüksek kapasiteli ürünler
- Toplu teklif formu: zod doğrulama → `b2b_leads`

## 1F. Kalite kapısı
- Vitest: öneri motoru, sepet persist, filtre ömrü (UTC/Istanbul sınır günü), slot yarışı,
  webhook idempotency, form doğrulama, atomlar
- Playwright: quiz→sepet→ödeme→onay; giriş→randevu; destek ticket; B2B
- Lighthouse CI workflow + bütçeler; KVKK çerez bandı + `/kvkk` taslağı
- Responsive 360→1920, klavye/odak halkaları

**DoD:** Tüm akışlar mock ödeme ile uçtan uca; testler + build yeşil; reviewer onayı.
