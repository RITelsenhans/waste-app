import { expect, test } from "@playwright/test";

test("bietet die öffentliche Kommunenauswahl ohne Anmeldung", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Welche Kommune möchten Sie öffnen?" }),
  ).toBeVisible();
  await expect(page.locator(".municipality-grid a")).toHaveCount(1);

  await page.goto("/demo");
  await expect(page.getByLabel("Kommune auswählen")).toHaveValue("demo");
});

test("ordnet den Desktop-Kopf zweizeilig und zentriert", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/demo");

  const brand = await page.locator(".brand-link").boundingBox();
  const navigation = await page.getByRole("navigation", { name: "Hauptnavigation" }).boundingBox();
  expect(brand).not.toBeNull();
  expect(navigation).not.toBeNull();
  expect(navigation!.y).toBeGreaterThan(brand!.y + brand!.height - 4);
  expect(Math.abs(navigation!.x + navigation!.width / 2 - 640)).toBeLessThan(4);
});

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

test("ordnet im SortierKompass synthetische Beispielfotos kommunalen Regeln zu", async ({
  page,
}) => {
  await page.goto("/demo");
  await expect(page.getByRole("link", { name: /SortierKompass testen/ })).toHaveAttribute(
    "href",
    "#sortierkompass",
  );
  const sorter = page.locator("#sortierkompass");

  await expect(sorter.getByRole("heading", { name: "SortierKompass" })).toBeVisible();
  await expect(sorter.getByRole("button", { name: /Alter Toaster/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await sorter.getByRole("button", { name: "Beispielfoto prüfen" }).click();
  await expect(sorter.getByText("Beispiel zugeordnet")).toBeVisible();
  await expect(sorter.getByRole("heading", { name: "Elektrogeräte" })).toBeVisible();
  await expect(sorter.getByText(/Am Recyclinghof oder über die Rücknahme/)).toBeVisible();

  await sorter.getByRole("button", { name: /Batterien AA-Zellen/ }).click();
  await sorter.getByRole("button", { name: "Beispielfoto prüfen" }).click();
  await expect(sorter.getByRole("heading", { name: "Batterien" })).toBeVisible();
  await expect(sorter.getByText("Nicht in den Restabfall werfen.")).toBeVisible();
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

test("simuliert den 24-7-Zugang vom Antrag bis zur geschlossenen Ausfahrt", async ({ page }) => {
  await page.goto("/demo");
  const showcase = page.locator("#nachtzugang");

  await expect(
    showcase.getByRole("link", { name: "Grafische Simulation mit Auto direkt ansehen" }),
  ).toHaveAttribute("href", "#nachtzufahrt");
  await expect(
    showcase.getByRole("heading", { name: "24/7-Zugang zum Recyclinghof" }),
  ).toBeVisible();
  await expect(showcase.getByText("Hardware-Simulation.")).toBeVisible();
  await expect(showcase.getByText("Schranke geschlossen", { exact: true })).toBeVisible();
  await expect(showcase.locator(".journey-card")).toHaveCount(4);
  await showcase.getByLabel(/synthetische Testdaten/).check();
  await showcase.getByRole("button", { name: "Zugang verbindlich simulieren" }).click();

  await expect(showcase.getByText("DEMO-TV-22", { exact: true })).toBeVisible();
  await expect(showcase.getByText("Zugang erteilt", { exact: true })).toBeVisible();
  await showcase.getByRole("button", { name: "Ankunft jetzt scannen" }).click();
  await expect(showcase.getByText("Schranke geöffnet", { exact: true })).toBeVisible();
  await showcase.getByRole("button", { name: "Einfahrt jetzt bestätigen" }).click();
  await showcase.getByRole("button", { name: "Ausfahrt jetzt freigeben" }).click();
  await showcase.getByRole("button", { name: "Ausfahrt jetzt abschließen" }).click();

  await expect(showcase.getByText("Besuch abgeschlossen", { exact: true })).toBeVisible();
  await expect(showcase.locator(".journey-card.is-complete")).toHaveCount(4);
  await expect(showcase.locator(".gate-message")).toContainText(
    "Ausfahrt abgeschlossen – Schranke geschlossen",
  );
});

test("versendet eine Beschwerdebestätigung in das lokale Testpostfach", async ({
  page,
  request,
}) => {
  const recipient = `mailtest-${Date.now()}@example.invalid`;
  await page.goto("/demo");
  await page.getByLabel("Ort oder Adresse").fill("Musterstraße 12, Demo-Stadt");
  await page.getByLabel("Zeitpunkt").fill("2026-08-01T09:15");
  await page.getByLabel("Beschreibung").fill("Die Biotonne wurde heute nicht geleert.");
  await page.getByLabel("E-Mail (optional)").first().fill(recipient);
  await page
    .getByLabel(/lokalen Demo-Verarbeitung/)
    .first()
    .check();
  await page.getByRole("button", { name: "Meldung absenden" }).click();

  const heading = await page.getByRole("heading", { name: /Ihr Vorgang: DEMO-/ }).textContent();
  const reference = heading?.replace("Ihr Vorgang: ", "") ?? "";
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `http://127.0.0.1:18025/view/latest.txt?query=${encodeURIComponent(`to:${recipient}`)}`,
        );
        return response.ok() ? await response.text() : "";
      },
      { timeout: 10_000 },
    )
    .toContain(reference);
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
  await page.getByRole("button", { name: "Vorgänge" }).click();
  await expect(page.getByRole("heading", { name: "Reklamationen und Aufträge" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Aktualisieren" })).toBeVisible();
});

test("zeigt eine interaktive Standortkarte und mehrere Demo-Adressen", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.getByTitle(/Karte für/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Große Karte öffnen/ })).toBeVisible();

  await page.getByLabel("Straße, Hausnummer, Ort oder Postleitzahl").fill("Demo-Stadt");
  await page.getByRole("button", { name: "Suchen" }).first().click();
  await expect(page.locator(".result-button")).toHaveCount(12);
});

test("öffnet den optionalen Kalender für das nächste Quartal", async ({ page }) => {
  await page.goto("/demo");
  const toggle = page.getByRole("button", {
    name: "Kalenderansicht für drei Monate öffnen",
  });
  await expect(page.locator("#quarter-calendar")).toHaveCount(0);
  await toggle.click();

  await expect(page.locator("#quarter-calendar")).toBeVisible();
  await expect(page.locator(".calendar-month")).toHaveCount(3);
  await expect(page.locator(".calendar-event").first()).toBeVisible();
  await expect(page.locator(".calendar-agenda strong").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Kalenderansicht schließen" })).toBeVisible();
});

test("der geöffnete Quartalskalender bleibt bei 320 Pixeln bedienbar", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/demo");
  await page.getByRole("button", { name: "Kalenderansicht für drei Monate öffnen" }).click();

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.locator(".calendar-month")).toHaveCount(3);
});

test("findet Adressen auch über den gepflegten Kommunennamen", async ({ page, request }) => {
  const response = await request.get("http://127.0.0.1:18080/v1/tenants/demo/config");
  const config = (await response.json()) as { name: string };
  await page.goto("/demo");

  await page.getByLabel("Straße, Hausnummer, Ort oder Postleitzahl").fill(config.name);
  await page.getByRole("button", { name: "Suchen" }).first().click();
  await expect(page.locator(".result-button")).toHaveCount(12);
});

test("lädt einen neu gepflegten Hinweis sichtbar nach", async ({ page, request }) => {
  const title = `Kurzfristiger Hinweis ${Date.now()}`;
  const created = await request.post("http://127.0.0.1:18080/v1/admin/notices", {
    data: {
      tenantId: "demo",
      addressId: null,
      noticeType: "service",
      title,
      body: "Dieser Hinweis wurde während des Browsertests gepflegt.",
      priority: "info",
      validFrom: "2026-08-01T00:00:00Z",
      validUntil: "2026-08-31T23:59:59Z",
    },
  });
  expect(created.ok()).toBeTruthy();
  const notice = (await created.json()) as { id: string };

  await page.goto("/demo");
  await page.getByRole("button", { name: "Aktualisieren" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  const removed = await request.delete(
    `http://127.0.0.1:18080/v1/admin/notices/${notice.id}?tenantId=demo`,
  );
  expect(removed.ok()).toBeTruthy();
});

test("Pflege-Unit bietet Bearbeiten und Löschen für Bestandsdaten", async ({ page }) => {
  await page.goto("http://localhost:13001");
  await page.getByRole("button", { name: "Bestand bearbeiten" }).click();
  await expect(
    page.getByRole("heading", { name: "Vorhandene Einträge ändern oder löschen" }),
  ).toBeVisible();
  await page
    .locator("summary")
    .filter({ hasText: /^Hinweise/ })
    .click();
  await expect(page.getByRole("button", { name: "Änderungen speichern" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Löschen" }).first()).toBeVisible();
});

test("Pflege-Unit zeigt das zentrale Kommunenprofil", async ({ page }) => {
  await page.goto("http://localhost:13001");
  await page.getByRole("button", { name: "Kommune" }).click();

  await expect(page.getByRole("heading", { name: "Kommune konfigurieren" })).toBeVisible();
  await expect(page.getByLabel("Name der Kommune")).not.toHaveValue("");
  await expect(page.getByLabel("Zuständige Meldestelle")).toHaveValue("Bürgerservice Abfall");
  await expect(page.getByRole("button", { name: "Regio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Stadtblau" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Kommunenprofil speichern" })).toBeVisible();
});

test("Pflege-Vorgänge bleiben bei 320 Pixeln innerhalb der Seite", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("http://localhost:13001");
  await page.getByRole("button", { name: "Vorgänge" }).click();
  await expect(page.getByRole("heading", { name: "Reklamationen und Aufträge" })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});
