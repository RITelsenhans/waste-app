import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const workflowNames = ["ci.yml", "dependency-review.yml", "security.yml"];

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

    assert.match(workflow, /^permissions:\n  contents: read$/m);
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
});

test("CI uses a digest-pinned Mailpit service for the existing mail browser test", async () => {
  const workflow = await readRepositoryFile(".github/workflows/ci.yml");
  assert.match(workflow, /axllent\/mailpit:v1\.30\.6@sha256:[0-9a-f]{64}/);
  assert.match(workflow, /MAILPIT_EXTERNAL_URL: http:\/\/127\.0\.0\.1:18025/);
});
