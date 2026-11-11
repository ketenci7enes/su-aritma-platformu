# Proje Gereksinim Belgesi (PRD): Yeni Nesil Su Arıtma Sistemleri

## 1. Proje Özeti ve Vizyon
Bu proje, geleneksel su arıtma cihazı satışını modern, teknolojik ve tam otomatik bir e-ticaret/hizmet platformuna dönüştürmeyi amaçlamaktadır. 
**Ana Hedefler:**
* Kullanıcıya premium, yenilikçi ve güvenilir bir UI/UX sunmak (3D modellemeler, akıcı animasyonlar).
* Satış sonrası kurulum ve servis süreçlerini (Müşteri Web Paneli <-> n8n <-> Telegram Bot) tam otomatik hale getirmek.
* Tekrarlayan gelir modeli (6 aylık filtre aboneliği) kurmak.

## 2. Teknoloji Yığını (Önerilen)
* **Frontend:** Next.js (React), Tailwind CSS
* **Animasyon/UI:** GSAP, Framer Motion, Spline (3D elementler için)
* **Backend & Veritabanı:** Supabase veya Node.js / PostgreSQL
* **Otomasyon & Orkestrasyon:** n8n, Telegram API (Teknisyenler için)
* **Ödeme Altyapısı:** Iyzico / Stripe

---

## 3. Temel Web Sitesi Mimarisi (Site Haritası)

### 3.1. Ana Sayfa (Home)
* **Hero Section:** Fare hareketlerine duyarlı, su damlası veya cihazın parçalanmış (exploded view) 3D animasyonu. Karanlık/Aydınlık tema ile teknolojik hissiyat.
* **Nasıl Çalışır? (Süreç Akışı):** Sipariş -> Otomatik Randevu -> Kurulum -> 6 Aylık Abonelik adımlarını anlatan akıcı, scroll-tetiklemeli grafikler.
* **Teknisyen Ağı Haritası (Özel Modül - Detaylar aşağıda)**
* **Sosyal Kanıt & Yorumlar:** Modern kart tasarımlarıyla müşteri geri dönüşleri.

### 3.2. Ürünler ve Satış (E-Ticaret)
* Cihazların ve yedek parçaların listelendiği, Apple Store sadeliğinde ürün kartları.
* Ürün detay sayfasında teknik özelliklerin görselleştirilmesi (X vs Y karşılaştırma tabloları).

### 3.3. Kurumsal Çözümler (B2B)
* HORECA (Otel, Restoran, Kafe) sektörü için yüksek kapasiteli cihaz tanıtımları ve toplu teklif alma formu.

---

## 4. Özel Modül Detayları (Agent'lar İçin Kritik Geliştirme Talimatları)

### Modül 1: İnteraktif Cihaz Seçici (Quiz / Yönlendirme Aracı)
**Amacı:** Kullanıcının ihtiyacına ve bölgesel su kalitesine en uygun cihazı otomatik önermek.
* **UI Beklentisi:** Tam ekran veya modal içinde açılan, adım adım ilerleyen estetik bir anket arayüzü.
* **Akış:**
  1. Kullanıcıdan konum bilgisi istenir (İl/İlçe seçimi veya tarayıcı izni).
  2. "Şebeke suyunuzun sertlik derecesi analiz ediliyor..." şeklinde kısa bir bekleme animasyonu (Arka planda o ile ait statik kireç/sertlik verisi çekilir).
  3. Evdeki kişi sayısı sorulur (Kapasite belirlemek için).
  4. **Sonuç Ekranı:** "Sizin bölgenizdeki yüksek kireçli su için en uygunu: Model X" şeklinde doğrudan sepete ekleme butonuyla sunum.

### Modül 2: Müşteri Paneli ve Tek Tıkla Destek (Sipariş Sonrası)
**Amacı:** Müşteriyi 3. parti uygulamalara göndermeden tüm satış sonrası süreci web sitesinde tutmak.
* **Erişim:** Sipariş sonrası SMS/Mail ile iletilen "Magic Link" (şifresiz giriş) ile.
* **Özellikler:**
  * **Sipariş Takibi & Randevu:** Kargo "Teslim Edildi" statüsüne geçtiğinde takvim modülü açılır. Kullanıcı bölge teknisyeninin boş saatlerinden birini seçer.
  * **Filtre Sağlık Barı:** Cihazın kurulum tarihinden itibaren azalan bir "progress bar" (Örn: %60 Filtre Ömrü).
  * **Tek Tıkla Destek (Arıza Bildirimi):**
    * Panelde yer alan acil durum butonudur.
    * Tıklandığında küçük bir modal açılır (Sorun tipi seçilir: Basınç düşük, Su sızdırıyor, Tat bozuk).
    * Gönderildiğinde **n8n tetiklenir** ve o bölgedeki atanmış teknisyenin **Telegram Botuna** anında mesaj gider: `"ACİL SERVİS: [Müşteri Adı] - [Adres] - [Sorun Tipi] - [Telefon]"`.

### Modül 3: Teknisyen Ağı Haritası
**Amacı:** Markanın ulusal çapta, profesyonel bir ağa sahip olduğunu görsel olarak kanıtlamak.
* **UI Beklentisi:** Ana sayfada yer alan interaktif bir Türkiye (veya hizmet verilen bölge) haritası. SVG tabanlı olması tercih edilmelidir.
* **Etkileşim (Hover State):** Kullanıcı haritada bir ilin veya bölgenin üzerine fare ile geldiğinde bir Tooltip açılır.
* **İçerik:** Tooltip içinde dinamik veya statik veriler yer alır:
  * *"Antalya: 12 Aktif Teknisyen"*
  * *"Ortalama Kurulum Süresi: 24 Saat"*
  * *"Aktif Hizmet Veren Müşteri: 1.450+"*

### Modül 4: 6 Aylık İndirimli Filtre Aboneliği (Tekrarlayan Gelir)
**Amacı:** Sürekli filtre değişimini otomatize etmek.
* **Satın Alma:** Cihaz satın alınırken "Sepette Abonelik Başlat" seçeneği (İlk yıl indirimli vs.).
* **Zamanlayıcı:** Kurulum randevusu tamamlandığı gün arka planda (Cron Job / n8n) 170 günlük bir sayaç başlar.
* **Tetiklenme:** 170. gün müşteriye otomatik SMS/Mail gider: *"Filtre değişim vaktiniz yaklaştı. İndirimli filtreniz kargoya verilmek üzere, lütfen değişim randevunuzu oluşturun: [Link]"*
* **Değişim Opsiyonları:**
  1. *Teknisyen Gelsin:* Normal randevu akışı.
  2. *Kendim Değiştireceğim:* Sistem müşteriye kargo takip kodu ve AR/3D destekli "Nasıl Değiştirilir?" video kılavuzunun linkini açar.

## 5. Agent'lar İçin Genel Geliştirme Kuralları
* Component tabanlı (atomic design) bir yapı kurgulayın.
* Veritabanı tasarımında "Müşteriler", "Cihazlar", "Teknisyenler", "Bölgeler" ve "Randevular" tabloları birbiriyle ilişkili (Relational) olmalıdır.
* UI bileşenlerinde statik görsel yerine, CSS animasyonları ve SVG'ler kullanarak sayfa hızını (Performance/Lighthouse skorlarını) yüksek tutun.