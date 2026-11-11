import { z } from "zod";

const phoneRegex = /^(?:\+90|0)?5\d{9}$/;

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı"),
  email: z.string().trim().email("Geçerli bir e-posta girin"),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(phoneRegex, "Geçerli bir cep telefonu girin (05xx xxx xx xx)")),
  il: z.string().trim().min(2, "İl seçin"),
  ilce: z.string().trim().min(2, "İlçe girin"),
  line: z.string().trim().min(10, "Açık adres en az 10 karakter olmalı"),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

export const b2bLeadSchema = z.object({
  company: z.string().trim().min(2, "Firma adı zorunlu"),
  contactName: z.string().trim().min(2, "İletişim kişisi zorunlu"),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(phoneRegex, "Geçerli bir telefon girin")),
  city: z.string().trim().min(2, "Şehir zorunlu"),
  sector: z.enum(["hotel", "restaurant", "cafe", "other"]),
  message: z.string().trim().max(1000, "Mesaj en fazla 1000 karakter").optional(),
});

export type B2BLeadInput = z.input<typeof b2bLeadSchema>;

export const supportTicketSchema = z.object({
  issueType: z.enum(["pressure", "leak", "taste", "other"], {
    message: "Sorun tipi seçin",
  }),
  note: z.string().trim().max(500, "Not en fazla 500 karakter").optional(),
});

export const magicLinkSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta girin"),
});

export type MagicLinkInput = z.input<typeof magicLinkSchema>;
