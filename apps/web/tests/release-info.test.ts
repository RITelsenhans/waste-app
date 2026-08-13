import { describe, expect, it } from "vitest";
import { webReleaseInfo } from "../lib/release-info";

describe("web release information", () => {
  it("exposes only the normalized Vercel revision and declared runtime baseline", () => {
    const release = webReleaseInfo(
      {
        VERCEL_GIT_COMMIT_REF: "feat/phase1-phase2-functional-pilot",
        VERCEL_GIT_COMMIT_SHA: "A".repeat(40),
      },
      "22.14.0",
    );

    expect(release).toMatchObject({
      status: "ready",
      provider: "vercel",
      commitSha: "a".repeat(40),
      branch: "feat/phase1-phase2-functional-pilot",
      applicationVersion: "0.1.0",
      nodeVersion: "22.14.0",
      nextVersion: "16.2.12",
    });
  });

  it("does not expose malformed deployment metadata", () => {
    expect(webReleaseInfo({ VERCEL_GIT_COMMIT_SHA: "not-a-sha" }, "22.14.0")).toMatchObject({
      provider: "vercel",
      commitSha: "unknown",
      branch: "local",
    });
  });
});
