import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, ShieldCheck, Truck } from "lucide-react";
import { AddToCart } from "@/components/shop/add-to-cart";
import { ComparisonTable } from "@/components/shop/comparison-table";
import { ProductVisual } from "@/components/shop/product-visual";
import { SubscriptionUpsell } from "@/components/shop/subscription-upsell";
import { Badge } from "@/components/ui/badge";
import { devices, getProductBySlug, products } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Ürün bulunamadı" };

  return {
    title: product.name,
    description: product.summary,
    alternates: { canonical: `/urunler/${product.slug}` },
    openGraph: { title: product.name, description: product.summary },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const comparisons = devices.filter((device) => device.id !== product.id).slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    brand: { "@type": "Brand", name: "AquaPure" },
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: product.price,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-page py-10 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-ink-soft">
        <Link href="/" className="hover:text-primary">
          Ana sayfa
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href="/urunler" className="hover:text-primary">
          Ürünler
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-[6/5] overflow-hidden rounded-3xl border border-border-soft bg-surface-muted">
            <ProductVisual product={product} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3" aria-label="Ürün galerisi">
            {[0, 1, 2].map((variant) => (
              <div
                key={variant}
                className="aspect-[4/3] overflow-hidden rounded-xl border border-border-soft bg-surface-muted"
              >
                <ProductVisual product={product} variant={variant} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {product.badge ? <Badge variant="primary">{product.badge}</Badge> : null}
            <Badge variant={product.stock > 0 ? "success" : "danger"}>
              {product.stock > 0 ? "Stokta" : "Tükendi"}
            </Badge>
            {product.category === "device" ? <Badge variant="default">Cihaz</Badge> : null}
          </div>

          <h1 className="text-h1 font-extrabold">{product.name}</h1>
          <p className="text-sm leading-relaxed text-ink-soft">{product.summary}</p>
          <p className="text-3xl font-extrabold text-primary-dark">{formatPrice(product.price)}</p>

          <AddToCart product={product} />

          <ul className="grid gap-2 text-xs text-ink-soft sm:grid-cols-2">
            {[
              { icon: Truck, text: "2-4 iş günü ücretsiz kargo" },
              { icon: ShieldCheck, text: "3 yıl garanti" },
              { icon: Package, text: "14 gün içinde iade" },
              { icon: CheckCircle2, text: "Yetkili teknisyen kurulumu" },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-1.5">
                <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                {item.text}
              </li>
            ))}
          </ul>

          {product.category === "device" ? <SubscriptionUpsell /> : null}
        </div>
      </div>

      <section aria-labelledby="specs-title" className="mt-12">
        <h2 id="specs-title" className="text-h2 font-extrabold">
          Teknik özellikler
        </h2>
        <dl className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-border-soft sm:grid-cols-2">
          {Object.entries(product.specs).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 bg-surface p-4 text-sm">
              <dt className="text-ink-soft">{key}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {product.category === "device" && comparisons.length > 0 ? (
        <section aria-labelledby="compare-title" className="mt-12">
          <h2 id="compare-title" className="text-h2 font-extrabold">
            Karşılaştırma
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            {product.name} ile diğer AquaPure modelleri arasındaki farklar.
          </p>
          <div className="mt-4">
            <ComparisonTable current={product} others={comparisons} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
