import { NextResponse } from "next/server";
import {
  createDemoSession,
  demoRequestUrl,
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_MAX_AGE_SECONDS,
  hasDemoSameOrigin,
  isDemoCookieSecure,
  safeDemoReturnTo,
  verifyDemoPassword,
} from "../../../lib/demo-auth";

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasDemoSameOrigin(request)) return problem(403, "Anfrage nicht zulässig");

  const formData = await request.formData();
  const password = formData.get("password");
  const returnTo = safeDemoReturnTo(formData.get("returnTo"));

  if (typeof password !== "string" || !verifyDemoPassword(password)) {
    const query = new URLSearchParams({ error: "invalid", returnTo });
    return redirect(request, `/login?${query}`);
  }

  const session = createDemoSession();
  if (!session) return problem(503, "Demo-Zugriff nicht konfiguriert");

  const response = redirect(request, returnTo);
  response.cookies.set(DEMO_SESSION_COOKIE, session, {
    httpOnly: true,
    maxAge: DEMO_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "strict",
    secure: isDemoCookieSecure(),
  });
  return response;
}

function redirect(request: Request, location: string): NextResponse {
  const response = NextResponse.redirect(demoRequestUrl(request, location), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function problem(status: number, title: string): NextResponse {
  return NextResponse.json(
    { detail: title, status, title, type: "/problems/demo-authentication" },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/problem+json; charset=utf-8",
      },
    },
  );
}
