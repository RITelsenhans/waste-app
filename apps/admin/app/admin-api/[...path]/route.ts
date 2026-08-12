import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  hasAdminSameOrigin,
  isAdminAuthRequired,
  verifyAdminSession,
} from "../../../lib/admin-auth";

const ALLOWED_PATH = /^v1\/(?:tenants(?:\/[^/]+\/config)?|addresses\/search|admin(?:\/.*)?)$/;

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: Request, context: RouteContext): Promise<Response> {
  if (!["GET", "HEAD"].includes(request.method) && !hasAdminSameOrigin(request)) {
    return problem(403, "Anfrage nicht zulässig");
  }
  if (isAdminAuthRequired()) {
    const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifyAdminSession(session)) return problem(401, "Anmeldung erforderlich");
  }

  const path = (await context.params).path.join("/");
  if (!ALLOWED_PATH.test(path)) return problem(404, "Admin-Endpunkt nicht gefunden");

  const apiBaseUrl = process.env.API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:8080";
  const sourceUrl = new URL(request.url);
  const target = new URL(`${apiBaseUrl}/${path}`);
  target.search = sourceUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
  const adminToken = process.env.PILOT_ADMIN_API_TOKEN;
  if (!adminToken || adminToken.length < 32) {
    return problem(503, "Interner Admin-Zugang nicht konfiguriert");
  }
  headers.set("X-Pilot-Admin-Token", adminToken);

  const upstream = await fetch(target, {
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    cache: "no-store",
    headers,
    method: request.method,
    redirect: "manual",
  });
  return new Response(upstream.body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
    status: upstream.status,
  });
}

function problem(status: number, title: string): NextResponse {
  return NextResponse.json(
    { detail: title, status, title, type: "/problems/admin-proxy" },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
