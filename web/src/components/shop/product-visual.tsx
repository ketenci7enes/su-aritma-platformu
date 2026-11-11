import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const toneMap: Record<Product["tone"], { from: string; to: string; body: string; accent: string }> =
  {
    sky: { from: "#E0F2FE", to: "#BAE6FD", body: "#0284C7", accent: "#7DD3FC" },
    deep: { from: "#DBEAFE", to: "#BFDBFE", body: "#075985", accent: "#38BDF8" },
    mint: { from: "#EAF9E0", to: "#D7F3C4", body: "#3F7F17", accent: "#60C21F" },
    slate: { from: "#F1F5F9", to: "#E2E8F0", body: "#334155", accent: "#94A3B8" },
    ink: { from: "#E2E8F0", to: "#CBD5E1", body: "#0F172A", accent: "#5B7891" },
  };

/**
 * Ürün görseli: statik fotoğraf yerine CSS/SVG (PRD §5 performans kuralı).
 * `variant` galeri için farklı açı/ton üretir.
 */
export function ProductVisual({
  product,
  variant = 0,
  className,
}: {
  product: Pick<Product, "tone" | "category" | "slug">;
  variant?: number;
  className?: string;
}) {
  const tone = toneMap[product.tone];
  const gradientId = `pv-${product.slug}-${variant}`.replace(/[^a-zA-Z0-9-]/g, "");
  const rotate = variant === 1 ? -6 : variant === 2 ? 5 : 0;

  return (
    <svg
      viewBox="0 0 240 200"
      role="img"
      aria-label="Ürün görseli"
      className={cn("h-full w-full", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tone.from} />
          <stop offset="100%" stopColor={tone.to} />
        </linearGradient>
        <linearGradient id={`${gradientId}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone.accent} />
          <stop offset="100%" stopColor={tone.body} />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="240" height="200" rx="24" fill={`url(#${gradientId})`} />
      <circle cx="196" cy="36" r="34" fill="#FFFFFF" opacity="0.35" />
      <circle cx="40" cy="170" r="46" fill="#FFFFFF" opacity="0.25" />

      <g transform={`translate(58 34) rotate(${rotate} 62 70)`}>
        {product.category === "device" ? (
          <>
            <rect x="18" y="10" width="88" height="128" rx="16" fill="#FFFFFF" opacity="0.92" />
            <rect x="26" y="20" width="72" height="108" rx="12" fill={`url(#${gradientId}-body)`} />
            <rect x="36" y="32" width="12" height="76" rx="6" fill="#FFFFFF" opacity="0.85" />
            <rect x="56" y="32" width="12" height="76" rx="6" fill="#FFFFFF" opacity="0.65" />
            <rect x="76" y="32" width="12" height="76" rx="6" fill="#FFFFFF" opacity="0.45" />
            <circle cx="62" cy="118" r="9" fill="#FFFFFF" opacity="0.9" />
            <path
              d="M62 112c3 3.4 4.6 5.6 4.6 7.6a4.6 4.6 0 1 1-9.2 0c0-2 1.6-4.2 4.6-7.6Z"
              fill={tone.body}
            />
            <rect x="54" y="138" width="16" height="26" rx="4" fill="#FFFFFF" opacity="0.9" />
          </>
        ) : product.category === "filter" ? (
          <>
            {[0, 1, 2].map((index) => (
              <g key={index} transform={`translate(${18 + index * 24} 18)`}>
                <rect width="18" height="112" rx="9" fill="#FFFFFF" opacity="0.92" />
                <rect x="3" y="10" width="12" height="92" rx="6" fill={tone.body} opacity="0.85" />
                <rect x="3" y="20" width="12" height="10" fill={tone.accent} opacity="0.9" />
              </g>
            ))}
          </>
        ) : (
          <>
            <ellipse cx="62" cy="86" rx="38" ry="46" fill="#FFFFFF" opacity="0.9" />
            <ellipse cx="62" cy="86" rx="28" ry="34" fill={`url(#${gradientId}-body)`} />
            <rect x="56" y="30" width="12" height="18" rx="4" fill="#FFFFFF" />
            <path d="M48 26h28" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
          </>
        )}
      </g>

      {product.category === "device" ? (
        <path
          d="M172 150c0-8 6-14 14-14s14 6 14 14-6 16-14 22c-8-6-14-14-14-22Z"
          fill="#FFFFFF"
          opacity="0.5"
        />
      ) : null}
    </svg>
  );
}
