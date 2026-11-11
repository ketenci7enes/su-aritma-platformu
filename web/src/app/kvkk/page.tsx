import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "KVKK ve Yasal Metinler",
  description: "KVKK aydınlatma metni, çerez politikası, mesafeli satış ve iade koşulları taslağı.",
};

const sections = [
  {
    id: "aydinlatma",
    title: "KVKK Aydınlatma Metni",
    body: [
      "Veri sorumlusu AquaPure'dur. Sipariş, teslimat, kurulum ve destek süreçlerini yürütmek amacıyla ad-soyad, iletişim bilgileri, adres ve sipariş geçmişiniz işlenir.",
      "Verileriniz; sözleşmenin ifası, yasal yükümlülükler ve açık rızanız hukuki sebeplerine dayanılarak, yalnızca hizmet sağlayıcılarımızla (kargo, ödeme, servis) paylaşılır.",
      "6698 sayılı KVKK kapsamında verilerinize erişme, düzeltme, silinmesini talep etme ve işlemeye itiraz etme haklarınız bulunur. Başvuru: kvkk@aquapure.example",
    ],
  },
  {
    id: "cerez",
    title: "Çerez Politikası",
    body: [
      "Zorunlu çerezler oturum ve sepet işlevleri için kullanılır; izniniz olmadan reklam/ölçüm çerezi çalıştırılmaz.",
      "Sepet verisi tarayıcınızın localStorage alanında tutulur. Tarayıcı verilerinizi temizlediğinizde demo sipariş geçmişi de silinir.",
      "Çerez tercihlerinizi sağ alttaki banttan değiştirebilirsiniz.",
    ],
  },
  {
    id: "mesafeli",
    title: "Mesafeli Satış Sözleşmesi (Taslak)",
    body: [
      "Satıcı: AquaPure. Alıcı: sipariş formunda bilgilerini beyan eden tüketici. Konu: sipariş edilen cihaz/filtre/parçanın satışı ve kurulumu.",
      "Ödeme, sipariş onayıyla birlikte tahsil edilir. Teslimat, stok durumuna göre 2-4 iş günü içinde yapılır. Kurulum randevusu müşteri panelinden planlanır.",
      "Tüketici, cayma hakkını teslimattan itibaren 14 gün içinde kullanabilir; kurulumu yapılmış cihazlarda hijyen gerekçesiyle istisnalar uygulanabilir.",
    ],
  },
  {
    id: "iade",
    title: "İade Koşulları (Taslak)",
    body: [
      "Kullanılmamış ve ambalajı bozulmamış ürünler 14 gün içinde iade edilebilir. İade kargo ücreti AquaPure'a aittir.",
      "Arızalı ürünlerde garanti süresi 3 yıldır; arıza bildirimi panelden 'Tek Tıkla Destek' ile yapılır.",
      "Abonelik iptali panelden tek tıkla yapılabilir; dönem sonuna kadar haklar korunur.",
    ],
  },
];

export default function LegalPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="text-h1 font-extrabold">Yasal metinler</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Bu sayfa Faz 1 taslağıdır; canlıya almadan önce hukuk kontrolünden geçirilmelidir (yol
        haritası görev 2.7).
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Yasal metinler" className="h-fit lg:sticky lg:top-24">
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <Link
                  href={`#${section.id}`}
                  className="block rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-surface-muted hover:text-ink"
                >
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-8">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="card-soft scroll-mt-24 p-5"
            >
              <h2 id={`${section.id}-title`} className="text-h3 font-bold">
                {section.title}
              </h2>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
