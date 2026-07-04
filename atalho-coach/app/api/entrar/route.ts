import { NextResponse } from "next/server";
import { hasActiveSubscription, isCourtesyEmail, issueSession, mpEnabled } from "@/lib/server/premium";
import { otpEnabled, requestLoginCode, verifyLoginCode } from "@/lib/server/otp";

export const runtime = "nodejs";

// Login premium em duas etapas:
// 1) POST {email} → confirma que é assinante (ou cortesia) e envia o código por e-mail;
// 2) POST {email, codigo} → confere o código e grava o cookie de sessão.
// Sem Brevo/Supabase configurados, cai no modo simples: entra só com o e-mail.
export async function POST(req: Request) {
  if (!mpEnabled()) return NextResponse.json({ error: "mp_disabled" }, { status: 503 });

  const { email, codigo, locale } = (await req.json()) as {
    email?: string;
    codigo?: string;
    locale?: string;
  };
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

  if (otpEnabled()) {
    if (!codigo) {
      try {
        await requestLoginCode(e, locale ?? "pt");
        return NextResponse.json({ ok: true, codeSent: true });
      } catch (err) {
        console.error("entrar/codigo:", err);
        return NextResponse.json({ error: "email_error" }, { status: 502 });
      }
    }
    try {
      if (!(await verifyLoginCode(e, String(codigo)))) {
        return NextResponse.json({ error: "bad_code" }, { status: 401 });
      }
    } catch (err) {
      console.error("entrar/verificar:", err);
      return NextResponse.json({ error: "email_error" }, { status: 502 });
    }
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
