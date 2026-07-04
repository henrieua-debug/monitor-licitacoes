import { NextResponse } from "next/server";
import { hasActiveSubscription, isCourtesyEmail, issueSession, mpEnabled } from "@/lib/server/premium";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!mpEnabled()) return NextResponse.json({ error: "mp_disabled" }, { status: 503 });

  const { email } = (await req.json()) as { email?: string };
  const e = (email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    if (!isCourtesyEmail(e) && !(await hasActiveSubscription(e))) {
      return NextResponse.json({ error: "not_subscriber" }, { status: 403 });
    }
  } catch (err) {
    console.error("entrar:", err);
    return NextResponse.json({ error: "mp_error" }, { status: 502 });
  }

  const cookie = issueSession(e);
  const res = NextResponse.json({ ok: true, premium: true });
  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: cookie.maxAge,
    path: "/",
  });
  return res;
}
