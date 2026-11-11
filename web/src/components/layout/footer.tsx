import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const columns = [
  {
    title: "Alışveriş",
    links: [
      { href: "/urunler", label: "Tüm ürünler" },
      { href: "/urunler?kategori=device", label: "Cihazlar" },
      { href: "/urunler?kategori=filter", label: "Filtreler" },
      { href: "/cihaz-bul", label: "Cihaz seçici" },
    ],
  },
  {
    title: "Hizmet",
    links: [
      { href: "/panel", label: "Müşteri paneli" },
      { href: "/panel/randevu", label: "Randevu" },
      { href: "/panel/destek", label: "Tek tıkla destek" },
      { href: "/kurumsal", label: "Kurumsal teklif" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { href: "/kvkk", label: "KVKK aydınlatma" },
      { href: "/kvkk#cerez", label: "Çerez politikası" },
      { href: "/kvkk#mesafeli", label: "Mesafeli satış" },
      { href: "/kvkk#iade", label: "İade koşulları" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border-soft bg-surface-muted">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-ink-soft">
            Premium su arıtma sistemleri, otomatik kurulum randevusu ve 6 aylık filtre aboneliği.
            Türkiye genelinde yetkili teknisyen ağı.
          </p>
          <p className="text-xs text-ink-soft">
            0850 000 00 00 · destek@aquapure.example
            <br />
            Hafta içi 09:00–18:00 (İstanbul)
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title} className="space-y-3">
            <h2 className="text-sm font-bold">{column.title}</h2>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-soft transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border-soft">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AquaPure. Tüm hakları saklıdır.</p>
          <p>Fiyatlar TRY ve KDV dahildir. Demo ortamı — ödeme alınmaz.</p>
        </div>
      </div>
    </footer>
  );
}
