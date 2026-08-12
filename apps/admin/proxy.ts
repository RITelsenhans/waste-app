import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminRequestUrl,
  isAdminAuthConfigured,
  isAdminAuthRequired,
  verifyAdminSession,
} from "./lib/admin-auth";

const PUBLIC_PATHS = new Set(["/login", "/admin-auth/login"]);

export function proxy(request: NextRequest): NextResponse {
  if (!isAdminAuthRequired()) return NextResponse.next();

  const pathname = request.nextUrl.pathname;
  const configured = isAdminAuthConfigured();
  const authenticated =
    configured && verifyAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (pathname === "/login" && authenticated) return redirect(request, "/");
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (!configured) return responseFor(request, 503, "Admin-Zugriff nicht konfiguriert");
  if (!authenticated) return responseFor(request, 401, "Anmeldung erforderlich");
  return NextResponse.next();
}

function responseFor(request: NextRequest, status: number, title: string): NextResponse {
  if (request.nextUrl.pathname.startsWith("/admin-api/")) {
    return NextResponse.json(
      { detail: title, status, title, type: "/problems/admin-authentication" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
  const query = new URLSearchParams({
    returnTo: `${request.nextUrl.pathname}${request.nextUrl.search}`,
  });
  if (status === 503) query.set("configuration", "missing");
  return redirect(request, `/login?${query}`);
}

function redirect(request: Request, location: string): NextResponse {
  const response = NextResponse.redirect(adminRequestUrl(request, location));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
