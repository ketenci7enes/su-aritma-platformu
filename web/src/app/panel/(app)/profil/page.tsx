"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo";
import { provinceNames } from "@/lib/data/hardness";
import type { Address } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PanelHeader } from "@/components/panel/panel-shell";

interface AddressForm {
  title: string;
  il: string;
  ilce: string;
  line: string;
  phone: string;
}

const emptyForm: AddressForm = { title: "Ev", il: "", ilce: "", line: "", phone: "" };

export default function PanelProfilePage() {
  const user = useDemoStore((state) => state.user);
  const updateUser = useDemoStore((state) => state.updateUser);
  const addresses = useDemoStore((state) => state.addresses);
  const addAddress = useDemoStore((state) => state.addAddress);
  const updateAddress = useDemoStore((state) => state.updateAddress);
  const removeAddress = useDemoStore((state) => state.removeAddress);

  const [name, setName] = useState(user?.fullName ?? "");
  const [nameSaved, setNameSaved] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

  function validate(): boolean {
    const next: Partial<Record<keyof AddressForm, string>> = {};
    if (form.title.trim().length < 2) next.title = "Başlık girin (örn. Ev)";
    if (!form.il) next.il = "İl seçin";
    if (form.ilce.trim().length < 2) next.ilce = "İlçe girin";
    if (form.line.trim().length < 10) next.line = "Açık adres en az 10 karakter";
    if (!/^(?:\+90|0)?5\d{9}$/.test(form.phone.replace(/[\s()-]/g, ""))) {
      next.phone = "Geçerli cep telefonu girin";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    if (editingId) {
      updateAddress(editingId, { ...form });
    } else {
      addAddress({ ...form, isDefault: addresses.length === 0 });
    }
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  }

  function startEdit(address: Address) {
    setEditingId(address.id);
    setForm({
      title: address.title,
      il: address.il,
      ilce: address.ilce,
      line: address.line,
      phone: address.phone,
    });
    setErrors({});
  }

  return (
    <div className="space-y-6">
      <PanelHeader title="Profil" subtitle="İletişim bilgileri ve teslimat adresleri." />

      <section className="rounded-2xl border border-border-soft bg-surface p-5">
        <h3 className="text-sm font-bold">İletişim</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Input
              label="Ad soyad"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameSaved(false);
              }}
            />
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  updateUser({ fullName: name.trim() || undefined });
                  setNameSaved(true);
                }}
              >
                Kaydet
              </Button>
              {nameSaved ? (
                <span role="status" className="text-xs text-accent-text">
                  Kaydedildi
                </span>
              ) : null}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-ink">E-posta</p>
            <p className="mt-2 rounded-xl border border-border-soft bg-surface-muted px-3.5 py-3 text-sm text-ink-soft">
              {user?.email}
            </p>
            <p className="mt-1 text-[11px] text-ink-soft">
              E-posta değişikliği için destek ekibine ulaşın (güvenlik).
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="addresses-title"
        className="rounded-2xl border border-border-soft bg-surface p-5"
      >
        <h3 id="addresses-title" className="text-sm font-bold">
          Adresler
        </h3>

        {addresses.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Kayıtlı adresiniz yok.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {addresses.map((address) => (
              <li
                key={address.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border-soft p-3"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {address.title}
                    {address.isDefault ? <Badge variant="primary">Varsayılan</Badge> : null}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {address.il} / {address.ilce} · {address.line}
                  </p>
                  <p className="text-xs text-ink-soft">{address.phone}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(address)}
                    aria-label={`${address.title} adresini düzenle`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-muted"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAddress(address.id)}
                    aria-label={`${address.title} adresini sil`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-surface-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-3 sm:grid-cols-2">
          <h4 className="text-sm font-semibold sm:col-span-2">
            {editingId ? "Adresi düzenle" : "Yeni adres ekle"}
          </h4>
          <Input
            label="Adres başlığı"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            error={errors.title}
          />
          <Select
            label="İl"
            value={form.il}
            onChange={(event) => setForm({ ...form, il: event.target.value })}
            error={errors.il}
          >
            <option value="">İl seçin</option>
            {provinceNames.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </Select>
          <Input
            label="İlçe"
            value={form.ilce}
            onChange={(event) => setForm({ ...form, ilce: event.target.value })}
            error={errors.ilce}
          />
          <Input
            label="Telefon"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            error={errors.phone}
            placeholder="05xx xxx xx xx"
          />
          <div className="sm:col-span-2">
            <Input
              label="Açık adres"
              value={form.line}
              onChange={(event) => setForm({ ...form, line: event.target.value })}
              error={errors.line}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">
              {editingId ? (
                "Değişiklikleri kaydet"
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Adres ekle
                </>
              )}
            </Button>
            {editingId ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setErrors({});
                }}
              >
                Vazgeç
              </Button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
