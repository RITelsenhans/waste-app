import { NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  demoRequestUrl,
  hasDemoSameOrigin,
  isDemoCookieSecure,
} from "../../../lib/demo-auth";

export function POST(request: Request): NextResponse {
  if (!hasDemoSameOrigin(request)) {
    return NextResponse.json(
      {
        detail: "Anfrage nicht zulässig",
        status: 403,
        title: "Anfrage nicht zulässig",
        type: "/problems/demo-authentication",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/problem+json; charset=utf-8",
        },
      },
    );
  }

  const response = NextResponse.redirect(demoRequestUrl(request, "/login"), 303);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: isDemoCookieSecure(),
  });
  return response;
}
