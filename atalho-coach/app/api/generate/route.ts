// Construtor com IA: pedido em linguagem natural → IR (structured outputs) →
// Craig Loop (validação + retry com feedback) → plist → assinatura opcional.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { GenShortcutSchema, genToIR } from "@/lib/shortcuts/genSchema";
import { buildRetryPrompt, buildSystemPrompt, buildUserPrompt } from "@/lib/shortcuts/prompt";
import { issuesForModel, validateIR } from "@/lib/shortcuts/validator";
import { deliver } from "@/lib/server/deliver";

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
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "no_key" }, { status: 503 });
  }

  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
  const system = buildSystemPrompt();

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildUserPrompt(prompt.slice(0, 2000), locale, profileHint?.slice(0, 500)) },
  ];

  let lastIssues = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let gen;
    try {
      const response = await client.messages.parse({
        model,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages,
        output_config: { format: zodOutputFormat(GenShortcutSchema) },
      });
      if (response.stop_reason === "refusal") {
        return NextResponse.json({ error: "refused" }, { status: 422 });
      }
      gen = response.parsed_output;
    } catch (err) {
      console.error(`geração falhou (tentativa ${attempt}):`, err);
      if (attempt === MAX_ATTEMPTS) return NextResponse.json({ error: "model_error" }, { status: 502 });
      continue;
    }

    if (!gen) {
      lastIssues = "- [error] saída não seguiu o schema";
      messages.push({ role: "user", content: buildRetryPrompt(lastIssues) });
      continue;
    }

    const ir = genToIR(gen);
    const validation = validateIR(ir);
    if (validation.ok) {
      const payload = await deliver(ir, gen.summary);
      return NextResponse.json({ ...payload, attempts: attempt });
    }

    lastIssues = issuesForModel(validation);
    // Craig Loop: devolve o JSON gerado + os erros para o modelo corrigir.
    messages.push({ role: "assistant", content: JSON.stringify(gen) });
    messages.push({ role: "user", content: buildRetryPrompt(lastIssues) });
  }

  return NextResponse.json({ error: "validation_failed", issues: lastIssues }, { status: 422 });
}
