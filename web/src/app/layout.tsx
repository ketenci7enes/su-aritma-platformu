import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/layout/cookie-banner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AquaPure — Premium Su Arıtma Sistemleri",
    template: "%s · AquaPure",
  },
  description:
    "Türkiye'nin dört bir yanında kurulum, filtre takibi ve 6 aylık abonelikle premium su arıtma deneyimi.",
  keywords: ["su arıtma", "su arıtma cihazı", "filtre aboneliği", "ters ozmoz", "AquaPure"],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "AquaPure",
    title: "AquaPure — Premium Su Arıtma Sistemleri",
    description:
      "Bölgenizin su sertliğine göre cihaz seçin; kurulum, filtre takibi ve abonelik tek panelde.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "AquaPure — Premium Su Arıtma Sistemleri",
    description: "Bölgenize uygun cihazı bulun, kurulumu panelden planlayın.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only rounded-b-xl bg-primary px-4 py-2 text-surface focus:not-sr-only focus:absolute focus:top-0 focus:left-4 focus:z-50"
        >
          İçeriğe geç
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
