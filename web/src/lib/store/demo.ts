"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Address,
  Appointment,
  CartLine,
  Order,
  SessionUser,
  Slot,
  SupportTicket,
} from "@/lib/types";
import { mockPaymentProvider } from "@/lib/payments/mock-provider";
import { isSlotAvailable } from "@/lib/appointments/slots";

export interface DemoSubscription {
  id: string;
  status: "active" | "cancelled";
  nextBillingAt: string;
  planName: string;
}

export interface B2BLead {
  id: string;
  company: string;
  contactName: string;
  phone: string;
  city: string;
  sector: string;
  message?: string;
  createdAt: string;
}

export interface PlaceOrderInput {
  email: string;
  lines: CartLine[];
  total: number;
  address: Omit<Address, "id" | "isDefault">;
  subscription: boolean;
  paymentRef: string;
}

export interface DemoState {
  user: SessionUser | null;
  orders: Order[];
  tickets: SupportTicket[];
  appointments: Appointment[];
  addresses: Address[];
  subscription: DemoSubscription | null;
  slots: Slot[];
  b2bLeads: B2BLead[];
  login: (email: string, fullName?: string) => SessionUser;
  logout: () => void;
  updateUser: (patch: Partial<Pick<SessionUser, "fullName">>) => void;
  placeOrder: (input: PlaceOrderInput) => Order;
  addTicket: (issueType: SupportTicket["issueType"], note: string) => SupportTicket;
  bookAppointment: (slot: Slot, type: Appointment["type"]) => Appointment;
  addAddress: (address: Omit<Address, "id">) => Address;
  updateAddress: (id: string, address: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  setSlots: (slots: Slot[]) => void;
  /** Sağlayıcı çağrısı başarısız olursa aboneliği eski hâline döndürür. */
  cancelSubscription: () => Promise<CancelSubscriptionResult>;
  addB2BLead: (lead: Omit<B2BLead, "id" | "createdAt">) => B2BLead;
}

export interface CancelSubscriptionResult {
  ok: boolean;
  error?: string;
}

const ORDER_PREFIX = "SP";

function makeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

function logAutomation(event: string, payload: Record<string, unknown>) {
  // Faz 1: n8n yerine konsol. Faz 2'de N8N_WEBHOOK_URL'e POST edilir.
  if (typeof console !== "undefined") {
    console.info(`[automation:mock] ${event}`, payload);
  }
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      user: null,
      orders: [],
      tickets: [],
      appointments: [],
      addresses: [],
      subscription: null,
      slots: [],
      b2bLeads: [],

      login: (email, fullName) => {
        const user: SessionUser = {
          id: `demo-${email
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 12)}`,
          email,
          fullName: fullName || email.split("@")[0],
        };
        set({ user });
        return user;
      },

      logout: () => set({ user: null }),

      updateUser: (patch) =>
        set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),

      placeOrder: (input) => {
        const now = new Date();
        const order: Order = {
          id: `${ORDER_PREFIX}-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: now.toISOString(),
          status: "paid",
          total: input.total,
          lines: input.lines,
          address: input.address,
          paymentRef: input.paymentRef,
          email: input.email,
          subscription: input.subscription,
        };

        const user = get().user ?? get().login(input.email);

        set((state) => ({
          user,
          orders: [order, ...state.orders],
          subscription: input.subscription
            ? {
                id: makeId("SUB"),
                status: "active",
                nextBillingAt: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
                planName: "6 Aylık Filtre Aboneliği",
              }
            : state.subscription,
        }));

        logAutomation("order.paid", {
          orderId: order.id,
          total: order.total,
          email: order.email,
        });

        return order;
      },

      addTicket: (issueType, note) => {
        const ticket: SupportTicket = {
          id: makeId("TKT"),
          createdAt: new Date().toISOString(),
          issueType,
          note,
          status: "open",
        };
        set((state) => ({ tickets: [ticket, ...state.tickets] }));
        logAutomation("support.ticket.created", {
          ticketId: ticket.id,
          issueType,
          note,
          telegram: "ACİL SERVİS: müşteri - adres - " + issueType,
        });
        return ticket;
      },

      bookAppointment: (slot, type) => {
        const state = get();
        const now = new Date();
        const current = state.slots.find((item) => item.id === slot.id);

        if (current) {
          if (!isSlotAvailable(current, state.user?.id ?? "", now)) {
            throw new Error("Bu randevu slotu artık müsait değil; lütfen başka bir saat seçin.");
          }
          const alreadyBooked = state.appointments.some(
            (item) =>
              item.status === "booked" &&
              item.slotStart === current.start &&
              item.technicianName === current.technicianName,
          );
          if (alreadyBooked) {
            throw new Error("Bu saat için zaten bir randevunuz var.");
          }
        } else {
          throw new Error("Randevu slotu bulunamadı; takvimi yenileyip tekrar deneyin.");
        }

        const appointment: Appointment = {
          id: makeId("RND"),
          slotStart: slot.start,
          technicianName: slot.technicianName,
          type,
          status: "booked",
        };
        set((latest) => ({
          appointments: [appointment, ...latest.appointments],
          slots: latest.slots.map((item) =>
            item.id === slot.id
              ? { ...item, status: "booked" as const, heldBy: undefined, heldUntil: undefined }
              : item,
          ),
        }));
        logAutomation("appointment.booked", {
          appointmentId: appointment.id,
          slotStart: appointment.slotStart,
          technician: appointment.technicianName,
        });
        return appointment;
      },

      addAddress: (address) => {
        const created: Address = { ...address, id: makeId("ADR") };
        set((state) => ({
          addresses: address.isDefault
            ? [...state.addresses.map((item) => ({ ...item, isDefault: false })), created]
            : [...state.addresses, created],
        }));
        return created;
      },

      updateAddress: (id, patch) =>
        set((state) => ({
          addresses: state.addresses.map((address) =>
            address.id === id ? { ...address, ...patch } : address,
          ),
        })),

      removeAddress: (id) =>
        set((state) => ({ addresses: state.addresses.filter((address) => address.id !== id) })),

      setSlots: (slots) => set({ slots }),

      cancelSubscription: async () => {
        const state = get();
        const subscription = state.subscription;

        if (!subscription || subscription.status !== "active") {
          return { ok: false, error: "İptal edilecek aktif bir abonelik yok." };
        }

        set({ subscription: { ...subscription, status: "cancelled" } });

        try {
          await mockPaymentProvider.cancelSubscription({
            id: subscription.id,
            customerRef: state.user?.id ?? "anonymous",
            planId: "plan-6",
            status: "cancelled",
          });
        } catch {
          // Sağlayıcı iptali reddetti: iyimser güncellemeyi geri al.
          set({ subscription });
          return { ok: false, error: "Abonelik iptal edilemedi; lütfen tekrar deneyin." };
        }

        logAutomation("subscription.cancelled", { userId: state.user?.id });
        return { ok: true };
      },

      addB2BLead: (lead) => {
        const created: B2BLead = {
          ...lead,
          id: makeId("B2B"),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ b2bLeads: [created, ...state.b2bLeads] }));
        logAutomation("b2b.lead.created", { company: created.company, city: created.city });
        return created;
      },
    }),
    {
      name: "su-aritma-demo",
      version: 1,
    },
  ),
);
