import { NextRequest, NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  demoRequestUrl,
  isDemoAuthConfigured,
  isDemoAuthRequired,
  verifyDemoSession,
} from "./lib/demo-auth";

const PUBLIC_PATHS = new Set(["/login", "/demo-auth/login"]);

export function proxy(request: NextRequest): NextResponse {
  if (!isDemoAuthRequired()) return NextResponse.next();

  const pathname = request.nextUrl.pathname;
  const configured = isDemoAuthConfigured();
  const authenticated =
    configured && verifyDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value);

  if (pathname === "/login" && authenticated) {
    return redirect(request, "/demo");
  }
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  if (!configured) {
    if (pathname.startsWith("/v1/")) return apiProblem(503, "Demo-Zugriff nicht konfiguriert");
    return redirect(request, "/login?configuration=missing");
  }

  if (!authenticated) {
    if (pathname.startsWith("/v1/")) return apiProblem(401, "Anmeldung erforderlich");

    const query = new URLSearchParams({ returnTo: `${pathname}${request.nextUrl.search}` });
    return redirect(request, `/login?${query}`);
  }

  return NextResponse.next();
}

function redirect(request: Request, location: string): NextResponse {
  const response = NextResponse.redirect(demoRequestUrl(request, location));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function apiProblem(status: number, title: string): NextResponse {
  return NextResponse.json(
    {
      detail: title,
      status,
      title,
      type: status === 401 ? "/problems/authentication-required" : "/problems/demo-not-configured",
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/problem+json; charset=utf-8",
      },
    },
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|regio-it-logo.png).*)"],
};
