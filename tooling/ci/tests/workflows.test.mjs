import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const workflowNames = ["ci.yml", "dependency-review.yml", "quality-agent.yml", "security.yml"];

async function readRepositoryFile(path) {
  return readFile(resolve(repositoryRoot, path), "utf8");
}

test("all external actions are pinned to immutable commit SHAs", async () => {
  for (const workflowName of workflowNames) {
    const workflow = await readRepositoryFile(`.github/workflows/${workflowName}`);
    const actionReferences = [...workflow.matchAll(/^\s*uses:\s*(\S+)\s*(?:#.*)?$/gm)].map(
      ([, reference]) => reference,
    );

    assert.ok(actionReferences.length > 0, `${workflowName} enthält keine Action-Referenz.`);
    for (const reference of actionReferences) {
      assert.match(
        reference,
        /^[^@\s]+@[0-9a-f]{40}$/,
        `${workflowName}: ${reference} ist nicht auf einen vollständigen Commit gepinnt.`,
      );
    }
  }
});

test("workflows use least privilege and never pull_request_target", async () => {
  for (const workflowName of workflowNames) {
    const workflow = await readRepositoryFile(`.github/workflows/${workflowName}`);

    if (workflowName === "quality-agent.yml") {
      assert.match(
        workflow,
        /^permissions:\n  actions: read\n  contents: read\n  pull-requests: read\n  security-events: read$/m,
      );
    } else {
      assert.match(workflow, /^permissions:\n  contents: read$/m);
    }
    assert.doesNotMatch(workflow, /pull_request_target/);
  }
});

test("quality workflow contains every documented root gate", async () => {
  const workflow = await readRepositoryFile(".github/workflows/ci.yml");

  for (const command of [
    "pnpm install --frozen-lockfile",
    "pnpm format:check",
    "pnpm lint",
    "pnpm typecheck",
    "pnpm test",
    "pnpm exec playwright install --with-deps chromium",
    "pnpm test:browser",
    "pnpm build",
  ]) {
    assert.match(workflow, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("security workflow and dependency policy enforce the agreed baseline", async () => {
  const securityWorkflow = await readRepositoryFile(".github/workflows/security.yml");
  const dependencyWorkflow = await readRepositoryFile(".github/workflows/dependency-review.yml");
  const dependencyPolicy = await readRepositoryFile(".github/dependency-review-config.yml");

  assert.match(securityWorkflow, /pnpm security:audit/);
  assert.match(securityWorkflow, /languages: javascript-typescript,java-kotlin/);
  assert.match(securityWorkflow, /security-events: write/);
  assert.match(dependencyWorkflow, /dependency-review-action@[0-9a-f]{40}/);
  assert.match(dependencyPolicy, /fail-on-severity: high/);
  assert.match(dependencyPolicy, /AGPL-3\.0-only/);
  assert.match(dependencyPolicy, /GPL-3\.0-only/);
});

test("locked dependencies retain the dependency audit security fixes", async () => {
  const lockfile = await readRepositoryFile("pnpm-lock.yaml");
  const minimumVersions = {
    next: "16.4.1",
    "eslint-config-next": "16.4.1",
    "brace-expansion": "5.0.12",
    "js-yaml": "4.3.2",
    nanoid: "3.3.18",
    sharp: "0.35.5",
    "source-map-js": "1.2.2",
    vite: "8.1.6",
    zod: "4.6.6",
  };

  for (const [dependency, minimum] of Object.entries(minimumVersions)) {
    const versions = [
      ...lockfile.matchAll(new RegExp(`^  ${dependency}@(\\d+\\.\\d+\\.\\d+):$`, "gm")),
    ];
    assert.ok(versions.length > 0, `${dependency} fehlt im Lockfile.`);
    for (const [, version] of versions) {
      assert.ok(
        version.localeCompare(minimum, "en", { numeric: true }) >= 0,
        `${dependency}@${version} benötigt mindestens ${minimum}.`,
      );
    }
  }

  const web = JSON.parse(await readRepositoryFile("apps/web/package.json"));
  const admin = JSON.parse(await readRepositoryFile("apps/admin/package.json"));
  const eslint = JSON.parse(await readRepositoryFile("packages/eslint-config/package.json"));
  const root = JSON.parse(await readRepositoryFile("package.json"));
  const baseline = JSON.parse(
    await readRepositoryFile("tooling/quality-agent/technical-baseline.json"),
  );
  assert.equal(web.dependencies.next, admin.dependencies.next);
  assert.equal(web.dependencies.next, eslint.dependencies["eslint-config-next"]);
  assert.equal(web.dependencies.next, baseline.nextVersion);
  assert.equal(root.scripts["security:audit"], "pnpm audit --audit-level high");
});

test("Dependabot covers npm, Gradle and GitHub Actions", async () => {
  const dependabot = await readRepositoryFile(".github/dependabot.yml");

  for (const ecosystem of ["npm", "gradle", "github-actions"]) {
    assert.match(dependabot, new RegExp(`package-ecosystem: ${ecosystem}`));
  }
});

test("Dependabot coordinates Kotlin plugins and defers incompatible version updates", async () => {
  const dependabot = await readRepositoryFile(".github/dependabot.yml");

  assert.match(
    dependabot,
    /kotlin-plugins:\n\s+applies-to: version-updates\n\s+patterns:\n\s+- jvm\n\s+- plugin\.spring/,
  );

  for (const [dependency, updateType] of [
    ["@types/node", "version-update:semver-major"],
    ["typescript", "version-update:semver-major"],
    ["eslint", "version-update:semver-major"],
    ["@hey-api/openapi-ts", "version-update:semver-minor"],
  ]) {
    const escapedDependency = dependency.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      dependabot,
      new RegExp(
        `dependency-name: "?${escapedDependency}"?\\n\\s+update-types:\\n\\s+- ${updateType}`,
      ),
    );
  }
});

test("Codespaces shares only the protected web port and pins its data service", async () => {
  const configuration = JSON.parse(await readRepositoryFile(".devcontainer/devcontainer.json"));
  const compose = await readRepositoryFile(".devcontainer/compose.yml");
  const packageManifest = JSON.parse(await readRepositoryFile("package.json"));

  assert.deepEqual(configuration.forwardPorts, [3000]);
  for (const port of ["3001", "8080", "55432", "8025"]) {
    assert.equal(configuration.portsAttributes[port].onAutoForward, "ignore");
  }
  assert.doesNotMatch(compose, /^\s+ports:/m);
  assert.match(compose, /postgres:17\.10-bookworm@sha256:[0-9a-f]{64}/);
  assert.equal(packageManifest.scripts["dev:codespace"], "node tooling/scripts/codespace-dev.mjs");
  assert.equal(configuration.postCreateCommand, "corepack pnpm install --frozen-lockfile");

  const codespaceStart = await readRepositoryFile("tooling/scripts/codespace-dev.mjs");
  assert.match(codespaceStart, /"install", "--frozen-lockfile"/);
  assert.match(
    codespaceStart,
    /API_READY_TIMEOUT_MS: process\.env\.API_READY_TIMEOUT_MS \?\? "600000"/,
  );
  assert.match(codespaceStart, /DEMO_PUBLIC_ORIGIN:/);
  assert.match(codespaceStart, /`https:\/\/\$\{codespaceName\}-\$\{webPort\}\.app\.github\.dev`/);

  const localStart = await readRepositoryFile("tooling/scripts/dev.mjs");
  assert.match(localStart, /readPositiveInteger\("API_READY_TIMEOUT_MS", 120_000\)/);
});

test("CI uses a digest-pinned Mailpit service for the existing mail browser test", async () => {
  const workflow = await readRepositoryFile(".github/workflows/ci.yml");
  assert.match(workflow, /axllent\/mailpit:v1\.30\.6@sha256:[0-9a-f]{64}/);
  assert.match(workflow, /MAILPIT_EXTERNAL_URL: http:\/\/127\.0\.0\.1:18025/);
});

test("quality agent is read-only for GitHub and publishes an animated report", async () => {
  const workflow = await readRepositoryFile(".github/workflows/quality-agent.yml");
  const liveMonitor = await readRepositoryFile("apps/web/tests/live-monitor/production.spec.ts");
  const packageManifest = JSON.parse(await readRepositoryFile("package.json"));

  assert.match(workflow, /cron: "30 7,18 \* \* \*"/);
  assert.match(workflow, /timezone: Europe\/Berlin/);
  assert.match(workflow, /safety-strategy: read-only/);
  assert.match(workflow, /continue-on-error: true/);
  assert.match(workflow, /quality-agent-report/);
  assert.match(workflow, /steps\.report-artifact\.outputs\.artifact-url/);
  assert.match(workflow, /quality-agent-report direkt herunterladen/);
  assert.match(workflow, /collect-technical-findings\.mjs/);
  assert.match(workflow, /EXPECTED_PRODUCTION_REVISION/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /resolve-production-revision\.mjs/);
  assert.match(workflow, /EXPECTED_PRODUCTION_TREE/);
  assert.match(workflow, /EQUIVALENT_PRODUCTION_REVISIONS/);
  assert.match(
    workflow,
    /run-name: Qualitätsagent · Produktion feat\/phase1-phase2-functional-pilot/,
  );
  assert.match(
    workflow,
    /QUALITY_REPORT_REVISION: \$\{\{ steps\.production-revision\.outputs\.sha \}\}/,
  );
  assert.match(workflow, /QUALITY_WORKFLOW_BRANCH: \$\{\{ github\.ref_name \}\}/);
  assert.match(workflow, /node tooling\/quality-agent\/send-report-email\.mjs/);
  assert.match(workflow, /M365_CLIENT_SECRET: \$\{\{ secrets\.M365_CLIENT_SECRET \}\}/);
  assert.match(workflow, /QUALITY_REPORT_EMAIL_TO: \$\{\{ secrets\.QUALITY_REPORT_EMAIL_TO \}\}/);
  assert.match(
    workflow,
    /name: Qualitätsbericht per Microsoft 365 versenden[\s\S]*?continue-on-error: true/,
  );
  assert.match(workflow, /pnpm security:audit/);
  assert.match(liveMonitor, /DEMO-QA-/);
  assert.match(liveMonitor, /quality-agent\/recycling-access-cleanup/);
  assert.match(liveMonitor, /finally/);
  assert.match(liveMonitor, /deletedRequests/);
  assert.doesNotMatch(workflow, /^\s+(?:contents|pull-requests): write$/m);
  assert.equal(
    packageManifest.scripts["test:monitor:live"],
    "playwright test --config playwright.live-monitor.config.ts",
  );
});
