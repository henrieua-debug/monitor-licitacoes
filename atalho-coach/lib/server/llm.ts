// Provedores de IA do construtor. Dois caminhos:
// - Anthropic (claude-opus-4-8): structured outputs nativos via SDK — melhor qualidade;
// - Google Gemini (free tier: 1.500 req/dia sem cartão): JSON mode + validação Zod local.
// A escolha é por env: ANTHROPIC_API_KEY tem prioridade; senão GEMINI_API_KEY; senão nenhum.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
// Imports relativos: este módulo também roda fora do Next (scripts/gerar-receita.ts).
import { GenShortcut, GenShortcutSchema } from "../shortcuts/genSchema";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type LLMResult =
  | { ok: true; gen: GenShortcut }
  | { ok: false; issues: string };

export function hasProvider(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);
}

export function providerName(): string {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "none";
}

export async function generateShortcut(system: string, messages: ChatMessage[]): Promise<LLMResult> {
  if (process.env.ANTHROPIC_API_KEY) return viaAnthropic(system, messages);
  if (process.env.GEMINI_API_KEY) return viaGemini(system, messages);
  throw new Error("nenhum provedor de IA configurado");
}

async function viaAnthropic(system: string, messages: ChatMessage[]): Promise<LLMResult> {
  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
  const response = await client.messages.parse({
    model,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages,
    output_config: { format: zodOutputFormat(GenShortcutSchema) },
  });
  if (response.stop_reason === "refusal") return { ok: false, issues: "- [error] pedido recusado por segurança" };
  const gen = response.parsed_output;
  if (!gen) return { ok: false, issues: "- [error] a saída não seguiu o schema; gere o JSON completo no formato pedido" };
  return { ok: true, gen };
}

// IDs de modelo mudam com o tempo — tenta em ordem até um existir (404 => próximo).
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.0-flash",
].filter((m): m is string => Boolean(m));

async function viaGemini(system: string, messages: ChatMessage[]): Promise<LLMResult> {
  const key = process.env.GEMINI_API_KEY!;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 },
  });

  let lastErr = "";
  for (const model of GEMINI_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body,
        signal: AbortSignal.timeout(120_000),
      }
    );
    if (res.status === 404) {
      lastErr = `modelo ${model} não existe`;
      continue; // tenta o próximo da cadeia
    }
    if (!res.ok) {
      throw new Error(`Gemini respondeu ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("");
    if (!text) return { ok: false, issues: "- [error] resposta vazia do modelo; gere o JSON completo" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, issues: "- [error] a resposta não era JSON válido; responda APENAS com o objeto JSON" };
    }
    const result = GenShortcutSchema.safeParse(parsed);
    if (!result.success) {
      const zodIssues = result.error.issues
        .slice(0, 12)
        .map((i) => `- [error] campo ${i.path.join(".") || "(raiz)"}: ${i.message}`)
        .join("\n");
      return { ok: false, issues: zodIssues };
    }
    return { ok: true, gen: result.data };
  }
  throw new Error(`nenhum modelo Gemini disponível (${lastErr})`);
}
