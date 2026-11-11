import { MockPaymentProvider } from "./mock-provider";
import type { PaymentProvider } from "./provider";

let provider: PaymentProvider | null = null;

/**
 * PAYMENT_PROVIDER env'ine göre sağlayıcı seçer.
 * Faz 1: yalnızca mock. Faz 2: "iyzico" dalı eklenecek (IyzicoPaymentProvider).
 */
export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;

  const configured = process.env.PAYMENT_PROVIDER ?? "mock";
  if (configured !== "mock") {
    // Bilinmeyen sağlayıcıda güvenli varsayılan: mock (kart verisi toplanmaz).
    console.warn(`[payments] "${configured}" henüz uygulanmadı; mock sağlayıcı kullanılıyor.`);
  }

  provider = new MockPaymentProvider();
  return provider;
}

export { MockPaymentProvider } from "./mock-provider";
export type { PaymentProvider } from "./provider";
