import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/shop/product-card";
import { products } from "@/lib/data/products";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ürünler",
  description:
    "Su arıtma cihazları, 6 aylık filtre setleri ve yedek parçalar. Aşama, kapasite ve fiyat karşılaştırması.",
  alternates: { canonical: "/urunler" },
};

const categories = [
  { value: "all", label: "Tümü" },
  { value: "device", label: "Cihazlar" },
  { value: "filter", label: "Filtreler" },
  { value: "part", label: "Yedek parçalar" },
] as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const active = categories.some((category) => category.value === kategori)
    ? (kategori as string)
    : "all";
  const filtered =
    active === "all" ? products : products.filter((product) => product.category === active);

  return (
    <div className="container-page py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-ink-soft">
        <Link href="/" className="hover:text-primary">
          Ana sayfa
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">Ürünler</span>
      </nav>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-h1 font-extrabold">Ürünler</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Cihaz, filtre ve yedek parçalar tek katalogda. Tüm fiyatlar KDV dahil ve TRY.
          </p>
        </div>
        <p className="text-xs text-ink-soft" aria-live="polite">
          {filtered.length} ürün listeleniyor
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Kategori filtresi">
        {categories.map((category) => (
          <Link
            key={category.value}
            href={category.value === "all" ? "/urunler" : `/urunler?kategori=${category.value}`}
            aria-current={active === category.value ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active === category.value
                ? "border-primary bg-primary text-surface"
                : "border-border-soft bg-surface text-ink-soft hover:border-primary hover:text-primary",
            )}
          >
            {category.label}
          </Link>
        ))}
      </div>

      <h2 className="sr-only">Ürün listesi</h2>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}
