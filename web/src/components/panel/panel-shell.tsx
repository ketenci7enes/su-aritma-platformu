"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Droplets,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Package,
  UserRound,
} from "lucide-react";
import { useDemoStore } from "@/lib/store/demo";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const navItems = [
  { href: "/panel", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/panel/siparisler", label: "Siparişler", icon: Package },
  { href: "/panel/randevu", label: "Randevu", icon: CalendarDays },
  { href: "/panel/filtre", label: "Filtre & Abonelik", icon: Droplets },
  { href: "/panel/destek", label: "Destek", icon: LifeBuoy },
  { href: "/panel/profil", label: "Profil", icon: UserRound },
];

export function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useDemoStore((state) => state.user);
  const logout = useDemoStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !user) router.replace("/panel/giris");
  }, [mounted, user, router]);

  if (!mounted) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-sm text-ink-soft">Panel yükleniyor…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-sm text-ink-soft">Giriş sayfasına yönlendiriliyorsunuz…</p>
        <Link href="/panel/giris" className="mt-2 inline-block text-sm text-primary underline">
          Bağlantı açılmadıysa tıklayın
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-surface-muted/50">
      <div className="container-page py-6 md:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink-soft">Müşteri paneli</p>
            <h1 className="text-h3 font-extrabold">Merhaba, {user.fullName ?? "müşterimiz"}</h1>
            <p className="text-xs text-ink-soft">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/panel/giris");
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface px-3 py-2 text-xs font-medium text-ink-soft hover:text-danger"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Çıkış
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
          <nav aria-label="Panel menüsü" className="h-fit lg:sticky lg:top-24">
            <ul className="flex gap-1 overflow-x-auto rounded-2xl border border-border-soft bg-surface p-2 lg:flex-col">
              {navItems.map((item) => {
                const active =
                  item.href === "/panel" ? pathname === "/panel" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                        active
                          ? "bg-primary-soft text-primary-dark"
                          : "text-ink-soft hover:bg-surface-muted hover:text-ink",
                      )}
                    >
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function PanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-h3 font-extrabold">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
    </div>
  );
}

export function PanelEmpty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-8 text-center">
      <Logo compact className="mx-auto" />
      <h3 className="mt-3 text-base font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{text}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
