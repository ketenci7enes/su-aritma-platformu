import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Slot } from "@/lib/types";
import { mockPaymentProvider } from "@/lib/payments/mock-provider";
import { useDemoStore } from "./demo";

function makeSlot(overrides: Partial<Slot> = {}): Slot {
  return {
    id: "slot-1",
    technicianId: "tech-1",
    technicianName: "Ahmet Yılmaz",
    start: "2026-06-01T09:00:00.000Z",
    end: "2026-06-01T10:00:00.000Z",
    status: "free",
    ...overrides,
  };
}

function resetStore() {
  useDemoStore.setState({
    user: null,
    orders: [],
    tickets: [],
    appointments: [],
    addresses: [],
    subscription: null,
    slots: [],
    b2bLeads: [],
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  resetStore();
});

describe("bookAppointment", () => {
  it("boş slotu rezerve eder ve slotu 'booked' yapar", () => {
    const slot = makeSlot();
    useDemoStore.setState({
      user: { id: "demo-user", email: "demo@example.com" },
      slots: [slot],
    });

    const appointment = useDemoStore.getState().bookAppointment(slot, "install");

    expect(appointment.status).toBe("booked");
    expect(useDemoStore.getState().appointments).toHaveLength(1);
    expect(useDemoStore.getState().slots[0]?.status).toBe("booked");
  });

  it("aynı slotu ikinci kez rezerve etmez", () => {
    const slot = makeSlot();
    useDemoStore.setState({
      user: { id: "demo-user", email: "demo@example.com" },
      slots: [slot],
    });

    useDemoStore.getState().bookAppointment(slot, "install");

    expect(() => useDemoStore.getState().bookAppointment(slot, "install")).toThrow(/müsait değil/);
    expect(useDemoStore.getState().appointments).toHaveLength(1);
  });

  it("başka kullanıcının aktif hold'u varken rezervasyonu reddeder", () => {
    const slot = makeSlot({
      status: "held",
      heldBy: "other-user",
      heldUntil: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    useDemoStore.setState({
      user: { id: "demo-user", email: "demo@example.com" },
      slots: [slot],
    });

    expect(() => useDemoStore.getState().bookAppointment(slot, "install")).toThrow(/müsait değil/);
    expect(useDemoStore.getState().appointments).toHaveLength(0);
  });

  it("süresi dolmuş hold'u rezerve edebilir", () => {
    const slot = makeSlot({
      status: "held",
      heldBy: "other-user",
      heldUntil: new Date(Date.now() - 60_000).toISOString(),
    });
    useDemoStore.setState({
      user: { id: "demo-user", email: "demo@example.com" },
      slots: [slot],
    });

    const appointment = useDemoStore.getState().bookAppointment(slot, "install");
    expect(appointment.status).toBe("booked");
    expect(useDemoStore.getState().slots[0]?.status).toBe("booked");
  });

  it("store'da olmayan slot için hata fırlatır", () => {
    useDemoStore.setState({
      user: { id: "demo-user", email: "demo@example.com" },
      slots: [],
    });

    expect(() => useDemoStore.getState().bookAppointment(makeSlot(), "install")).toThrow(
      /bulunamadı/,
    );
  });
});

describe("cancelSubscription", () => {
  const subscription = {
    id: "SUB-TEST",
    status: "active" as const,
    nextBillingAt: "2026-12-01T00:00:00.000Z",
    planName: "6 Aylık Filtre Aboneliği",
  };

  it("sağlayıcı onaylarsa aboneliği iptal eder", async () => {
    useDemoStore.setState({
      user: { id: "demo-user", email: "demo@example.com" },
      subscription,
    });

    const result = await useDemoStore.getState().cancelSubscription();

    expect(result).toEqual({ ok: true });
    expect(useDemoStore.getState().subscription?.status).toBe("cancelled");
  });

  it("sağlayıcı hata verirse aboneliği 'active' durumuna geri alır", async () => {
    const cancelSpy = vi
      .spyOn(mockPaymentProvider, "cancelSubscription")
      .mockRejectedValueOnce(new Error("sağlayıcı hatası"));
    useDemoStore.setState({
      user: { id: "demo-user", email: "demo@example.com" },
      subscription,
    });

    const result = await useDemoStore.getState().cancelSubscription();

    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(useDemoStore.getState().subscription?.status).toBe("active");
  });

  it("aktif abonelik yoksa sağlayıcıyı çağırmaz", async () => {
    const cancelSpy = vi.spyOn(mockPaymentProvider, "cancelSubscription");
    useDemoStore.setState({ subscription: null });

    const result = await useDemoStore.getState().cancelSubscription();

    expect(result.ok).toBe(false);
    expect(cancelSpy).not.toHaveBeenCalled();
  });
});
