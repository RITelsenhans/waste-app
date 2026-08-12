import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  adminRequestUrl,
  createAdminSession,
  hasAdminSameOrigin,
  safeAdminReturnTo,
  verifyAdminPassword,
} from "../../../lib/admin-auth";

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasAdminSameOrigin(request)) return problem(403, "Anfrage nicht zulässig");
  const formData = await request.formData();
  const password = formData.get("password");
  const returnTo = safeAdminReturnTo(formData.get("returnTo"));
  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    const query = new URLSearchParams({ error: "invalid", returnTo });
    return redirect(request, `/login?${query}`);
  }

  const session = createAdminSession();
  if (!session) return problem(503, "Admin-Zugriff nicht konfiguriert");
  const response = redirect(request, returnTo);
  response.cookies.set(ADMIN_SESSION_COOKIE, session, {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "strict",
    secure: process.env.ADMIN_COOKIE_SECURE !== "false",
  });
  return response;
}

function redirect(request: Request, location: string): NextResponse {
  const response = NextResponse.redirect(adminRequestUrl(request, location), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function problem(status: number, title: string): NextResponse {
  return NextResponse.json(
    { detail: title, status, title, type: "/problems/admin-authentication" },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
