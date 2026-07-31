import { expect, test } from "@playwright/test";

test("zeigt die synthetische Demo-Startseite mit den wichtigsten Nutzerwegen", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.getByRole("heading", { level: 1, name: /Dienstag.*4\. August/ })).toBeVisible();
  await expect(page.getByText("Demovorschau", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Abfall nachschlagen" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Standort finden" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Die nächsten Termine" })).toBeVisible();

  await page.getByRole("link", { name: "Standort finden" }).click();
  await expect(page.getByRole("heading", { name: "Entsorgungsstandorte" })).toBeInViewport();
});

test("unterstützt den Tastaturweg über Sprunglink und Hauptnavigation", async ({ page }) => {
  await page.goto("/demo");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Zum Hauptinhalt" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("@visual bleibt bei 320 Pixeln ohne horizontalen Überlauf bedienbar", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/demo");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByRole("navigation", { name: "Mobile Hauptnavigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ABC", exact: true })).toBeVisible();
});

test("zeigt für einen unbekannten Mandanten einen verständlichen Fehlerzustand", async ({
  page,
}) => {
  await page.goto("/nicht-vorhanden");

  await expect(
    page.getByRole("heading", { level: 1, name: "Dieser Einstieg ist nicht konfiguriert." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Demo öffnen" })).toBeVisible();
});
