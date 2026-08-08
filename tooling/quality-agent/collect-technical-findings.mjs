import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(moduleDirectory, "../..");

export function evaluateDeclaredBaseline({ baseline, rootPackage, webPackage, gradleBuild }) {
  const checks = [
    webPackage.dependencies?.next === baseline.nextVersion,
    new RegExp(
      `org\\.springframework\\.boot\"\\) version \"${escapeRegExp(baseline.springBootVersion)}\"`,
    ).test(gradleBuild),
    new RegExp(`kotlin\\(\"jvm\"\\) version \"${escapeRegExp(baseline.kotlinVersion)}\"`).test(
      gradleBuild,
    ),
    new RegExp(`JavaVersion\\.VERSION_${baseline.javaMajor}`).test(gradleBuild),
    rootPackage.engines?.node?.includes(String(baseline.nodeMajor)),
    webPackage.engines?.node === rootPackage.engines?.node,
  ];
  return {
    passed: checks.every(Boolean),
    finding:
      `Deklariert: Node.js Root ${rootPackage.engines?.node ?? "unbekannt"}, ` +
      `Web ${webPackage.engines?.node ?? "unbekannt"}, ` +
      `Next.js ${webPackage.dependencies?.next ?? "unbekannt"}, Spring Boot ${baseline.springBootVersion}, ` +
      `Kotlin ${baseline.kotlinVersion}, Java ${baseline.javaMajor}.`,
  };
}

export function buildRepositoryFindings({
  auditOutcome,
  baseline,
  declaredBaseline,
  dependabotAlerts,
  dependencyPullRequests,
  securityRuns,
  repositoryUrl = "",
  now = new Date(),
}) {
  const findings = [
    {
      id: "declared-baseline",
      title: "Freigegebene Softwarebaseline abgleichen",
      area: "Versionen",
      status: declaredBaseline.passed ? "passed" : "failed",
      finding: declaredBaseline.passed
        ? declaredBaseline.finding
        : `Versionsdeklarationen weichen von der technischen Baseline ab. ${declaredBaseline.finding}`,
      evidenceUrl: repositoryUrl
        ? `${repositoryUrl}/blob/HEAD/tooling/quality-agent/technical-baseline.json`
        : "",
      durationMs: 0,
    },
    {
      id: "dependency-audit",
      title: "JavaScript-Abhängigkeiten auf Advisories prüfen",
      area: "Security",
      status: auditOutcome === "success" ? "passed" : auditOutcome ? "failed" : "warning",
      finding:
        auditOutcome === "success"
          ? "pnpm audit meldet keine bekannten Advisories ab Schweregrad high."
          : auditOutcome
            ? "pnpm audit hat mindestens ein Advisory ab Schweregrad high gemeldet."
            : "Das Ergebnis von pnpm audit war nicht verfügbar.",
      durationMs: 0,
    },
  ];

  if (dependabotAlerts instanceof Error) {
    findings.push(
      unavailable(
        "security-alerts",
        "Security",
        "GitHub-Sicherheitswarnungen lesen",
        dependabotAlerts,
      ),
    );
  } else {
    const highOrCritical = dependabotAlerts.filter((alert) =>
      ["high", "critical"].includes(alert.security_advisory?.severity),
    );
    findings.push({
      id: "security-alerts",
      title: "Offene hohe Sicherheitswarnungen kontrollieren",
      area: "Security",
      status: highOrCritical.length === 0 ? "passed" : "failed",
      finding:
        highOrCritical.length === 0
          ? "GitHub Dependabot meldet keine offenen hohen oder kritischen Sicherheitswarnungen."
          : `GitHub Dependabot meldet ${highOrCritical.length} offene hohe oder kritische Sicherheitswarnungen.`,
      durationMs: 0,
      evidenceUrl: repositoryUrl ? `${repositoryUrl}/security/dependabot` : "",
    });
  }

  if (securityRuns instanceof Error) {
    findings.push(
      unavailable(
        "security-workflow",
        "Security",
        "Letzten Security-Lauf kontrollieren",
        securityRuns,
      ),
    );
  } else {
    const run = securityRuns[0];
    const ageHours = run?.updated_at
      ? Math.max(0, (now.getTime() - new Date(run.updated_at).getTime()) / 3_600_000)
      : Number.POSITIVE_INFINITY;
    const successful = run?.conclusion === "success";
    const recent = ageHours <= baseline.maximumSecurityWorkflowAgeHours;
    const roundedAgeHours = Math.round(ageHours);
    const formattedAge = `${roundedAgeHours} ${roundedAgeHours === 1 ? "Stunde" : "Stunden"}`;
    findings.push({
      id: "security-workflow",
      title: "Letzten CodeQL- und Security-Lauf kontrollieren",
      area: "Security",
      status: !successful ? "failed" : recent ? "passed" : "warning",
      finding: !run
        ? "GitHub liefert keinen abgeschlossenen Security-Lauf."
        : !successful
          ? `Der letzte Security-Lauf endete mit ${run.conclusion ?? "unbekannt"}.`
          : recent
            ? `Der letzte Security-Lauf war erfolgreich und ist ${formattedAge} alt.`
            : `Der letzte erfolgreiche Security-Lauf ist mit ${formattedAge} älter als die erlaubten ${baseline.maximumSecurityWorkflowAgeHours} Stunden.`,
      durationMs: 0,
      evidenceUrl:
        run?.html_url ?? (repositoryUrl ? `${repositoryUrl}/actions/workflows/security.yml` : ""),
    });
  }

  if (dependencyPullRequests instanceof Error) {
    findings.push(
      unavailable(
        "dependency-updates",
        "Updates",
        "Verfügbare Softwareupdates sichten",
        dependencyPullRequests,
      ),
    );
  } else {
    const updateDetails = dependencyPullRequests
      .map((pull) => `#${pull.number}: ${pull.title ?? "Update ohne Titel"}`)
      .join(" · ");
    findings.push({
      id: "dependency-updates",
      title: "Verfügbare Softwareupdates sichten",
      area: "Updates",
      status: dependencyPullRequests.length === 0 ? "passed" : "warning",
      finding:
        dependencyPullRequests.length === 0
          ? "Dependabot hat derzeit kein reguläres Softwareupdate offen."
          : `${dependencyPullRequests.length} reguläre Dependabot-Updates warten auf Prüfung; sie sind nicht automatisch Sicherheitslücken.`,
      details:
        dependencyPullRequests.length === 0
          ? "Die GitHub-API liefert derzeit keinen offenen Pull Request von dependabot[bot]."
          : `Tatsächlich offene Update-PRs: ${updateDetails}`,
      recommendation:
        dependencyPullRequests.length === 0
          ? "Keine Korrektur erforderlich; beim nächsten Lauf erneut prüfen."
          : "Jeden PR einzeln öffnen, Changelog, Lizenzwirkung und grüne CI-Prüfungen kontrollieren. Kompatible Updates anschließend reviewen und mergen.",
      evidenceUrl: repositoryUrl
        ? `${repositoryUrl}/pulls?q=is%3Apr+is%3Aopen+author%3Aapp%2Fdependabot`
        : (dependencyPullRequests[0]?.html_url ?? ""),
      durationMs: 0,
    });
  }

  return findings;
}

async function githubJson(path, environment) {
  const repository = environment.GITHUB_REPOSITORY;
  const token = environment.GITHUB_TOKEN;
  if (!repository || !token) throw new Error("GitHub-Kontext oder Token fehlt.");
  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "waste-app-quality-agent",
    },
  });
  if (!response.ok) throw new Error(`GitHub API antwortet mit HTTP ${response.status}.`);
  return response.json();
}

async function safeGithub(path, environment, select = (value) => value) {
  try {
    return select(await githubJson(path, environment));
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

async function main(environment = process.env) {
  const input = resolve(repositoryRoot, "build/quality-agent/live-findings.json");
  const [liveReport, baseline, rootPackage, webPackage, rootGradleBuild, apiGradleBuild] =
    await Promise.all([
      readJson(input),
      readJson(resolve(moduleDirectory, "technical-baseline.json")),
      readJson(resolve(repositoryRoot, "package.json")),
      readJson(resolve(repositoryRoot, "apps/web/package.json")),
      readFile(resolve(repositoryRoot, "build.gradle.kts"), "utf8"),
      readFile(resolve(repositoryRoot, "services/api/build.gradle.kts"), "utf8"),
    ]);
  const [dependabotAlerts, dependencyPullRequests, securityRuns] = await Promise.all([
    safeGithub("/dependabot/alerts?state=open&per_page=100", environment),
    safeGithub("/pulls?state=open&per_page=100", environment, (pulls) =>
      pulls.filter((pull) => pull.user?.login === "dependabot[bot]"),
    ),
    safeGithub(
      "/actions/workflows/security.yml/runs?branch=main&status=completed&per_page=1",
      environment,
      (result) => result.workflow_runs ?? [],
    ),
  ]);
  const declaredBaseline = evaluateDeclaredBaseline({
    baseline,
    rootPackage,
    webPackage,
    gradleBuild: `${rootGradleBuild}\n${apiGradleBuild}`,
  });
  const technicalFindings = buildRepositoryFindings({
    auditOutcome: environment.DEPENDENCY_AUDIT_OUTCOME,
    baseline,
    declaredBaseline,
    dependabotAlerts,
    dependencyPullRequests,
    securityRuns,
    repositoryUrl: environment.GITHUB_REPOSITORY
      ? `https://github.com/${environment.GITHUB_REPOSITORY}`
      : "",
  });
  await writeFile(
    input,
    JSON.stringify(
      { ...liveReport, findings: [...(liveReport.findings ?? []), ...technicalFindings] },
      null,
      2,
    ),
  );
}

function unavailable(id, area, title, error) {
  return {
    id,
    area,
    title,
    status: "warning",
    finding: `Prüfung nicht verfügbar: ${error.message}`,
    durationMs: 0,
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
