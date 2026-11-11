import { beforeEach, describe, expect, it } from "vitest";
import { products } from "@/lib/data/products";
import { useCartStore } from "./cart";

const home = products.find((product) => product.slug === "aquapure-home-5")!;
const filter = products.find((product) => product.slug === "6-aylik-filtre-seti")!;

beforeEach(() => {
  useCartStore.setState({ lines: [], isOpen: false });
});

describe("sepet store", () => {
  it("ürün ekler", () => {
    useCartStore.getState().addItem(home);
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lines[0]?.qty).toBe(1);
  });

  it("aynı ürün tekrar eklenince adedi artırır", () => {
    useCartStore.getState().addItem(home);
    useCartStore.getState().addItem(home, 2);
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lines[0]?.qty).toBe(3);
  });

  it("adedi günceller ve 0'da satırı siler", () => {
    useCartStore.getState().addItem(home);
    useCartStore.getState().setQty(home.id, 4);
    expect(useCartStore.getState().lines[0]?.qty).toBe(4);
    useCartStore.getState().setQty(home.id, 0);
    expect(useCartStore.getState().lines).toHaveLength(0);
  });

  it("ürünü siler ve sepeti temizler", () => {
    useCartStore.getState().addItem(home);
    useCartStore.getState().addItem(filter);
    useCartStore.getState().removeItem(home.id);
    expect(useCartStore.getState().lines.map((line) => line.slug)).toEqual([filter.slug]);
    useCartStore.getState().clear();
    expect(useCartStore.getState().lines).toHaveLength(0);
  });

  it("abonelik satırını açıp kapatır, iki kez eklemez", () => {
    useCartStore.getState().toggleSubscription();
    expect(useCartStore.getState().hasSubscription()).toBe(true);
    useCartStore.getState().toggleSubscription();
    expect(useCartStore.getState().hasSubscription()).toBe(false);
  });

  it("sepet çekmecesini açar ve kapatır", () => {
    useCartStore.getState().openCart();
    expect(useCartStore.getState().isOpen).toBe(true);
    useCartStore.getState().closeCart();
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it("sepeti localStorage'a yazar (sayfa yenilenince korunur)", () => {
    useCartStore.getState().addItem(home, 2);
    const raw = window.localStorage.getItem("su-aritma-cart");
    expect(raw).toBeTruthy();
    expect(raw).toContain(home.slug);
  });
});
