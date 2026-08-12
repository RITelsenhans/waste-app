import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  isAdminAuthConfigured,
  isAdminAuthRequired,
  safeAdminReturnTo,
  verifyAdminPassword,
  verifyAdminSession,
} from "../lib/admin-auth";

function configuredEnvironment(): Record<string, string | undefined> {
  return {
    ADMIN_AUTH_REQUIRED: "true",
    DEMO_ACCESS_PASSWORD: randomBytes(18).toString("base64url"),
    DEMO_SESSION_SECRET: randomBytes(32).toString("base64url"),
  };
}

describe("admin authentication", () => {
  it("is optional only for local development and mandatory on Vercel", () => {
    expect(isAdminAuthRequired({})).toBe(false);
    expect(isAdminAuthRequired({ VERCEL: "1" })).toBe(true);
  });

  it("requires strong password and session configuration", () => {
    expect(isAdminAuthConfigured({ DEMO_ACCESS_PASSWORD: "short" })).toBe(false);
    expect(isAdminAuthConfigured(configuredEnvironment())).toBe(true);
  });

  it("uses a constant-time authenticator and rejects a wrong password", () => {
    const environment = configuredEnvironment();
    expect(verifyAdminPassword(environment.DEMO_ACCESS_PASSWORD ?? "", environment)).toBe(true);
    expect(verifyAdminPassword("wrong-password", environment)).toBe(false);
  });

  it("expires the signed session after eight hours", () => {
    const environment = configuredEnvironment();
    const now = Date.UTC(2026, 7, 12, 12, 0, 0);
    const session = createAdminSession(environment, now);
    expect(verifyAdminSession(session, environment, now)).toBe(true);
    expect(
      verifyAdminSession(session, environment, now + ADMIN_SESSION_MAX_AGE_SECONDS * 1_000),
    ).toBe(false);
    expect(verifyAdminSession(`${session}tampered`, environment, now)).toBe(false);
  });

  it("allows only internal return paths", () => {
    expect(safeAdminReturnTo("/?tenant=demo")).toBe("/?tenant=demo");
    expect(safeAdminReturnTo("https://attacker.invalid")).toBe("/");
    expect(safeAdminReturnTo("//attacker.invalid")).toBe("/");
    expect(safeAdminReturnTo("/login")).toBe("/");
  });
});
