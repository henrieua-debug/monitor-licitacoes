// Construtor com IA: pedido em linguagem natural → IR (JSON validado) →
// Craig Loop (validação + retry com feedback) → plist → assinatura opcional.
// Provedor: Anthropic (se ANTHROPIC_API_KEY) ou Google Gemini free tier (se GEMINI_API_KEY).

import { NextResponse } from "next/server";
import { genToIR } from "@/lib/shortcuts/genSchema";
import { buildRetryPrompt, buildSystemPrompt, buildUserPrompt } from "@/lib/shortcuts/prompt";
import { issuesForModel, validateIR } from "@/lib/shortcuts/validator";
import { deliver } from "@/lib/server/deliver";
import { ChatMessage, generateShortcut, hasProvider } from "@/lib/server/llm";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_ATTEMPTS = 3;

export async function POST(req: Request) {
  const { prompt, locale, profileHint } = (await req.json()) as {
    prompt: string;
    locale: string;
    profileHint?: string;
  };

  if (!prompt || prompt.trim().length < 8) {
    return NextResponse.json({ error: "empty_prompt" }, { status: 400 });
  }
  if (!hasProvider()) {
    return NextResponse.json({ error: "no_key" }, { status: 503 });
  }

  const system = buildSystemPrompt();
  const messages: ChatMessage[] = [
    { role: "user", content: buildUserPrompt(prompt.slice(0, 2000), locale, profileHint?.slice(0, 500)) },
  ];

  let lastIssues = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let result;
    try {
      result = await generateShortcut(system, messages);
    } catch (err) {
      console.error(`geração falhou (tentativa ${attempt}):`, err);
      if (attempt === MAX_ATTEMPTS) return NextResponse.json({ error: "model_error" }, { status: 502 });
      continue;
    }

    if (!result.ok) {
      lastIssues = result.issues;
      messages.push({ role: "user", content: buildRetryPrompt(lastIssues) });
      continue;
    }

    const ir = genToIR(result.gen);
    const validation = validateIR(ir);
    if (validation.ok) {
      const payload = await deliver(ir, result.gen.summary);
      return NextResponse.json({ ...payload, attempts: attempt });
    }

    lastIssues = issuesForModel(validation);
    // Craig Loop: devolve o JSON gerado + os erros para o modelo corrigir.
    messages.push({ role: "assistant", content: JSON.stringify(result.gen) });
    messages.push({ role: "user", content: buildRetryPrompt(lastIssues) });
  }

  return NextResponse.json({ error: "validation_failed", issues: lastIssues }, { status: 422 });
}
