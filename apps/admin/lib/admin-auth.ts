import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "waste_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const TOKEN_VERSION = "v1";
const MINIMUM_PASSWORD_LENGTH = 12;
const MINIMUM_SECRET_LENGTH = 32;
type AdminEnvironment = Readonly<Record<string, string | undefined>>;

export function isAdminAuthRequired(environment: AdminEnvironment = process.env): boolean {
  return environment.ADMIN_AUTH_REQUIRED === "true" || environment.VERCEL === "1";
}

export function isAdminAuthConfigured(environment: AdminEnvironment = process.env): boolean {
  return (
    typeof environment.DEMO_ACCESS_PASSWORD === "string" &&
    environment.DEMO_ACCESS_PASSWORD.length >= MINIMUM_PASSWORD_LENGTH &&
    typeof environment.DEMO_SESSION_SECRET === "string" &&
    environment.DEMO_SESSION_SECRET.length >= MINIMUM_SECRET_LENGTH
  );
}

export function verifyAdminPassword(
  candidate: string,
  environment: AdminEnvironment = process.env,
): boolean {
  const expected = environment.DEMO_ACCESS_PASSWORD;
  const secret = environment.DEMO_SESSION_SECRET;
  if (!isAdminAuthConfigured(environment) || expected === undefined || secret === undefined) {
    return false;
  }
  return timingSafeEqual(authenticator(candidate, secret), authenticator(expected, secret));
}

export function createAdminSession(
  environment: AdminEnvironment = process.env,
  now = Date.now(),
): string | undefined {
  const secret = environment.DEMO_SESSION_SECRET;
  if (!isAdminAuthConfigured(environment) || secret === undefined) return undefined;

  const expiresAt = Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS;
  const payload = `${TOKEN_VERSION}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAdminSession(
  token: string | undefined,
  environment: AdminEnvironment = process.env,
  now = Date.now(),
): boolean {
  const secret = environment.DEMO_SESSION_SECRET;
  if (!token || !isAdminAuthConfigured(environment) || secret === undefined) return false;

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1000)) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  const actual = Buffer.from(parts[2] ?? "", "base64url");
  const expected = Buffer.from(sign(payload, secret), "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function safeAdminReturnTo(value: FormDataEntryValue | string | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/login") || value.startsWith("/admin-auth/")) return "/";
  return value;
}

export function adminRequestUrl(
  request: Request,
  path: string,
  environment: AdminEnvironment = process.env,
): URL {
  const configuredOrigin = environment.ADMIN_PUBLIC_ORIGIN;
  if (configuredOrigin) {
    try {
      const origin = new URL(configuredOrigin);
      if (
        ["https:", "http:"].includes(origin.protocol) &&
        !origin.username &&
        !origin.password &&
        origin.pathname === "/" &&
        !origin.search &&
        !origin.hash
      ) {
        return new URL(path, origin);
      }
    } catch {
      // Fall through to trusted proxy headers.
    }
  }

  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol =
    forwardedProtocol === "https" || forwardedProtocol === "http"
      ? forwardedProtocol
      : requestUrl.protocol.replace(":", "");
  return new URL(path, `${protocol}://${host}`);
}

export function hasAdminSameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin") return true;
  if (fetchSite === "same-site" || fetchSite === "cross-site") return false;
  const origin = request.headers.get("origin");
  return origin !== null && origin === adminRequestUrl(request, "/").origin;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function authenticator(value: string, secret: string): Buffer {
  return createHmac("sha256", secret).update("admin-password-comparison\0").update(value).digest();
}
