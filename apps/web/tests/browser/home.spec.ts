import { expect, test } from "@playwright/test";

test("lädt personalisierte Pilotdaten und durchsucht das Abfall-ABC", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.getByText("Lokaler Pilot", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("August");
  await expect(page.getByText("Musterstraße 12, 52062 Demo-Stadt").first()).toBeVisible();

  await page.getByLabel("Gegenstand", { exact: true }).first().fill("Akku");
  await page.getByRole("button", { name: "Suchen" }).last().click();
  await expect(page.getByRole("heading", { name: "Batterien" })).toBeVisible();
  await expect(page.getByText("Nicht in den Restabfall werfen.")).toBeVisible();
});

test("legt eine synthetische Reklamation an und ruft ihren Status ab", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("August");

  await page.getByLabel("Ort oder Adresse").fill("Musterstraße 12, Demo-Stadt");
  await page.getByLabel("Zeitpunkt").fill("2026-07-31T10:30");
  await page.getByLabel("Beschreibung").fill("Die Restabfalltonne wurde heute nicht geleert.");
  await page
    .getByLabel(/lokalen Demo-Verarbeitung/)
    .first()
    .check();
  await page.getByRole("button", { name: "Meldung absenden" }).click();

  await expect(page.getByRole("heading", { name: /Ihr Vorgang: DEMO-/ })).toBeVisible();
  await page.getByRole("button", { name: "Status abrufen" }).click();
  await expect(page.getByText("Meldung eingegangen")).toBeVisible();
});

test("unterstützt den Tastaturweg über den Sprunglink", async ({ page }) => {
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
  await expect(page.getByRole("heading", { level: 1 })).toContainText("August");

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

test("Pflege-Unit zeigt Eingabeformulare und Vorgangsliste", async ({ page }) => {
  await page.goto("http://localhost:13001");
  await expect(page.getByRole("heading", { name: "Kommunale Daten pflegen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Abfuhrtermin" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reklamationen und Aufträge" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Aktualisieren" })).toBeVisible();
});
