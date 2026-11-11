"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProductById, products } from "@/lib/data/products";
import type { CartLine, Product } from "@/lib/types";

const SUBSCRIPTION_ID = "p-subscription";

function toLine(product: Product, qty: number): CartLine {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    qty,
    tone: product.tone,
  };
}

export interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleSubscription: () => void;
  hasSubscription: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,

      addItem: (product, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((line) => line.productId === product.id);
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.productId === product.id ? { ...line, qty: line.qty + qty } : line,
              ),
            };
          }
          return { lines: [...state.lines, toLine(product, Math.max(1, qty))] };
        }),

      removeItem: (productId) =>
        set((state) => ({ lines: state.lines.filter((line) => line.productId !== productId) })),

      setQty: (productId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((line) => line.productId !== productId)
              : state.lines.map((line) =>
                  line.productId === productId ? { ...line, qty: Math.floor(qty) } : line,
                ),
        })),

      clear: () => set({ lines: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      hasSubscription: () => get().lines.some((line) => line.productId === SUBSCRIPTION_ID),

      toggleSubscription: () => {
        const state = get();
        if (state.hasSubscription()) {
          state.removeItem(SUBSCRIPTION_ID);
          return;
        }
        const plan =
          getProductById(SUBSCRIPTION_ID) ?? products.find((p) => p.id === SUBSCRIPTION_ID);
        if (plan) state.addItem(plan);
      },
    }),
    {
      name: "su-aritma-cart",
      partialize: (state) => ({ lines: state.lines }),
      version: 1,
    },
  ),
);

export { SUBSCRIPTION_ID };
