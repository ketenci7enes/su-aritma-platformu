import type { MetadataRoute } from "next";
import { products } from "@/lib/data/products";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/urunler", priority: 0.9 },
    { path: "/cihaz-bul", priority: 0.8 },
    { path: "/kurumsal", priority: 0.7 },
    { path: "/kvkk", priority: 0.3 },
    { path: "/panel/giris", priority: 0.2 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route.priority,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/urunler/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
