import { describe, expect, it } from "vitest";
import { b2bLeadSchema, checkoutSchema, supportTicketSchema } from "./validation";

describe("checkoutSchema", () => {
  const valid = {
    fullName: "Elif Kaya",
    email: "elif@example.com",
    phone: "05321234567",
    il: "İstanbul",
    ilce: "Kadıköy",
    line: "Moda Cad. No: 12 D:3",
  };

  it("geçerli adresi kabul eder", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("geçersiz e-postayı reddeder", () => {
    const result = checkoutSchema.safeParse({ ...valid, email: "elif@" });
    expect(result.success).toBe(false);
  });

  it("kısa telefonu reddeder", () => {
    const result = checkoutSchema.safeParse({ ...valid, phone: "123" });
    expect(result.success).toBe(false);
  });

  it("boş ad soyadı reddeder", () => {
    const result = checkoutSchema.safeParse({ ...valid, fullName: " " });
    expect(result.success).toBe(false);
  });
});

describe("b2bLeadSchema", () => {
  it("geçerli teklif formunu kabul eder", () => {
    const result = b2bLeadSchema.safeParse({
      company: "Deniz Otel",
      contactName: "Murat Ak",
      phone: "05321234567",
      city: "Antalya",
      sector: "hotel",
      message: "120 oda için teklif istiyoruz.",
    });
    expect(result.success).toBe(true);
  });

  it("firma adı olmadan reddeder", () => {
    const result = b2bLeadSchema.safeParse({
      company: "",
      contactName: "Murat Ak",
      phone: "05321234567",
      city: "Antalya",
      sector: "hotel",
    });
    expect(result.success).toBe(false);
  });
});

describe("supportTicketSchema", () => {
  it("sorun tipi seçilmiş ticket'ı kabul eder", () => {
    expect(
      supportTicketSchema.safeParse({ issueType: "leak", note: "Tank altından su sızıyor" })
        .success,
    ).toBe(true);
  });

  it("geçersiz sorun tipini reddeder", () => {
    expect(supportTicketSchema.safeParse({ issueType: "boom", note: "x" }).success).toBe(false);
  });
});
