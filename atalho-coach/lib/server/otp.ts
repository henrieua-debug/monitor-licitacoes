// Código de verificação por e-mail (OTP) para o login premium.
// Sem ele, bastaria saber o e-mail de um assinante para entrar; com ele, só
// entra quem recebe o código de 6 dígitos na caixa de entrada daquele e-mail.
//
// Armazenamos apenas o HASH do código no Supabase (tabela codigos_login) e
// enviamos o código por e-mail via Brevo (free tier, 300 e-mails/dia).
// Se BREVO_API_KEY/EMAIL_FROM/Supabase não estiverem configurados, o login
// cai no modo simples (só e-mail) para o site continuar funcionando.

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const CODE_TTL_MIN = 10; // validade do código
const RESEND_SECONDS = 60; // intervalo mínimo entre reenvios
const MAX_ATTEMPTS = 5; // tentativas erradas antes de invalidar o código

export function otpEnabled(): boolean {
  return Boolean(
    process.env.BREVO_API_KEY &&
      process.env.EMAIL_FROM &&
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_KEY &&
      process.env.APP_SECRET
  );
}

function sbHeaders(): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_KEY!;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "content-type": "application/json",
  };
}

function sbBase(): string {
  return `${process.env.SUPABASE_URL!.replace(/\/$/, "")}/rest/v1`;
}

export function hashCode(email: string, code: string): string {
  return createHmac("sha256", process.env.APP_SECRET!)
    .update(`otp|${email.toLowerCase()}|${code}`)
    .digest("base64url");
}

interface CodeRow {
  email: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  created_at: string;
}

async function getRow(email: string): Promise<CodeRow | null> {
  const res = await fetch(`${sbBase()}/codigos_login?email=eq.${encodeURIComponent(email)}&select=*`, {
    headers: sbHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const rows = (await res.json()) as CodeRow[];
  return rows[0] ?? null;
}

async function deleteRow(email: string): Promise<void> {
  await fetch(`${sbBase()}/codigos_login?email=eq.${encodeURIComponent(email)}`, {
    method: "DELETE",
    headers: { ...sbHeaders(), Prefer: "return=minimal" },
  });
}

const MAIL: Record<string, { subject: string; body: (code: string) => string }> = {
  pt: {
    subject: "Seu código de acesso — Atalho Coach",
    body: (c) =>
      `Seu código de acesso ao Atalho Coach é: ${c}\n\nEle vale por ${CODE_TTL_MIN} minutos.\nSe você não pediu este código, pode ignorar este e-mail.`,
  },
  en: {
    subject: "Your sign-in code — Atalho Coach",
    body: (c) =>
      `Your Atalho Coach sign-in code is: ${c}\n\nIt expires in ${CODE_TTL_MIN} minutes.\nIf you didn't request this code, you can ignore this email.`,
  },
  es: {
    subject: "Tu código de acceso — Atalho Coach",
    body: (c) =>
      `Tu código de acceso a Atalho Coach es: ${c}\n\nVale por ${CODE_TTL_MIN} minutos.\nSi no pediste este código, puedes ignorar este correo.`,
  },
};

/**
 * Gera um código, guarda o hash e envia por e-mail.
 * Devolve "wait" se um código recente ainda vale (evita spam de reenvio).
 */
export async function requestLoginCode(email: string, locale: string): Promise<"sent" | "wait"> {
  const existing = await getRow(email);
  if (existing && Date.now() - new Date(existing.created_at).getTime() < RESEND_SECONDS * 1000) {
    return "wait";
  }

  const code = String(randomInt(100000, 1000000));
  const res = await fetch(`${sbBase()}/codigos_login?on_conflict=email`, {
    method: "POST",
    headers: { ...sbHeaders(), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      email,
      code_hash: hashCode(email, code),
      expires_at: new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString(),
      attempts: 0,
      created_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const m = MAIL[locale] ?? MAIL.pt;
  const br = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Atalho Coach", email: process.env.EMAIL_FROM },
      to: [{ email }],
      subject: m.subject,
      textContent: m.body(code),
    }),
  });
  if (!br.ok) throw new Error(`brevo ${br.status}: ${(await br.text()).slice(0, 200)}`);
  return "sent";
}

/** Confere o código; apaga o registro no sucesso, conta tentativas no erro. */
export async function verifyLoginCode(email: string, code: string): Promise<boolean> {
  const row = await getRow(email);
  if (!row) return false;

  if (new Date(row.expires_at).getTime() < Date.now() || row.attempts >= MAX_ATTEMPTS) {
    await deleteRow(email);
    return false;
  }

  const expected = Buffer.from(row.code_hash);
  const got = Buffer.from(hashCode(email, code.trim()));
  const ok = expected.length === got.length && timingSafeEqual(expected, got);

  if (!ok) {
    await fetch(`${sbBase()}/codigos_login?email=eq.${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { ...sbHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({ attempts: row.attempts + 1 }),
    });
    return false;
  }

  await deleteRow(email);
  return true;
}
