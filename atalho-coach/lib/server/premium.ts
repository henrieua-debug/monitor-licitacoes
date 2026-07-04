// Assinatura premium via Mercado Pago (Assinaturas/preapproval) + sessão por cookie HMAC.
// Fluxo: /api/assinar cria a assinatura e manda o usuário ao checkout do MP;
// depois de pagar, ele "entra" informando o e-mail — /api/entrar confere no MP
// se há assinatura autorizada e grava um cookie assinado (sem senha, sem banco).

import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "ac_premium";
const SESSION_DAYS = 7; // depois disso o usuário "entra" de novo (recheca o MP)

export function mpEnabled(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN && process.env.APP_SECRET);
}

// ---------------------------------------------------------------------------
// Cookie de sessão premium: base64url(email|exp) + "." + HMAC-SHA256.

function hmac(payload: string): string {
  return createHmac("sha256", process.env.APP_SECRET!).update(payload).digest("base64url");
}

export function issueSession(email: string): { name: string; value: string; maxAge: number } {
  const exp = Date.now() + SESSION_DAYS * 86_400_000;
  const payload = Buffer.from(`${email.toLowerCase()}|${exp}`).toString("base64url");
  return {
    name: COOKIE_NAME,
    value: `${payload}.${hmac(payload)}`,
    maxAge: SESSION_DAYS * 86_400,
  };
}

export function verifySession(cookieValue: string | undefined): { email: string } | null {
  if (!cookieValue || !process.env.APP_SECRET) return null;
  const [payload, sig] = cookieValue.split(".");
  if (!payload || !sig) return null;
  const expected = hmac(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const decoded = Buffer.from(payload, "base64url").toString("utf8");
  const sep = decoded.lastIndexOf("|");
  if (sep < 0) return null;
  const email = decoded.slice(0, sep);
  const exp = Number(decoded.slice(sep + 1));
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  return { email };
}

/** E-mails com premium de cortesia (dono, testes) — PREMIUM_CORTESIA, separados por vírgula. */
export function isCourtesyEmail(email: string): boolean {
  return (process.env.PREMIUM_CORTESIA ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase());
}

export function isPremiumRequest(req: Request): boolean {
  const raw = req.headers.get("cookie") ?? "";
  const match = raw.split(/;\s*/).find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return verifySession(match?.slice(COOKIE_NAME.length + 1)) !== null;
}

// ---------------------------------------------------------------------------
// Mercado Pago — Assinaturas sem plano (preapproval).

const MP_BASE = "https://api.mercadopago.com";

function mpHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    "content-type": "application/json",
  };
}

export type Plano = "mensal" | "anual";

const PLANOS: Record<Plano, { reason: string; frequency: number; amount: number }> = {
  mensal: { reason: "Atalho Coach Premium — mensal", frequency: 1, amount: 10 },
  anual: { reason: "Atalho Coach Premium — anual", frequency: 12, amount: 40 },
};

/** Cria a assinatura e devolve a URL de checkout do Mercado Pago. */
export async function createSubscription(email: string, plano: Plano): Promise<string> {
  const p = PLANOS[plano];
  const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const res = await fetch(`${MP_BASE}/preapproval`, {
    method: "POST",
    headers: mpHeaders(),
    body: JSON.stringify({
      reason: p.reason,
      external_reference: `atalho-coach:${plano}`,
      payer_email: email,
      auto_recurring: {
        frequency: p.frequency,
        frequency_type: "months",
        transaction_amount: p.amount,
        currency_id: "BRL",
      },
      back_url: `${appUrl}/assinatura?retorno=1`,
      status: "pending",
    }),
  });
  if (!res.ok) {
    throw new Error(`mercadopago ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { init_point?: string; sandbox_init_point?: string };
  const url = data.init_point ?? data.sandbox_init_point;
  if (!url) throw new Error("mercadopago: resposta sem init_point");
  return url;
}

/** Há assinatura AUTORIZADA para este e-mail? */
export async function hasActiveSubscription(email: string): Promise<boolean> {
  const res = await fetch(
    `${MP_BASE}/preapproval/search?payer_email=${encodeURIComponent(email)}`,
    { headers: mpHeaders(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`mercadopago ${res.status}`);
  const data = (await res.json()) as { results?: { status?: string; external_reference?: string }[] };
  return (data.results ?? []).some(
    (r) => r.status === "authorized" && (r.external_reference ?? "").startsWith("atalho-coach:")
  );
}
