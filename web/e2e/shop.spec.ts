import { expect, test } from "@playwright/test";

test("quiz → sepet → mock ödeme → onay akışı", async ({ page }) => {
  await page.goto("/cihaz-bul");

  await page.getByLabel("İl*", { exact: true }).selectOption("Antalya");
  await page.getByRole("button", { name: "Su kalitemi analiz et" }).click();

  await expect(page.getByRole("heading", { name: "Evde kaç kişi yaşıyor?" })).toBeVisible({
    timeout: 10_000,
  });

  await page.getByRole("button", { name: "4", exact: true }).click();
  await page.getByRole("button", { name: "Sonucu göster" }).click();

  await expect(page.getByText("Antalya")).toBeVisible();
  await expect(page.getByText(/ppm/).first()).toBeVisible();

  await page.getByRole("button", { name: "Sepete ekle" }).click();
  await expect(page.getByRole("dialog", { name: "Sepetim" })).toBeVisible();

  await page.getByRole("link", { name: "Sepete git" }).click();
  await expect(page.getByRole("heading", { name: "Sepetim" })).toBeVisible();

  await page.getByRole("link", { name: "Ödemeye geç" }).click();
  await expect(page.getByRole("heading", { name: "Ödeme", level: 1 })).toBeVisible();

  await page.getByLabel("Ad soyad").fill("Elif Kaya");
  await page.getByLabel("E-posta").fill("elif@example.com");
  await page.getByLabel("Cep telefonu").fill("05321234567");
  await page.getByLabel("İl*", { exact: true }).selectOption("İstanbul");
  await page.getByLabel("İlçe*", { exact: true }).fill("Kadıköy");
  await page.getByLabel("Açık adres").fill("Moda Caddesi No 12 Daire 3");

  await page.getByRole("button", { name: /Siparişi tamamla/ }).click();

  await expect(page.getByText("Teşekkürler! Suyunuz yolda.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/SP-\d{4}-\d{4}/)).toBeVisible();
});

test("sepet sayfa yenilenince korunur", async ({ page }) => {
  await page.goto("/urunler/aquapure-home-5");
  await page.getByRole("button", { name: /Sepete ekle/ }).click();

  await page.goto("/sepet");
  await expect(page.getByText("AquaPure Home 5")).toBeVisible();

  await page.reload();
  await expect(page.getByText("AquaPure Home 5")).toBeVisible();
});
