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
  });
  assert.equal(report.overallStatus, "failed");
  assert.deepEqual(report.statistics, { total: 2, passed: 1, failed: 1, durationMs: 970 });
  assert.equal(report.revision, "1234567890ab");
});

test("erzeugt einen selbstständigen HTML-Zeitstrahl ohne Fremdressourcen", () => {
  const html = renderHtml(buildQualityReport(input, {}));
  assert.match(html, /setInterval/);
  assert.match(html, /Automatischer Prüfablauf/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /Vergangener Termin &lt;gefunden&gt;\./);
  assert.doesNotMatch(html, /https:\/\/cdn\.|<script\s+src=/);
});

test("erzeugt eine kompakte GitHub-Zusammenfassung", () => {
  const markdown = renderMarkdown(buildQualityReport(input, {}));
  assert.match(markdown, /1\/2 erfolgreich/);
  assert.match(markdown, /❌/);
  assert.match(markdown, /quality-agent-report/);
});
