import webPackage from "../package.json";

type Environment = Record<string, string | undefined>;

export type WebReleaseInfo = {
  status: "ready";
  provider: "vercel" | "local";
  commitSha: string;
  branch: string;
  applicationVersion: string;
  nodeVersion: string;
  nextVersion: string;
};

export function webReleaseInfo(
  environment: Environment = process.env,
  nodeVersion = process.versions.node,
): WebReleaseInfo {
  const commitSha = environment.VERCEL_GIT_COMMIT_SHA;
  return {
    status: "ready",
    provider: commitSha ? "vercel" : "local",
    commitSha: normalizeCommitSha(commitSha),
    branch: environment.VERCEL_GIT_COMMIT_REF?.trim() || "local",
    applicationVersion: webPackage.version,
    nodeVersion,
    nextVersion: webPackage.dependencies.next,
  };
}

function normalizeCommitSha(value: string | undefined): string {
  const normalized = value?.trim().toLowerCase() ?? "";
  return /^[0-9a-f]{40}$/.test(normalized) ? normalized : "unknown";
}
