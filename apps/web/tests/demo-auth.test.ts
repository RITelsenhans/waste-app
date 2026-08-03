import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createDemoSession,
  DEMO_SESSION_MAX_AGE_SECONDS,
  isDemoAuthConfigured,
  isDemoAuthRequired,
  safeDemoReturnTo,
  verifyDemoPassword,
  verifyDemoSession,
} from "../lib/demo-auth";

function configuredEnvironment(): Record<string, string | undefined> {
  return {
    DEMO_ACCESS_PASSWORD: randomBytes(18).toString("base64url"),
    DEMO_AUTH_REQUIRED: "true",
    DEMO_SESSION_SECRET: randomBytes(32).toString("base64url"),
  };
}

describe("demo authentication", () => {
  it("is disabled during normal local development", () => {
    expect(isDemoAuthRequired({})).toBe(false);
  });

  it("fails configuration validation for missing or weak secrets", () => {
    expect(isDemoAuthConfigured({ DEMO_ACCESS_PASSWORD: "short" })).toBe(false);
    expect(
      isDemoAuthConfigured({
        DEMO_ACCESS_PASSWORD: "long-enough-password",
        DEMO_SESSION_SECRET: "short",
      }),
    ).toBe(false);
  });

  it("accepts only the configured password", () => {
    const environment = configuredEnvironment();
    expect(verifyDemoPassword(environment.DEMO_ACCESS_PASSWORD ?? "", environment)).toBe(true);
    expect(verifyDemoPassword("wrong-password", environment)).toBe(false);
  });

  it("creates a valid session for at most eight hours", () => {
    const environment = configuredEnvironment();
    const now = Date.UTC(2026, 7, 3, 10, 0, 0);
    const session = createDemoSession(environment, now);

    expect(verifyDemoSession(session, environment, now)).toBe(true);
    expect(
      verifyDemoSession(session, environment, now + DEMO_SESSION_MAX_AGE_SECONDS * 1_000),
    ).toBe(false);
  });

  it("rejects tampered sessions", () => {
    const environment = configuredEnvironment();
    const session = createDemoSession(environment);
    expect(verifyDemoSession(`${session}changed`, environment)).toBe(false);
  });

  it("allows only internal return paths", () => {
    expect(safeDemoReturnTo("/demo?view=calendar")).toBe("/demo?view=calendar");
    expect(safeDemoReturnTo("https://example.invalid")).toBe("/demo");
    expect(safeDemoReturnTo("//example.invalid")).toBe("/demo");
    expect(safeDemoReturnTo("/login")).toBe("/demo");
  });
});
