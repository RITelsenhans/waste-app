import assert from "node:assert/strict";
import { test } from "node:test";
import { buildQualityReport, renderHtml, renderMarkdown } from "../generate-report.mjs";

const input = {
  generatedAt: "2026-08-05T05:30:00Z",
  target: "https://example.invalid/demo",
  mode: "read-only-live",
  findings: [
    {
      id: "ready",
      area: "Betrieb",
      title: "API prüfen",
      status: "passed",
      finding: "API ist bereit.",
      durationMs: 120,
    },
    {
      id: "calendar",
      area: "Termine",
      title: "Datum prüfen",
      status: "failed",
      finding: "Vergangener Termin <gefunden>.",
      durationMs: 850,
    },
  ],
};

test("aggregiert Status und Laufstatistik deterministisch", () => {
  const report = buildQualityReport(input, {
    GITHUB_SHA: "1234567890abcdef",
    GITHUB_RUN_NUMBER: "9",
    QUALITY_REPORT_BRANCH: "feat/produktion",
    QUALITY_REPORT_REVISION: "abcdef1234567890",
    QUALITY_WORKFLOW_BRANCH: "main",
  });
  assert.equal(report.overallStatus, "failed");
  assert.deepEqual(report.statistics, {
    total: 2,
    passed: 1,
    warnings: 0,
    failed: 1,
    durationMs: 970,
  });
  assert.equal(report.revision, "abcdef123456");
  assert.equal(report.productionBranch, "feat/produktion");
  assert.equal(report.workflowBranch, "main");
  assert.equal(report.findings[0].actionLabel, "Keine Maßnahme");
  assert.equal(report.findings[1].deadline, "Sofort – heute");
});

test("erzeugt einen selbstständigen HTML-Zeitstrahl ohne Fremdressourcen", () => {
  const html = renderHtml(buildQualityReport(input, {}));
  assert.doesNotMatch(html, /setInterval/);
  assert.match(html, /Live-Prüfbühne/);
  assert.match(html, /Der Prüfer ist unterwegs/);
  assert.match(html, /class="inspector"/);
  assert.match(html, /class="station"/);
  assert.match(html, /class="results-rail"/);
  assert.match(html, /Findings im Rundgang/);
  assert.match(html, /class="result-item result-item--failed"/);
  assert.match(html, /resultItems\[index\]\.classList\.add\('is-revealed'\)/);
  assert.match(html, /function showCompletion\(\)/);
  assert.match(html, /Prüflauf erneut ansehen/);
  assert.match(html, /Was ist jetzt zu tun\?/);
  assert.match(html, /Zeitfenster: Sofort – heute/);
  assert.match(html, /Ergebnis bleibt stehen/);
  assert.match(html, /Workflow-Quelle lokaler Start/);
  assert.match(html, /Produktion lokaler Stand/);
  assert.match(html, /data-result="✓"><\/span>/);
  assert.doesNotMatch(html, /class="station__dot">✓/);
  assert.match(html, /Prüflauf 05\.08\.2026, 07:30 MESZ/);
  assert.match(html, /Details &amp; Lösung/);
  assert.match(html, /Was wurde wirklich geprüft\?/);
  assert.match(html, /Wie lässt sich der Befund korrigieren\?/);
  assert.match(html, /Empfohlenes Zeitfenster/);
  assert.match(html, /height:100dvh/);
  assert.match(html, /html,body \{ width:100%; height:100%; overflow:hidden; \}/);
  assert.doesNotMatch(html, /class="panel details"/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /Vergangener Termin \\u003cgefunden>\./);
  assert.doesNotMatch(html, /https:\/\/cdn\.|<script\s+src=/);
});

test("behandelt Updatehinweise gelb statt als Fehler", () => {
  const warningReport = buildQualityReport(
    {
      ...input,
      findings: [
        {
          ...input.findings[0],
          id: "dependency-updates",
          status: "warning",
          finding: "Update verfügbar.",
        },
      ],
    },
    {},
  );
  assert.equal(warningReport.overallStatus, "warning");
  assert.equal(warningReport.statistics.warnings, 1);
  assert.equal(warningReport.findings[0].actionLabel, "Update einplanen");
  assert.equal(warningReport.findings[0].deadline, "Innerhalb 14 Kalendertagen");
  assert.match(renderMarkdown(warningReport), /⚠️ Hinweise vorhanden/);
});

test("kennzeichnet einen nicht lesbaren Security-Nachweis als kurzfristige Prüfaufgabe", () => {
  const report = buildQualityReport(
    {
      ...input,
      findings: [
        {
          ...input.findings[0],
          id: "security-alerts",
          status: "warning",
          finding: "Prüfung nicht verfügbar: GitHub API antwortet mit HTTP 403.",
        },
      ],
    },
    {},
  );
  assert.equal(report.findings[0].deadline, "Innerhalb 1 Arbeitstags");
  assert.match(report.findings[0].action, /GitHub-API-Zugriff/);
  assert.doesNotMatch(report.findings[0].action, /betroffene Abhängigkeit aktualisieren/);
});

test("erzeugt eine kompakte GitHub-Zusammenfassung", () => {
  const markdown = renderMarkdown(buildQualityReport(input, {}));
  assert.match(markdown, /1\/2 erfolgreich/);
  assert.match(markdown, /❌/);
  assert.match(markdown, /Workflow-Quelle: `lokaler Start`/);
  assert.match(markdown, /Geprüfte Produktion: `lokaler Stand`/);
  assert.match(markdown, /direkt anklickbares Workflow-Artefakt `quality-agent-report`/);
});
