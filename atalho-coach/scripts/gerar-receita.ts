// Gerador diário de automações. Roda no GitHub Actions (ou local: npx tsx scripts/gerar-receita.ts).
// Fonte da ideia: a sugestão mais votada do fórum (se Supabase configurado);
// senão, inventa um tema novo evitando repetir o catálogo.
// Gera em pt, traduz para en/es, valida TUDO no Craig Loop e grava em auto-recipes.json.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateShortcut, hasProvider, ChatMessage } from "../lib/server/llm";
import { forumEnabled, markCreated, topOpenSuggestion } from "../lib/server/forum";
import { buildRetryPrompt, buildSystemPrompt } from "../lib/shortcuts/prompt";
import { genToIR } from "../lib/shortcuts/genSchema";
import { issuesForModel, validateIR } from "../lib/shortcuts/validator";
import type { ShortcutIR } from "../lib/shortcuts/types";
import { RECIPES, AUTO_RECIPES, StoredRecipe } from "../lib/proposals/recipes";

const OUT = join(__dirname, "..", "lib", "proposals", "auto-recipes.json");
const EMOJIS = ["✨", "🪄", "⚡", "🧭", "🌙", "🎯", "🫧", "🔔", "🧠", "🎁"];
const LOCALES = ["pt", "en", "es"] as const;
const LANG_NAME = { pt: "português brasileiro", en: "English", es: "español" };

async function generateValid(task: string): Promise<{ ir: ShortcutIR; name: string; summary: string[] } | null> {
  const system = buildSystemPrompt();
  const messages: ChatMessage[] = [{ role: "user", content: task }];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await generateShortcut(system, messages);
    if (!result.ok) {
      messages.push({ role: "user", content: buildRetryPrompt(result.issues) });
      continue;
    }
    const ir = genToIR(result.gen);
    const validation = validateIR(ir);
    if (validation.ok) return { ir, name: result.gen.name, summary: result.gen.summary };
    messages.push({ role: "assistant", content: JSON.stringify(result.gen) });
    messages.push({ role: "user", content: buildRetryPrompt(issuesForModel(validation)) });
  }
  return null;
}

async function main() {
  if (!hasProvider()) {
    console.error("Configure GEMINI_API_KEY (ou ANTHROPIC_API_KEY).");
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const id = `auto-${today.replaceAll("-", "")}`;
  if (AUTO_RECIPES.some((r) => r.id === id)) {
    console.log(`Receita de hoje (${id}) já existe — nada a fazer.`);
    return;
  }

  // 1. Ideia: fórum (mais votada) ou criatividade guiada.
  let inspiration: string | undefined;
  let suggestionId: string | null = null;
  if (forumEnabled()) {
    const top = await topOpenSuggestion();
    if (top) {
      inspiration = `Pedido da comunidade (sugestão mais votada do fórum): "${top.titulo}". Detalhes: ${top.descricao || "(sem detalhes)"}`;
      suggestionId = top.id;
    }
  }
  const existing = [...RECIPES, ...AUTO_RECIPES.map((r) => ({ title: r.title }))].map((r) => r.title.pt).join("; ");
  inspiration ??= `Invente uma automação NOVA, criativa e útil para o dia a dia — diferente destas que já existem no catálogo: ${existing}.`;

  // 2. Gera em pt com Craig Loop.
  console.log("Gerando receita em pt…");
  const pt = await generateValid(
    `Idioma do usuário: português brasileiro.\n\n${inspiration}\n\nCrie o melhor atalho possível para isso.`
  );
  if (!pt) {
    console.error("Não consegui gerar uma receita válida hoje.");
    process.exit(1);
  }

  // 3. Traduz para en/es (mesma estrutura; se a tradução falhar, reusa a versão pt).
  const irByLocale: Record<string, ShortcutIR> = { pt: pt.ir };
  const titles: Record<string, string> = { pt: pt.name };
  const descriptions: Record<string, string> = { pt: pt.summary[0] ?? pt.name };

  for (const locale of LOCALES.slice(1)) {
    console.log(`Gerando versão ${locale}…`);
    const translated = await generateValid(
      `Idioma do usuário: ${LANG_NAME[locale]}.\n\nRecrie EXATAMENTE este atalho, mantendo as mesmas ações e a mesma estrutura, mas com name, summary, comentários, prompts e textos exibidos em ${LANG_NAME[locale]}:\n\n${JSON.stringify({ name: pt.name, summary: pt.summary, steps: pt.ir.steps })}`
    );
    irByLocale[locale] = translated?.ir ?? pt.ir;
    titles[locale] = translated?.name ?? pt.name;
    descriptions[locale] = translated?.summary[0] ?? descriptions.pt;
  }

  // 4. Grava.
  const dayOfYear = Math.floor((Date.now() - Date.parse(`${today.slice(0, 4)}-01-01`)) / 86_400_000);
  const stored: StoredRecipe = {
    id,
    emoji: EMOJIS[dayOfYear % EMOJIS.length],
    level: "medium",
    title: titles as StoredRecipe["title"],
    description: descriptions as StoredRecipe["description"],
    ir: irByLocale as StoredRecipe["ir"],
  };

  const all = JSON.parse(readFileSync(OUT, "utf8")) as StoredRecipe[];
  all.push(stored);
  writeFileSync(OUT, JSON.stringify(all, null, 1) + "\n");
  console.log(`✅ Receita "${pt.name}" gravada (${id}).`);

  // 5. Marca a sugestão do fórum como atendida.
  if (suggestionId) {
    await markCreated(suggestionId);
    console.log("Sugestão do fórum marcada como criada.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
