import { NextResponse } from "next/server";
import { webReleaseInfo } from "../../../lib/release-info";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json(webReleaseInfo(), {
    headers: { "Cache-Control": "no-store" },
  });
}
