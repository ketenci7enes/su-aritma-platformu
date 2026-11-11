import Link from "next/link";
import { AlertTriangle, Droplets } from "lucide-react";
import { computeFilterHealth } from "@/lib/filter-health";
import { formatDateTR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";

const STATUS_LABEL = {
  healthy: "Filtre ömrü iyi durumda",
  soon: "Filtre değişimi yaklaşıyor",
  due: "Filtre ömrü doldu",
} as const;

export function FilterHealthCard({
  installedAt,
  compact = false,
}: {
  installedAt: string;
  compact?: boolean;
}) {
  const health = computeFilterHealth(installedAt);
  const tone = health.status === "due" ? "danger" : health.status === "soon" ? "warning" : "accent";

  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Droplets className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-bold">Filtre sağlığı</h3>
            <p className="text-xs text-ink-soft">{STATUS_LABEL[health.status]}</p>
          </div>
        </div>
        <Badge
          variant={
            health.status === "healthy"
              ? "success"
              : health.status === "soon"
                ? "warning"
                : "danger"
          }
        >
          %{health.percentRemaining}
        </Badge>
      </div>

      <ProgressBar
        value={health.percentRemaining}
        label="Kalan filtre ömrü"
        tone={tone}
        className="mt-4"
      />

      <div className="mt-2 flex justify-between text-xs text-ink-soft">
        <span>{health.daysRemaining} gün kaldı</span>
        <span>Değişim: {formatDateTR(health.dueAt)}</span>
      </div>

      {health.needsReorder ? (
        <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            170. gün uyarısı: filtre değişim zamanı
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Aboneliğiniz aktifse filtre kargoya verilir; değilse yeni set sipariş edin.
          </p>
          {!compact ? (
            <Link href="/panel/filtre" className="mt-2 inline-block">
              <Button size="sm" variant="secondary">
                Randevu ve abonelik
              </Button>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
