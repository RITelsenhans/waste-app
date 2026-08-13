import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const MAXIMUM_HISTORY_COMMITS = 1_000;

export function equivalentRevisionsFromLog(log, expectedRevision, expectedTree) {
  if (!SHA_PATTERN.test(expectedRevision) || !SHA_PATTERN.test(expectedTree)) {
    throw new Error("Produktionsrevision oder Git-Tree ist ungültig.");
  }

  const equivalentRevisions = new Set([expectedRevision]);
  for (const line of log.split("\n")) {
    const [revision, tree] = line.trim().split(" ");
    if (SHA_PATTERN.test(revision) && tree === expectedTree) {
      equivalentRevisions.add(revision);
    }
  }

  return [...equivalentRevisions];
}

export function resolveProductionRevision(runGit = git) {
  const revision = runGit(["rev-parse", "HEAD"]);
  const tree = runGit(["rev-parse", "HEAD^{tree}"]);
  const history = runGit([
    "log",
    `--max-count=${MAXIMUM_HISTORY_COMMITS}`,
    "--format=%H %T",
    "HEAD",
  ]);

  return {
    revision,
    tree,
    equivalentRevisions: equivalentRevisionsFromLog(history, revision, tree),
  };
}

function git(arguments_) {
  return execFileSync("git", arguments_, { encoding: "utf8" }).trim().toLowerCase();
}

function writeGitHubOutputs(result, outputFile) {
  appendFileSync(
    outputFile,
    `sha=${result.revision}\ntree=${result.tree}\nequivalent-shas=${result.equivalentRevisions.join(",")}\n`,
    "utf8",
  );
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) {
    throw new Error("GITHUB_OUTPUT fehlt; die Revisionsauflösung läuft nur im GitHub-Workflow.");
  }
  writeGitHubOutputs(resolveProductionRevision(), outputFile);
}
