import { describe, expect, it } from "vitest";
import { cartCount, cartSubtotal, type CartLine } from "./cart-math";

const lines: CartLine[] = [
  { productId: "p1", slug: "a", name: "A", price: 12900, qty: 1, tone: "sky" },
  { productId: "p2", slug: "b", name: "B", price: 1490, qty: 2, tone: "mint" },
];

describe("cartSubtotal", () => {
  it("adet × fiyat toplamını döner", () => {
    expect(cartSubtotal(lines)).toBe(15880);
  });

  it("boş sepette 0 döner", () => {
    expect(cartSubtotal([])).toBe(0);
  });

  it("kayan nokta hatası üretmez", () => {
    const fractional: CartLine[] = [
      { productId: "x", slug: "x", name: "X", price: 0.1, qty: 3, tone: "sky" },
    ];
    expect(cartSubtotal(fractional)).toBe(0.3);
  });
});

describe("cartCount", () => {
  it("toplam adedi döner", () => {
    expect(cartCount(lines)).toBe(3);
  });

  it("boş sepette 0 döner", () => {
    expect(cartCount([])).toBe(0);
  });
});
