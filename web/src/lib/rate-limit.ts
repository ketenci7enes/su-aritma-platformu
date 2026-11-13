/**
 * Süreç-içi sabit pencere hız sınırlayıcı.
 *
 * ÖNEMLİ: Bu yalnızca TEK örnek (process) varsayımıyla doğru çalışır. Çok örnekli
 * (serverless/çok konteynerli) dağıtımda her örnek kendi sayacını tutar; o durumda
 * Upstash/Redis gibi paylaşımlı bir sayaç gerekir.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 5_000;

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Saldırgan her istekte farklı anahtar üretip belleği büyütmesin diye
  // süresi dolmuş kovalar düzenli olarak tahliye edilir.
  if (buckets.size > MAX_KEYS) {
    for (const [existingKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(existingKey);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function __resetRateLimit(): void {
  buckets.clear();
}
