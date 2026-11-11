import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/** X vs Y karşılaştırma tablosu — modüler, ürün detayından beslenir. */
export function ComparisonTable({ current, others }: { current: Product; others: Product[] }) {
  const columns = [current, ...others];

  const specKeys = Array.from(new Set(columns.flatMap((product) => Object.keys(product.specs))));

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-soft">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">Cihaz karşılaştırma tablosu</caption>
        <thead>
          <tr className="bg-surface-muted">
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-ink-soft">
              Özellik
            </th>
            {columns.map((product, index) => (
              <th key={product.id} scope="col" className="px-4 py-3 text-left">
                <span className="flex flex-col gap-1">
                  <span className="font-bold">{product.name}</span>
                  {index === 0 ? <Badge variant="primary">Bu ürün</Badge> : null}
                  <span className="text-sm font-extrabold text-primary-dark">
                    {formatPrice(product.price)}
                  </span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border-soft">
            <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink-soft">
              Aşama
            </th>
            {columns.map((product) => (
              <td
                key={product.id}
                className={cn(
                  "px-4 py-2.5",
                  product.id === current.id && "bg-primary-soft/30 font-semibold",
                )}
              >
                {product.stages ?? "—"}
              </td>
            ))}
          </tr>
          <tr className="border-t border-border-soft">
            <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink-soft">
              Kapasite
            </th>
            {columns.map((product) => (
              <td
                key={product.id}
                className={cn(
                  "px-4 py-2.5",
                  product.id === current.id && "bg-primary-soft/30 font-semibold",
                )}
              >
                {product.capacityLpd ? `${product.capacityLpd} L/gün` : "—"}
              </td>
            ))}
          </tr>
          {specKeys.map((key) => (
            <tr key={key} className="border-t border-border-soft">
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink-soft">
                {key}
              </th>
              {columns.map((product) => (
                <td
                  key={product.id}
                  className={cn(
                    "px-4 py-2.5",
                    product.id === current.id && "bg-primary-soft/30 font-semibold",
                  )}
                >
                  {product.specs[key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
