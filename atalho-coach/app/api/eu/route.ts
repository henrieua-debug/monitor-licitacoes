import { NextResponse } from "next/server";
import { isPremiumRequest, mpEnabled } from "@/lib/server/premium";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return NextResponse.json({ premium: isPremiumRequest(req), mp: mpEnabled() });
}
