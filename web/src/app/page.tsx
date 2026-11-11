import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { TechnicianMap } from "@/components/home/technician-map";
import { Reviews } from "@/components/home/reviews";
import { CtaBand } from "@/components/home/cta-band";
import { devices } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Premium Su Arıtma Sistemleri",
  description:
    "Bölgenizin su sertliğine göre cihaz seçin; ücretsiz kurulum, filtre takibi ve 6 aylık abonelik tek panelde.",
  alternates: { canonical: "/" },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AquaPure",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  logo: "/icon.svg",
  areaServed: "TR",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+90-850-000-00-00",
    contactType: "customer service",
    availableLanguage: ["Turkish"],
  },
};

const flagship = devices.find((device) => device.slug === "aquapure-home-5") ?? devices[0];

const productJsonLd = flagship
  ? {
      "@context": "https://schema.org",
      "@type": "Product",
      name: flagship.name,
      description: flagship.summary,
      brand: { "@type": "Brand", name: "AquaPure" },
      offers: {
        "@type": "Offer",
        priceCurrency: "TRY",
        price: flagship.price,
        availability: "https://schema.org/InStock",
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/urunler/${flagship.slug}`,
      },
    }
  : null;

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {productJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      ) : null}
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <TechnicianMap />
      <Reviews />
      <CtaBand />
    </>
  );
}

const stats = [
  { value: "81", label: "ilde hizmet" },
  { value: "30 dk", label: "içinde yanıt" },
  { value: "180 gün", label: "filtre ömrü takibi" },
  { value: "%98", label: "müşteri memnuniyeti" },
];

function TrustStrip() {
  return (
    <section aria-label="Hizmet göstergeleri" className="border-y border-border-soft">
      <div className="container-page grid grid-cols-2 gap-4 py-6 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-2xl font-extrabold text-primary-dark">{stat.value}</p>
            <p className="mt-0.5 text-xs text-ink-soft">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
