"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, LifeBuoy, X } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo";
import { supportTicketSchema } from "@/lib/validation";
import { formatDateTimeTR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PanelHeader } from "@/components/panel/panel-shell";
import type { SupportTicket } from "@/lib/types";

const ISSUES: { value: SupportTicket["issueType"]; label: string }[] = [
  { value: "pressure", label: "Basınç düşük" },
  { value: "leak", label: "Su sızdırıyor" },
  { value: "taste", label: "Tat / koku bozuk" },
  { value: "other", label: "Diğer" },
];

const ISSUE_LABEL: Record<SupportTicket["issueType"], string> = {
  pressure: "Basınç düşük",
  leak: "Su sızıntısı",
  taste: "Tat / koku",
  other: "Diğer",
};

export default function PanelSupportPage() {
  const tickets = useDemoStore((state) => state.tickets);
  const addTicket = useDemoStore((state) => state.addTicket);
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<SupportTicket["issueType"] | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = supportTicketSchema.safeParse({ issueType, note });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Sorun tipi seçin");
      return;
    }
    addTicket(parsed.data.issueType, parsed.data.note ?? "");
    setOpen(false);
    setIssueType("");
    setNote("");
    setError(null);
    setSuccess(true);
  }

  return (
    <div>
      <PanelHeader
        title="Destek"
        subtitle="Sorununuzu tek tıkla bildirin; bölgenizdeki teknisyene iletilir."
      />

      <section className="rounded-2xl border border-accent/30 bg-accent-tint p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-text">
              <LifeBuoy className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-accent-text">Acil destek</h3>
              <p className="mt-0.5 text-xs text-ink-soft">
                Basınç, sızıntı veya tat sorunu için hızlı bildirim oluşturun.
              </p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}>
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Tek tıkla destek
          </Button>
        </div>
      </section>

      {success ? (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl bg-accent-tint px-3 py-2 text-xs font-medium text-accent-text"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Bildiriminiz alındı. Bölge teknisyeni en kısa sürede sizinle iletişime geçecek.
        </p>
      ) : null}

      <section aria-labelledby="ticket-history" className="mt-6">
        <h3 id="ticket-history" className="mb-2 text-sm font-bold">
          Bildirim geçmişi
        </h3>
        {tickets.length === 0 ? (
          <p className="rounded-xl border border-border-soft bg-surface p-4 text-sm text-ink-soft">
            Henüz destek bildiriminiz yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border-soft bg-surface p-4"
              >
                <div>
                  <p className="text-sm font-semibold">{ISSUE_LABEL[ticket.issueType]}</p>
                  {ticket.note ? (
                    <p className="mt-1 max-w-lg text-xs text-ink-soft">{ticket.note}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-ink-soft">
                    {formatDateTimeTR(ticket.createdAt)} · {ticket.id}
                  </p>
                </div>
                <Badge variant={ticket.status === "open" ? "warning" : "success"}>
                  {ticket.status === "open" ? "Açık" : "İşlemde"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
          <button
            type="button"
            aria-label="Destek penceresini kapat"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-title"
            className="relative w-full max-w-md rounded-2xl bg-surface p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="support-title" className="text-lg font-bold">
                  Tek tıkla destek
                </h2>
                <p className="mt-1 text-xs text-ink-soft">
                  Sorun tipini seçin; bölge teknisyenine Telegram üzerinden iletilir (Faz 1&apos;de
                  mock).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-muted"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <fieldset>
                <legend className="text-sm font-medium text-ink">Sorun tipi</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ISSUES.map((issue, index) => (
                    <label
                      key={issue.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                        issueType === issue.value
                          ? "border-primary bg-primary-soft"
                          : "border-border-soft hover:border-primary"
                      }`}
                    >
                      <input
                        ref={index === 0 ? firstFieldRef : undefined}
                        type="radio"
                        name="issue"
                        value={issue.value}
                        checked={issueType === issue.value}
                        onChange={() => {
                          setIssueType(issue.value);
                          setError(null);
                        }}
                        className="accent-primary"
                      />
                      {issue.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="support-note" className="text-sm font-medium text-ink">
                  Kısa not (opsiyonel)
                </label>
                <textarea
                  id="support-note"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border-soft bg-surface p-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
                  placeholder="Örn. tankın altından damlama var"
                />
              </div>

              {error ? (
                <p role="alert" className="text-xs font-medium text-danger">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Vazgeç
                </Button>
                <Button type="submit">Bildirimi gönder</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
