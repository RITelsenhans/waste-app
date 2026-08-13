import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminRequestUrl, hasAdminSameOrigin } from "../../../lib/admin-auth";

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasAdminSameOrigin(request)) {
    return NextResponse.json({ title: "Anfrage nicht zulässig" }, { status: 403 });
  }
  const response = NextResponse.redirect(adminRequestUrl(request, "/login"), 303);
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { expires: new Date(0), path: "/" });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
