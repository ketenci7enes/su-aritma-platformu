import { Star } from "lucide-react";
import { reviews } from "@/lib/data/reviews";
import { Badge } from "@/components/ui/badge";

export function Reviews() {
  return (
    <section aria-labelledby="reviews-title" className="bg-surface-muted py-16 md:py-24">
      <div className="container-page">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-primary uppercase">Sosyal kanıt</p>
            <h2 id="reviews-title" className="mt-2 text-h2 font-extrabold">
              Müşterilerimiz ne diyor?
            </h2>
          </div>
          <p className="max-w-sm text-sm text-ink-soft">
            Yalnızca onaylı yorumlar gösterilir. Ortalama puan:{" "}
            <strong className="text-ink">4,8 / 5</strong>
          </p>
        </div>

        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-0.5"
                  aria-label={`${review.rating} yıldız`}
                  role="img"
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={
                        index < review.rating
                          ? "h-4 w-4 fill-current text-warning"
                          : "h-4 w-4 fill-current text-border-soft"
                      }
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <Badge variant="primary">{review.city}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">“{review.text}”</p>
              <p className="mt-4 text-sm font-semibold">{review.authorName}</p>
              <p className="text-xs text-ink-soft">{review.productName}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
