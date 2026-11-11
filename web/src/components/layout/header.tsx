"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cartCount } from "@/lib/store/cart-math";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { CartDrawer } from "./cart-drawer";

const navLinks = [
  { href: "/urunler", label: "Ürünler" },
  { href: "/cihaz-bul", label: "Cihaz Bul" },
  { href: "/kurumsal", label: "Kurumsal" },
  { href: "/panel", label: "Panel" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const count = useCartStore((state) => cartCount(state.lines));
  const openCart = useCartStore((state) => state.openCart);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-surface/85 backdrop-blur transition-shadow",
          scrolled ? "border-border-soft shadow-sm" : "border-transparent",
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav aria-label="Ana menü" className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openCart}
              aria-label={`Sepeti aç (${count} ürün)`}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              {count > 0 ? (
                <span className="absolute top-1 right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-surface">
                  {count}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-surface-muted md:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <nav
            id="mobile-menu"
            aria-label="Mobil menü"
            className="container-page grid gap-1 border-t border-border-soft py-3 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-surface-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <CartDrawer />
    </>
  );
}
