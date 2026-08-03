import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const DEMO_SESSION_COOKIE = "waste_demo_session";
export const DEMO_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const TOKEN_VERSION = "v1";
const MINIMUM_PASSWORD_LENGTH = 12;
const MINIMUM_SECRET_LENGTH = 32;
type DemoEnvironment = Readonly<Record<string, string | undefined>>;

export function isDemoAuthRequired(environment: DemoEnvironment = process.env): boolean {
  return environment.DEMO_AUTH_REQUIRED === "true" || environment.DEMO_SHARE_MODE === "true";
}

export function isDemoAuthConfigured(environment: DemoEnvironment = process.env): boolean {
  return (
    typeof environment.DEMO_ACCESS_PASSWORD === "string" &&
    environment.DEMO_ACCESS_PASSWORD.length >= MINIMUM_PASSWORD_LENGTH &&
    typeof environment.DEMO_SESSION_SECRET === "string" &&
    environment.DEMO_SESSION_SECRET.length >= MINIMUM_SECRET_LENGTH
  );
}

export function isDemoCookieSecure(environment: DemoEnvironment = process.env): boolean {
  return environment.DEMO_COOKIE_SECURE !== "false";
}

export function verifyDemoPassword(
  candidate: string,
  environment: DemoEnvironment = process.env,
): boolean {
  const expected = environment.DEMO_ACCESS_PASSWORD;
  if (!isDemoAuthConfigured(environment) || expected === undefined) return false;

  return timingSafeEqual(digest(candidate), digest(expected));
}

export function createDemoSession(
  environment: DemoEnvironment = process.env,
  now = Date.now(),
): string | undefined {
  const secret = environment.DEMO_SESSION_SECRET;
  if (!isDemoAuthConfigured(environment) || secret === undefined) return undefined;

  const expiresAt = Math.floor(now / 1000) + DEMO_SESSION_MAX_AGE_SECONDS;
  const payload = `${TOKEN_VERSION}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyDemoSession(
  token: string | undefined,
  environment: DemoEnvironment = process.env,
  now = Date.now(),
): boolean {
  const secret = environment.DEMO_SESSION_SECRET;
  if (!token || !isDemoAuthConfigured(environment) || secret === undefined) return false;

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1000)) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  const actualSignature = parts[2] ?? "";
  const expectedSignature = sign(payload, secret);

  return timingSafeEqual(digest(actualSignature), digest(expectedSignature));
}

export function safeDemoReturnTo(value: FormDataEntryValue | string | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/demo";
  }
  if (value.startsWith("/login") || value.startsWith("/demo-auth/")) return "/demo";
  return value;
}

export function demoRequestUrl(request: Request, path: string): URL {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol =
    forwardedProtocol === "https" || forwardedProtocol === "http"
      ? forwardedProtocol
      : requestUrl.protocol.replace(":", "");

  return new URL(path, `${protocol}://${host}`);
}

export function hasDemoSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === demoRequestUrl(request, "/").origin;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}
