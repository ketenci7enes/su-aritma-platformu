import { expect, test } from "@playwright/test";

async function demoLogin(page: import("@playwright/test").Page) {
  await page.goto("/panel/giris");
  await page.getByLabel("E-posta adresi").fill("demo@example.com");
  await page.getByRole("button", { name: "Giriş bağlantısı gönder" }).click();
  await expect(page.getByText("Merhaba, demo")).toBeVisible();
}

test("demo magic link girişi ve panel görünümü", async ({ page }) => {
  await demoLogin(page);
  await expect(page.getByRole("navigation", { name: "Panel menüsü" })).toBeVisible();
  await expect(page.getByText("Henüz siparişiniz yok")).toBeVisible();
});

test("tek tıkla destek ticket oluşturur", async ({ page }) => {
  await demoLogin(page);

  await page.getByRole("link", { name: "Destek", exact: true }).click();
  await page.getByRole("button", { name: "Tek tıkla destek" }).click();

  await expect(page.getByRole("dialog", { name: "Tek tıkla destek" })).toBeVisible();
  await page.getByRole("radio", { name: "Su sızdırıyor" }).check();
  await page.getByLabel("Kısa not (opsiyonel)").fill("Tankın altından damlama var");
  await page.getByRole("button", { name: "Bildirimi gönder" }).click();

  await expect(page.getByText("Bildiriminiz alındı")).toBeVisible();
  await expect(page.getByText("Su sızıntısı")).toBeVisible();
});

test("B2B teklif formu doğrulanır ve gönderilir", async ({ page }) => {
  await page.goto("/kurumsal#teklif");

  await page.getByRole("button", { name: "Teklif isteyin" }).click();
  await expect(page.getByText("Firma adı zorunlu")).toBeVisible();

  await page.getByLabel("Firma adı").fill("Deniz Otel");
  await page.getByLabel("İletişim kişisi").fill("Murat Ak");
  await page.getByLabel("Telefon").fill("05321234567");
  await page.getByLabel("Şehir").fill("Antalya");
  await page.getByRole("button", { name: "Teklif isteyin" }).click();

  await expect(page.getByText("Talebiniz alındı")).toBeVisible();
});
