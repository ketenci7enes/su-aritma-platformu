"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Clock } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo";
import { generateSlots, PANEL_TECHNICIANS } from "@/lib/appointments/generate";
import { confirmSlot, holdSlot, isSlotAvailable, type SlotRecord } from "@/lib/appointments/slots";
import { formatDateTR, formatDateTimeTR, formatTimeTR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PanelEmpty, PanelHeader } from "@/components/panel/panel-shell";

export default function PanelAppointmentPage() {
  const user = useDemoStore((state) => state.user);
  const orders = useDemoStore((state) => state.orders);
  const slots = useDemoStore((state) => state.slots);
  const setSlots = useDemoStore((state) => state.setSlots);
  const appointments = useDemoStore((state) => state.appointments);
  const bookAppointment = useDemoStore((state) => state.bookAppointment);

  const [technician, setTechnician] = useState("all");
  const [heldId, setHeldId] = useState<string | null>(null);
  const [heldStart, setHeldStart] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !user || orders.length === 0) return;
    initialized.current = true;
    if (slots.length === 0) {
      setSlots(
        generateSlots({
          now: new Date(),
          from: new Date(),
          days: 7,
          technicians: PANEL_TECHNICIANS,
        }),
      );
    }
  }, [user, orders.length, slots.length, setSlots]);

  const visibleSlots = useMemo(
    () =>
      slots.filter(
        (slot) =>
          (technician === "all" || slot.technicianId === technician) &&
          isSlotAvailable(slot, user?.id ?? "", new Date()),
      ),
    [slots, technician, user?.id],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, SlotRecord[]>();
    for (const slot of visibleSlots) {
      const key = formatDateTR(slot.start);
      map.set(key, [...(map.get(key) ?? []), slot]);
    }
    return [...map.entries()];
  }, [visibleSlots]);

  function handleHold(slot: SlotRecord) {
    if (!user) return;
    setError(null);
    setMessage(null);
    const result = holdSlot(slots, slot.id, user.id, new Date());
    if (!result.ok) {
      setError(result.error ?? "Slot tutulamadı");
      return;
    }
    setSlots(result.slots);
    setHeldId(slot.id);
    setHeldStart(slot.start);
    setMessage("Slot 10 dakika süreyle sizin için tutuldu. Randevuyu onaylayın.");
  }

  function handleConfirm() {
    if (!user || !heldId) return;
    const now = new Date();
    const confirmed = confirmSlot(slots, heldId, user.id, now);
    if (!confirmed.ok) {
      setError(confirmed.error ?? "Randevu onaylanamadı");
      setHeldId(null);
      return;
    }
    const slot = confirmed.slots.find((item) => item.id === heldId);
    if (!slot) return;
    try {
      bookAppointment(slot, "install");
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Randevu oluşturulamadı");
      setHeldId(null);
      setHeldStart(null);
      return;
    }
    setSlots(confirmed.slots);
    setHeldId(null);
    setHeldStart(null);
    setMessage(null);
  }

  if (orders.length === 0) {
    return (
      <div>
        <PanelHeader title="Randevu" subtitle="Kargo teslim edildiğinde kurulum takvimi açılır." />
        <PanelEmpty
          title="Önce bir sipariş gerekiyor"
          text="Takvim, siparişiniz teslim edildi statüsüne geçtiğinde aktifleşir. Demo modda sipariş oluşturduğunuzda takvim açılır."
          action={
            <Link href="/urunler">
              <Button>Ürünlere göz at</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PanelHeader
        title="Randevu"
        subtitle="Bölgenizdeki teknisyenin boş saatlerinden birini seçin. Seçim 10 dakika tutulur."
      />

      <div className="mb-4 rounded-xl border border-primary/20 bg-primary-soft/40 p-3">
        <p className="text-xs text-primary-dark">
          Demo mod: kargo teslimi otomatik olarak tamamlanmış kabul edilir; gerçek akışta bu takvim
          yalnızca <strong>delivered</strong> durumundan sonra açılır.
        </p>
      </div>

      {appointments.length > 0 ? (
        <section aria-labelledby="my-appointments" className="mb-5">
          <h3 id="my-appointments" className="mb-2 text-sm font-bold">
            Randevularım
          </h3>
          <ul className="space-y-2">
            {appointments.map((appointment) => (
              <li
                key={appointment.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-surface p-3"
              >
                <div>
                  <p className="text-sm font-semibold">{formatDateTimeTR(appointment.slotStart)}</p>
                  <p className="text-xs text-ink-soft">{appointment.technicianName}</p>
                </div>
                <Badge variant="success">Onaylandı</Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mb-4 max-w-xs">
        <Select
          label="Teknisyen"
          value={technician}
          onChange={(event) => setTechnician(event.target.value)}
        >
          <option value="all">Tüm teknisyenler</option>
          {PANEL_TECHNICIANS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </Select>
      </div>

      {message ? (
        <p
          role="status"
          className="mb-3 rounded-lg bg-accent-tint px-3 py-2 text-xs font-medium text-accent-text"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger"
        >
          {error}
        </p>
      ) : null}

      {grouped.length === 0 ? (
        <p className="text-sm text-ink-soft">Uygun boş slot bulunamadı. Filtreyi değiştirin.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, daySlots]) => (
            <section key={day} aria-label={day}>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink-soft">
                <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {day}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {daySlots.map((slot) => {
                  const selected = heldId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleHold(slot)}
                      aria-pressed={selected}
                      aria-label={`${formatTimeTR(slot.start)} ${slot.technicianName}`}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        selected
                          ? "border-primary bg-primary text-surface"
                          : "border-border-soft bg-surface hover:border-primary"
                      }`}
                    >
                      <span className="flex items-center gap-1 text-sm font-bold">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatTimeTR(slot.start)}
                      </span>
                      <span
                        className={`mt-0.5 block text-[11px] ${selected ? "text-white/80" : "text-ink-soft"}`}
                      >
                        {slot.technicianName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {heldId ? (
        <div className="sticky bottom-3 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-soft bg-surface p-4 shadow-lg">
          <p className="text-xs">
            Seçili slot: <strong>{heldStart ? formatDateTimeTR(heldStart) : ""}</strong>
            <span className="block text-ink-soft">10 dakika içinde onaylayın.</span>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setHeldId(null)}>
              Vazgeç
            </Button>
            <Button onClick={handleConfirm}>Randevuyu onayla</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
