import { expect, test, type Page, type TestInfo } from "@playwright/test";

type FindingStatus = "passed" | "failed";

type Finding = {
  id: string;
  title: string;
  area: string;
  status: FindingStatus;
  finding: string;
  durationMs: number;
};

const findings: Finding[] = [];
const password = process.env.DEMO_MONITOR_PASSWORD;

async function record(
  testInfo: TestInfo,
  id: string,
  area: string,
  title: string,
  successFinding: string | (() => string),
  check: () => Promise<void>,
) {
  const started = Date.now();
  try {
    await check();
    findings.push({
      id,
      title,
      area,
      status: "passed",
      finding: typeof successFinding === "function" ? successFinding() : successFinding,
      durationMs: Date.now() - started,
    });
  } catch (error) {
    findings.push({
      id,
      title,
      area,
      status: "failed",
      finding: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started,
    });
    await testInfo.attach(`Fehler-${id}`, {
      body: Buffer.from(error instanceof Error ? (error.stack ?? error.message) : String(error)),
      contentType: "text/plain",
    });
  }
}

async function login(page: Page) {
  if (!password) throw new Error("GitHub-Secret DEMO_MONITOR_PASSWORD fehlt.");
  await page.goto("/login?returnTo=%2Fdemo", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Demo öffnen" }).click();
  await page.waitForURL(/\/demo(?:$|[?#])/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

test("prüft die veröffentlichte Bürgeranwendung und begrenzte technische Wartung", async ({
  page,
}, testInfo) => {
  await record(
    testInfo,
    "login",
    "Zugriff",
    "Geschützte Demo öffnen",
    "Anmeldung, Sitzung und Weiterleitung nach /demo funktionieren.",
    () => login(page),
  );

  let maintenanceFinding = "Die technische Wartung wurde ausgeführt.";
  await record(
    testInfo,
    "maintenance",
    "Datenpflege",
    "Technische Alt-Daten begrenzt bereinigen",
    () => maintenanceFinding,
    async () => {
      const token = process.env.MONITORING_API_TOKEN;
      if (!token) throw new Error("GitHub-Secret MONITORING_API_TOKEN fehlt.");
      const response = await page.request.post("/v1/monitoring/maintenance", {
        headers: { "X-Monitoring-Token": token },
      });
      expect(response.ok()).toBeTruthy();
      const result = (await response.json()) as {
        status: "completed" | "disabled" | "blocked";
        deletedTotal: number;
        candidateCount: number;
        finding: string;
      };
      expect(result.status).toBe("completed");
      maintenanceFinding = `${result.finding} Kandidaten vor dem Lauf: ${result.candidateCount}.`;
    },
  );

  let statisticsFinding = "Aggregierte Statistik wurde gelesen.";
  await record(
    testInfo,
    "statistics",
    "Statistik",
    "Aggregierte Betriebszahlen erfassen",
    () => statisticsFinding,
    async () => {
      const token = process.env.MONITORING_API_TOKEN;
      if (!token) throw new Error("GitHub-Secret MONITORING_API_TOKEN fehlt.");
      const response = await page.request.get("/v1/monitoring/summary", {
        headers: { "X-Monitoring-Token": token },
      });
      expect(response.ok()).toBeTruthy();
      const result = (await response.json()) as {
        statistics: {
          upcomingCollectionEvents: number;
          activeNotices: number;
          openCases: number;
          pendingOutboxEvents: number;
          failedOutboxEvents: number;
        };
      };
      const statistics = result.statistics;
      expect(statistics.failedOutboxEvents).toBeLessThanOrEqual(statistics.pendingOutboxEvents);
      statisticsFinding =
        `${statistics.upcomingCollectionEvents} künftige Termine, ` +
        `${statistics.activeNotices} aktive Hinweise, ${statistics.openCases} offene Vorgänge, ` +
        `${statistics.pendingOutboxEvents} offene/${statistics.failedOutboxEvents} fehlerhafte Zustellungen.`;
    },
  );

  await record(
    testInfo,
    "readiness",
    "Betrieb",
    "Web und API erreichen",
    "Die über Vercel weitergeleitete Railway-API meldet ready.",
    async () => {
      const response = await page.request.get("/v1/health/ready");
      expect(response.ok()).toBeTruthy();
      await expect.poll(async () => (await response.json()).status).toBe("ready");
    },
  );

  await record(
    testInfo,
    "dates",
    "Termine",
    "Nächste Abholung plausibilisieren",
    "Alle gelieferten Abholtermine liegen am aktuellen oder einem späteren Berliner Kalendertag.",
    async () => {
      const response = await page.request.get(
        "/v1/addresses/demo-musterstrasse-12/collections?tenantId=demo",
      );
      expect(response.ok()).toBeTruthy();
      const collections = (await response.json()) as Array<{ effectiveDate: string }>;
      expect(collections.length).toBeGreaterThan(0);
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      expect(collections.every((item) => item.effectiveDate >= today)).toBeTruthy();
    },
  );

  await record(
    testInfo,
    "address",
    "Adresse",
    "Adresssuche ausführen",
    "Die Demo-Stadt liefert auswählbare Abholadressen.",
    async () => {
      await page.getByLabel("Straße, Hausnummer, Ort oder Postleitzahl").fill("Demo-Stadt");
      await page.getByRole("button", { name: "Suchen" }).first().click();
      await expect(page.locator(".result-button").first()).toBeVisible();
    },
  );

  await record(
    testInfo,
    "waste-guide",
    "Abfall-ABC",
    "Entsorgungsweg suchen",
    "Die Suche ordnet Akku dem Eintrag Batterien zu.",
    async () => {
      await page.getByLabel("Gegenstand", { exact: true }).first().fill("Akku");
      await page.getByRole("button", { name: "Suchen" }).last().click();
      await expect(page.getByRole("heading", { name: "Batterien" })).toBeVisible();
    },
  );

  await record(
    testInfo,
    "sorting",
    "SortierKompass",
    "Beispielfoto zuordnen",
    "Der synthetische Toaster wird transparent als Elektrogerät eingeordnet.",
    async () => {
      const sorter = page.locator("#sortierkompass");
      await sorter.getByRole("button", { name: "Beispielfoto prüfen" }).click();
      await expect(sorter.getByText("Beispiel zugeordnet")).toBeVisible();
      await expect(sorter.getByRole("heading", { name: "Elektrogeräte" })).toBeVisible();
    },
  );

  await record(
    testInfo,
    "sites",
    "Standorte",
    "Recyclinghof anzeigen",
    "Standortliste und Kartenbereich werden geladen.",
    async () => {
      await expect(page.locator("#standorte .site-card").first()).toBeVisible();
      await expect(page.getByTitle(/Karte für/)).toBeVisible();
    },
  );

  await record(
    testInfo,
    "forms",
    "Soll-Workflows",
    "Schreibende Wege sicher bereitstellen",
    "Mängel-, Sperrmüll- und 24/7-Formular sind bedienbar; der Live-Agent sendet bewusst nichts ab.",
    async () => {
      await expect(page.getByRole("button", { name: "Meldung absenden" })).toBeEnabled();
      await expect(
        page.getByRole("button", { name: "Verbindlich im Demo-System bestellen" }),
      ).toBeVisible();
      const access = page.locator("#nachtzugang");
      await expect(access.getByText("Hardware-Simulation.")).toBeVisible();
      await expect(access.getByText("Schranke geschlossen", { exact: true })).toBeVisible();
      await expect(access.locator(".journey-card")).toHaveCount(4);
    },
  );

  await record(
    testInfo,
    "mobile",
    "Darstellung",
    "Mobile Breite kontrollieren",
    "Bei 320 Pixeln entsteht kein horizontaler Seitenüberlauf.",
    async () => {
      await page.setViewportSize({ width: 320, height: 720 });
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
      await expect(page.getByRole("navigation", { name: "Mobile Hauptnavigation" })).toBeVisible();
    },
  );

  await testInfo.attach("quality-findings", {
    body: Buffer.from(JSON.stringify(findings, null, 2)),
    contentType: "application/json",
  });

  expect(
    findings.filter((finding) => finding.status === "failed"),
    "Mindestens ein Live-Prüfschritt ist fehlgeschlagen.",
  ).toEqual([]);
});

test.afterAll(async () => {
  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir("build/quality-agent", { recursive: true });
  await writeFile(
    "build/quality-agent/live-findings.json",
    JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        target: process.env.MONITOR_BASE_URL ?? "https://waste-app-web.vercel.app",
        mode: "safe-maintenance-and-read-only-live",
        findings,
      },
      null,
      2,
    ),
  );
});
