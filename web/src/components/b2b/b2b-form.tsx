"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { b2bLeadSchema } from "@/lib/validation";
import { useDemoStore } from "@/lib/store/demo";

const initial = {
  company: "",
  contactName: "",
  phone: "",
  city: "",
  sector: "hotel" as "hotel" | "restaurant" | "cafe" | "other",
  message: "",
};

export function B2BForm() {
  const addB2BLead = useDemoStore((state) => state.addB2BLead);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [reference, setReference] = useState<string | null>(null);

  function update(field: keyof typeof initial, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = b2bLeadSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setStatus("sending");
    try {
      const lead = addB2BLead(parsed.data);
      setReference(lead.id);
      setStatus("success");
      setForm(initial);
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-accent/30 bg-accent-tint p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent-text" aria-hidden="true" />
        <h2 className="mt-3 text-h3 font-bold">Talebiniz alındı</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          Referans numaranız <strong className="text-ink">{reference}</strong>. Kurumsal ekibimiz 1
          iş günü içinde teklif için sizinle iletişime geçecek.
        </p>
        <Button variant="secondary" className="mt-5" onClick={() => setStatus("idle")}>
          Yeni talep oluştur
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Firma adı"
        required
        value={form.company}
        onChange={(event) => update("company", event.target.value)}
        error={errors.company}
        autoComplete="organization"
      />
      <Input
        label="İletişim kişisi"
        required
        value={form.contactName}
        onChange={(event) => update("contactName", event.target.value)}
        error={errors.contactName}
        autoComplete="name"
      />
      <Input
        label="Telefon"
        type="tel"
        required
        placeholder="05xx xxx xx xx"
        value={form.phone}
        onChange={(event) => update("phone", event.target.value)}
        error={errors.phone}
        autoComplete="tel"
      />
      <Input
        label="Şehir"
        required
        value={form.city}
        onChange={(event) => update("city", event.target.value)}
        error={errors.city}
        autoComplete="address-level2"
      />
      <Select
        label="Sektör"
        value={form.sector}
        onChange={(event) => update("sector", event.target.value)}
      >
        <option value="hotel">Otel</option>
        <option value="restaurant">Restoran</option>
        <option value="cafe">Kafe</option>
        <option value="other">Diğer</option>
      </Select>
      <div className="sm:col-span-2">
        <label htmlFor="b2b-message" className="text-sm font-medium text-ink">
          İhtiyacınız
        </label>
        <textarea
          id="b2b-message"
          rows={4}
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border-soft bg-surface p-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
          placeholder="Oda sayısı, günlük su tüketimi veya kurulum zamanı hakkında bilgi verin."
        />
      </div>

      {status === "error" ? (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          Talep gönderilemedi. Lütfen tekrar deneyin.
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" size="lg" className="w-full sm:w-auto" loading={status === "sending"}>
          <Send className="h-4 w-4" aria-hidden="true" />
          Teklif isteyin
        </Button>
        <p className="mt-2 text-[11px] text-ink-soft">
          Formu göndererek KVKK aydınlatma metnini okuduğunuzu kabul edersiniz.
        </p>
      </div>
    </form>
  );
}
