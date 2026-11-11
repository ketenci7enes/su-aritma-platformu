import type { Order } from "@/lib/types";
import {
  readHeader,
  type CheckoutSession,
  type FilterPlan,
  type PaymentProvider,
  type SubscriptionRef,
  type WebhookEvent,
  type WebhookHeaders,
  type WebhookResult,
} from "./provider";

const MOCK_SIGNATURE = "mock-signature";

function randomId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}_${uuid.replace(/-/g, "").slice(0, 16)}`;
}

export interface MockPaymentOptions {
  /** Bir sonraki checkout'u başarısız simüle et (test/hata ekranı için). */
  failNextPayment?: boolean;
}

/**
 * Faz 1 ödeme sağlayıcısı: anında başarılı/başarısız sonuç üretir.
 * Webhook işleme idempotenttir: aynı olay kimliği iki kez işlenmez.
 */
export class MockPaymentProvider implements PaymentProvider {
  private readonly processedEvents = new Set<string>();
  private failNextPayment: boolean;

  constructor(options: MockPaymentOptions = {}) {
    this.failNextPayment = options.failNextPayment ?? false;
  }

  async createCheckoutSession(order: Order): Promise<CheckoutSession> {
    const id = randomId("mock");
    const shouldFail = this.failNextPayment;
    this.failNextPayment = false;

    return {
      id,
      redirectUrl: `/odeme/sonuc?ref=${id}&durum=${shouldFail ? "basarisiz" : "basarili"}`,
      status: shouldFail ? "failed" : "succeeded",
      orderId: order.id,
    };
  }

  verifyWebhookSignature(_rawBody: string, headers: WebhookHeaders): boolean {
    return readHeader(headers, "x-mock-signature") === MOCK_SIGNATURE;
  }

  async createSubscription(plan: FilterPlan, customerRef: string): Promise<SubscriptionRef> {
    return {
      id: randomId("sub"),
      customerRef,
      planId: plan.id,
      status: "active",
    };
  }

  async cancelSubscription(ref: SubscriptionRef): Promise<void> {
    ref.status = "cancelled";
  }

  async handleWebhook(event: WebhookEvent): Promise<WebhookResult> {
    if (this.processedEvents.has(event.id)) {
      return { processed: false, reason: "duplicate_event" };
    }
    this.processedEvents.add(event.id);
    return { processed: true };
  }

  processedEventCount(): number {
    return this.processedEvents.size;
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
