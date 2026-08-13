import { expect, test, type Page, type TestInfo } from "@playwright/test";
import technicalBaseline from "../../../../tooling/quality-agent/technical-baseline.json";
import type { WebReleaseInfo } from "../../lib/release-info";
import { assessProductionRevision } from "../../lib/quality-monitoring";

type FindingStatus = "passed" | "warning" | "failed";

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
const productionRevision = assessProductionRevision(process.env.EXPECTED_PRODUCTION_REVISION);
const qualityAgentCredential = `DEMO-QA-${String(process.env.GITHUB_RUN_ID ?? Date.now())
  .replace(/[^A-Z0-9]/gi, "")
  .slice(-12)
  .toUpperCase()}`;

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
  if (!productionRevision.available) {
    findings.push({
      id: "monitor-configuration",
      title: "Prüfauftrag vollständig konfigurieren",
      area: "Monitoring",
      status: "warning",
      finding: productionRevision.finding,
      durationMs: 0,
    });
  }

  await record(
    testInfo,
    "login",
    "Zugriff",
    "Geschützte Demo öffnen",
    "Anmeldung, Sitzung und Weiterleitung nach /demo funktionieren.",
    () => login(page),
  );

  let webRelease: WebReleaseInfo | undefined;
  let webDeploymentFinding = "Die Vercel-Revision entspricht dem GitHub-Produktionsbranch.";
  await record(
    testInfo,
    "web-deployment",
    "Deployment",
    "Neuesten Web-Push nachweisen",
    () => webDeploymentFinding,
    async () => {
      const response = await page.request.get("/demo-auth/release");
      expect(response.ok()).toBeTruthy();
      webRelease = (await response.json()) as WebReleaseInfo;
      expect(webRelease.provider).toBe("vercel");
      expect(webRelease.branch).toBe(technicalBaseline.productionBranch);
      if (productionRevision.available) {
        expect(webRelease.commitSha).toBe(productionRevision.revision);
        webDeploymentFinding = `Vercel liefert Commit ${webRelease.commitSha.slice(0, 12)} aus ${webRelease.branch} aus.`;
      } else {
        webDeploymentFinding = `Vercel meldet Commit ${webRelease.commitSha.slice(0, 12)} aus ${webRelease.branch}; der Vergleich mit GitHub ist in diesem Lauf nicht verfügbar.`;
      }
    },
  );

  let webRuntimeFinding = "Die Web-Laufzeit entspricht der freigegebenen Baseline.";
  await record(
    testInfo,
    "web-runtime",
    "Laufzeit",
    "Web-Softwareversionen kontrollieren",
    () => webRuntimeFinding,
    async () => {
      expect(webRelease).toBeDefined();
      expect(Number(webRelease?.nodeVersion.split(".")[0])).toBe(technicalBaseline.nodeMajor);
      expect(webRelease?.nextVersion).toBe(technicalBaseline.nextVersion);
      webRuntimeFinding = `Node.js ${webRelease?.nodeVersion}, Next.js ${webRelease?.nextVersion}, App ${webRelease?.applicationVersion}.`;
    },
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
  let apiRelease:
    | {
        provider: string;
        commitSha: string;
        branch: string;
        applicationVersion: string;
        javaVersion: string;
        springBootVersion: string;
        kotlinVersion: string;
      }
    | undefined;
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
        release: NonNullable<typeof apiRelease>;
        statistics: {
          upcomingCollectionEvents: number;
          activeNotices: number;
          openCases: number;
          pendingOutboxEvents: number;
          failedOutboxEvents: number;
        };
      };
      apiRelease = result.release;
      const statistics = result.statistics;
      expect(statistics.failedOutboxEvents).toBeLessThanOrEqual(statistics.pendingOutboxEvents);
      statisticsFinding =
        `${statistics.upcomingCollectionEvents} künftige Termine, ` +
        `${statistics.activeNotices} aktive Hinweise, ${statistics.openCases} offene Vorgänge, ` +
        `${statistics.pendingOutboxEvents} offene/${statistics.failedOutboxEvents} fehlerhafte Zustellungen.`;
    },
  );

  let apiDeploymentFinding = "Die Railway-Revision entspricht dem GitHub-Produktionsbranch.";
  await record(
    testInfo,
    "api-deployment",
    "Deployment",
    "Neuesten API-Push nachweisen",
    () => apiDeploymentFinding,
    async () => {
      expect(apiRelease).toBeDefined();
      expect(apiRelease?.provider).toBe("railway");
      expect(apiRelease?.branch).toBe(technicalBaseline.productionBranch);
      if (productionRevision.available) {
        expect(apiRelease?.commitSha).toBe(productionRevision.revision);
        apiDeploymentFinding = `Railway liefert Commit ${apiRelease?.commitSha.slice(0, 12)} aus ${apiRelease?.branch} aus.`;
      } else {
        apiDeploymentFinding = `Railway meldet Commit ${apiRelease?.commitSha.slice(0, 12)} aus ${apiRelease?.branch}; der Vergleich mit GitHub ist in diesem Lauf nicht verfügbar.`;
      }
    },
  );

  let apiRuntimeFinding = "Die API-Laufzeit entspricht der freigegebenen Baseline.";
  await record(
    testInfo,
    "api-runtime",
    "Laufzeit",
    "API-Softwareversionen kontrollieren",
    () => apiRuntimeFinding,
    async () => {
      expect(apiRelease).toBeDefined();
      expect(Number(apiRelease?.javaVersion.split(".")[0])).toBe(technicalBaseline.javaMajor);
      expect(apiRelease?.springBootVersion).toBe(technicalBaseline.springBootVersion);
      expect(apiRelease?.kotlinVersion).toBe(technicalBaseline.kotlinVersion);
      apiRuntimeFinding = `Java ${apiRelease?.javaVersion}, Spring Boot ${apiRelease?.springBootVersion}, Kotlin ${apiRelease?.kotlinVersion}, API ${apiRelease?.applicationVersion}.`;
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
    "Die Pilotkommune Aachen liefert auswählbare synthetische Abholadressen.",
    async () => {
      await page.goto("/demo", { waitUntil: "domcontentloaded" });
      await page.getByLabel("Straße, Hausnummer, Ort oder Postleitzahl").fill("Aachen");
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
      await page.goto("/demo/abfall-abc", { waitUntil: "domcontentloaded" });
      await page.getByLabel("Gegenstand", { exact: true }).first().fill("Akku");
      await page.getByRole("button", { name: "Suchen" }).click();
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
      await page.goto("/demo/services/sortierkompass", { waitUntil: "domcontentloaded" });
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
      await page.goto("/demo/standorte", { waitUntil: "domcontentloaded" });
      await expect(page.locator("#standorte .site-card").first()).toBeVisible();
      await expect(page.getByTitle(/Karte für/)).toBeVisible();
    },
  );

  await record(
    testInfo,
    "forms",
    "Soll-Workflows",
    "Schreibende Wege sicher bereitstellen",
    "Mängel- und Sperrmüllformular sind bedienbar; deren produktive Übertragung bleibt bewusst deaktiviert.",
    async () => {
      await page.goto("/demo/services/maengel/new", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("button", { name: "Meldung absenden" })).toBeEnabled();
      await page.goto("/demo/services/sperrmuell/new", { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("button", { name: "Verbindlich im Demo-System bestellen" }),
      ).toBeVisible();
      await page.goto("/demo/services/recyclinghof-24-7", { waitUntil: "domcontentloaded" });
      const access = page.locator("#nachtzugang");
      await expect(access.getByText("Hardware-Simulation.")).toBeVisible();
      await expect(access.getByText("Schranke geschlossen", { exact: true })).toBeVisible();
      await expect(access.locator(".journey-card")).toHaveCount(4);
    },
  );

  let accessFinding = "Der synthetische 24/7-Zugang wurde vollständig geprüft und bereinigt.";
  await record(
    testInfo,
    "recycling-access-e2e",
    "Soll-Workflow",
    "24/7-Zugang buchen, durchlaufen und bereinigen",
    () => accessFinding,
    async () => {
      await page.goto("/demo/services/recyclinghof-24-7", { waitUntil: "domcontentloaded" });
      const token = process.env.MONITORING_API_TOKEN;
      if (!token) throw new Error("GitHub-Secret MONITORING_API_TOKEN fehlt.");
      const access = page.locator("#nachtzugang");
      let reference: string | undefined;
      let primaryError: unknown;
      let cleanupError: unknown;
      try {
        await access.getByLabel("Demo-Kennzeichen").fill(qualityAgentCredential);
        await access.getByLabel("Ich verwende ausschließlich synthetische Testdaten.").check();
        await access.getByRole("button", { name: "Zugang verbindlich simulieren" }).click();
        const status = access.locator(".gate-message");
        await expect(status).toContainText(/Zugang DEMO-Z-[A-F0-9]{12} ist ausgestellt/);
        reference = (await status.innerText()).match(/DEMO-Z-[A-F0-9]{12}/)?.[0];
        expect(reference, "Die Oberfläche zeigt keine Vorgangsreferenz an.").toMatch(
          /^DEMO-Z-[A-F0-9]{12}$/,
        );

        for (const action of [
          "Ankunft jetzt scannen",
          "Einfahrt jetzt bestätigen",
          "Ausfahrt jetzt freigeben",
          "Ausfahrt jetzt abschließen",
        ]) {
          await access.getByRole("button", { name: action }).click();
        }
        await expect(access.getByText("Besuch abgeschlossen", { exact: true })).toBeVisible();
        await expect(status).toContainText("Ausfahrt abgeschlossen – Schranke geschlossen.");
      } catch (error) {
        primaryError = error;
      } finally {
        if (reference) {
          try {
            const cleanup = await page.request.post(
              "/v1/monitoring/quality-agent/recycling-access-cleanup",
              {
                headers: { "X-Monitoring-Token": token },
                data: { reference, syntheticCredential: qualityAgentCredential },
              },
            );
            expect(cleanup.ok()).toBeTruthy();
            const result = (await cleanup.json()) as {
              status: "completed" | "disabled" | "blocked";
              deletedTotal: number;
              deletedRequests: number;
            };
            expect(result.status).toBe("completed");
            expect(result.deletedRequests).toBe(1);
            accessFinding =
              `${reference} vollständig bis zur geschlossenen Ausfahrt geprüft; ` +
              `${result.deletedTotal} ausschließlich zugehörige synthetische Datensätze entfernt.`;
          } catch (error) {
            cleanupError = error;
          }
        }
      }
      if (primaryError) throw primaryError;
      if (cleanupError) throw cleanupError;
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
      await page.goto("/demo", { waitUntil: "domcontentloaded" });
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
        mode: "safe-synthetic-write-and-maintenance-live",
        findings,
      },
      null,
      2,
    ),
  );
});
