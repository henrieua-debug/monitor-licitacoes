import { NextResponse } from "next/server";
import { createSubscription, mpEnabled, Plano } from "@/lib/server/premium";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!mpEnabled()) return NextResponse.json({ error: "mp_disabled" }, { status: 503 });

  const { email, plano } = (await req.json()) as { email?: string; plano?: Plano };
  const e = (email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (plano !== "mensal" && plano !== "anual") {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  try {
    const url = await createSubscription(e, plano);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("assinar:", err);
    return NextResponse.json({ error: "mp_error" }, { status: 502 });
  }
}
