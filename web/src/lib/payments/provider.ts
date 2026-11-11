import type { Order } from "@/lib/types";

export interface CheckoutSession {
  id: string;
  redirectUrl: string;
  status: "succeeded" | "failed" | "pending";
  orderId?: string;
}

export interface FilterPlan {
  id: string;
  name: string;
  price: number;
}

export interface SubscriptionRef {
  id: string;
  customerRef: string;
  planId: string;
  status: "active" | "cancelled";
}

export interface WebhookEvent {
  id: string;
  type: "payment.succeeded" | "payment.failed" | "subscription.cancelled";
  orderId: string;
  payload: Record<string, unknown>;
}

export interface WebhookResult {
  processed: boolean;
  reason?: string;
}

export type WebhookHeaders = Headers | Record<string, string | undefined>;

/**
 * Ödeme sağlayıcıdan bağımsız arayüz (K2). Kart verisi asla bu katmandan geçmez;
 * sağlayıcı form/redirect akışı kullanılır.
 */
export interface PaymentProvider {
  createCheckoutSession(order: Order): Promise<CheckoutSession>;
  verifyWebhookSignature(rawBody: string, headers: WebhookHeaders): boolean;
  createSubscription(plan: FilterPlan, customerRef: string): Promise<SubscriptionRef>;
  cancelSubscription(ref: SubscriptionRef): Promise<void>;
  handleWebhook(event: WebhookEvent): Promise<WebhookResult>;
}

export function readHeader(headers: WebhookHeaders, name: string): string | undefined {
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name) ?? undefined;
  }
  const record = headers as Record<string, string | undefined>;
  return record[name] ?? record[name.toLowerCase()];
}
