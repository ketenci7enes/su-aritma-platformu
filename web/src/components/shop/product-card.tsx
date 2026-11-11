"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductVisual } from "./product-visual";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border-soft bg-surface shadow-sm transition-shadow hover:shadow-lg">
      <Link
        href={`/urunler/${product.slug}`}
        className="relative block aspect-[5/4] overflow-hidden bg-surface-muted"
        aria-label={`${product.name}${product.badge ? ` ${product.badge}` : ""} detayı`}
      >
        <ProductVisual
          product={product}
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {product.badge ? (
          <span className="absolute top-3 left-3">
            <Badge variant={product.category === "device" ? "primary" : "success"}>
              {product.badge}
            </Badge>
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold">
          <Link href={`/urunler/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-soft">
          {product.summary}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.stages ? <Badge variant="default">{product.stages} aşama</Badge> : null}
          {product.capacityLpd ? (
            <Badge variant="default">{product.capacityLpd} L/gün</Badge>
          ) : null}
          {product.category === "filter" ? <Badge variant="default">Filtre</Badge> : null}
          {product.category === "part" ? <Badge variant="default">Yedek parça</Badge> : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-lg font-extrabold">{formatPrice(product.price)}</p>
          <Button
            size="sm"
            onClick={() => {
              addItem(product);
              openCart();
            }}
            aria-label={`${product.name} sepete ekle`}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Ekle
          </Button>
        </div>
      </div>
    </article>
  );
}
