import { describe, expect, it } from "vitest";
import { MockPaymentProvider } from "./mock-provider";
import type { Order } from "@/lib/types";

const order: Order = {
  id: "o-1",
  createdAt: "2026-06-01T10:00:00.000Z",
  status: "pending",
  total: 16900,
  lines: [],
  address: { title: "Ev", il: "İstanbul", ilce: "Kadıköy", line: "Moda Cad. 12", phone: "0532" },
  paymentRef: "",
  email: "test@example.com",
  subscription: false,
};

describe("MockPaymentProvider", () => {
  it("checkout oturumu ve yönlendirme adresi döner", async () => {
    const provider = new MockPaymentProvider();
    const session = await provider.createCheckoutSession(order);
    expect(session.id).toMatch(/^mock_/);
    expect(session.redirectUrl).toContain("/odeme/sonuc");
    expect(session.status).toBe("succeeded");
  });

  it("imzayı doğrular", () => {
    const provider = new MockPaymentProvider();
    expect(provider.verifyWebhookSignature("{}", { "x-mock-signature": "mock-signature" })).toBe(
      true,
    );
    expect(provider.verifyWebhookSignature("{}", { "x-mock-signature": "wrong" })).toBe(false);
  });

  it("aynı webhook olayını iki kez işlemez (idempotency)", async () => {
    const provider = new MockPaymentProvider();
    const event = {
      id: "evt_1",
      type: "payment.succeeded" as const,
      orderId: "o-1",
      payload: {},
    };

    const first = await provider.handleWebhook(event);
    const second = await provider.handleWebhook(event);

    expect(first.processed).toBe(true);
    expect(second.processed).toBe(false);
    expect(provider.processedEventCount()).toBe(1);
  });

  it("başarısız ödeme simülasyonu destekler", async () => {
    const provider = new MockPaymentProvider({ failNextPayment: true });
    const session = await provider.createCheckoutSession(order);
    expect(session.status).toBe("failed");
  });

  it("abonelik oluşturur ve iptal eder", async () => {
    const provider = new MockPaymentProvider();
    const ref = await provider.createSubscription(
      { id: "plan-6", name: "6 Aylık", price: 1190 },
      "user-1",
    );
    expect(ref.id).toMatch(/^sub_/);
    await expect(provider.cancelSubscription(ref)).resolves.toBeUndefined();
  });
});
