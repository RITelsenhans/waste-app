import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildRepositoryFindings,
  evaluateDeclaredBaseline,
} from "../collect-technical-findings.mjs";

const baseline = {
  nodeMajor: 22,
  javaMajor: 21,
  nextVersion: "16.2.12",
  springBootVersion: "4.1.0",
  kotlinVersion: "2.4.10",
  maximumSecurityWorkflowAgeHours: 192,
};

test("erkennt eine konsistente deklarierte Softwarebaseline", () => {
  const result = evaluateDeclaredBaseline({
    baseline,
    rootPackage: { engines: { node: ">=22.13.0" } },
    webPackage: { dependencies: { next: "16.2.12" } },
    gradleBuild:
      'id("org.springframework.boot") version "4.1.0" apply false\nkotlin("jvm") version "2.4.10" apply false\nsourceCompatibility = JavaVersion.VERSION_21',
  });
  assert.equal(result.passed, true);
  assert.match(result.finding, /Java 21/);
});

test("trennt Securityfehler von normalen Updatehinweisen", () => {
  const findings = buildRepositoryFindings({
    auditOutcome: "success",
    baseline,
    declaredBaseline: { passed: true, finding: "Baseline passt." },
    dependabotAlerts: [],
    dependencyPullRequests: [
      { number: 17, title: "React aktualisieren" },
      { number: 18, title: "Playwright aktualisieren" },
    ],
    securityRuns: [{ conclusion: "success", updated_at: "2026-08-05T12:00:00Z" }],
    now: new Date("2026-08-05T18:00:00Z"),
  });
  assert.equal(findings.find((finding) => finding.id === "security-alerts")?.status, "passed");
  assert.equal(findings.find((finding) => finding.id === "dependency-updates")?.status, "warning");
  assert.match(
    findings.find((finding) => finding.id === "dependency-updates")?.details ?? "",
    /#17: React aktualisieren/,
  );
  assert.match(
    findings.find((finding) => finding.id === "dependency-updates")?.recommendation ?? "",
    /Changelog/,
  );
  assert.equal(findings.find((finding) => finding.id === "security-workflow")?.status, "passed");
});

test("macht hohe Advisories und fehlgeschlagene Audits rot", () => {
  const findings = buildRepositoryFindings({
    auditOutcome: "failure",
    baseline,
    declaredBaseline: { passed: false, finding: "Abweichung." },
    dependabotAlerts: [{ security_advisory: { severity: "critical" } }],
    dependencyPullRequests: [],
    securityRuns: [{ conclusion: "failure", updated_at: "2026-08-05T12:00:00Z" }],
  });
  assert.equal(findings.filter((finding) => finding.status === "failed").length, 4);
});
