import { NextResponse } from "next/server";
import { forumEnabled, voteSuggestion } from "@/lib/server/forum";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!forumEnabled()) return NextResponse.json({ error: "forum_disabled" }, { status: 503 });
  const { id } = (await req.json()) as { id?: string };
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  try {
    await voteSuggestion(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("forum vote:", err);
    return NextResponse.json({ error: "forum_error" }, { status: 502 });
  }
}
