import { NextResponse } from "next/server";
import { createSuggestion, forumEnabled, listSuggestions } from "@/lib/server/forum";

export const runtime = "nodejs";

// Anti-spam simples por processo: 1 sugestão por IP a cada 2 minutos.
const lastPost = new Map<string, number>();

export async function GET() {
  if (!forumEnabled()) return NextResponse.json({ error: "forum_disabled" }, { status: 503 });
  try {
    return NextResponse.json({ suggestions: await listSuggestions() });
  } catch (err) {
    console.error("forum list:", err);
    return NextResponse.json({ error: "forum_error" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  if (!forumEnabled()) return NextResponse.json({ error: "forum_disabled" }, { status: 503 });

  const ip = (req.headers.get("x-forwarded-for") ?? "?").split(",")[0].trim();
  const last = lastPost.get(ip) ?? 0;
  if (Date.now() - last < 2 * 60_000) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { titulo, descricao, idioma } = (await req.json()) as {
    titulo?: string;
    descricao?: string;
    idioma?: string;
  };
  const t = (titulo ?? "").trim().slice(0, 120);
  const d = (descricao ?? "").trim().slice(0, 500);
  if (t.length < 3) return NextResponse.json({ error: "invalid_title" }, { status: 400 });

  try {
    await createSuggestion(t, d, ["pt", "en", "es"].includes(idioma ?? "") ? idioma! : "pt");
    lastPost.set(ip, Date.now());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("forum create:", err);
    return NextResponse.json({ error: "forum_error" }, { status: 502 });
  }
}
