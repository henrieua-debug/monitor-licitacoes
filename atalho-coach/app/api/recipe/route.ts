import { NextResponse } from "next/server";
import { getRecipe } from "@/lib/proposals/recipes";
import { deliver } from "@/lib/server/deliver";
import { isPremiumRequest } from "@/lib/server/premium";
import { validateIR } from "@/lib/shortcuts/validator";
import type { Locale } from "@/lib/i18n/dictionaries";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { id, locale } = (await req.json()) as { id: string; locale: Locale };
  const recipe = getRecipe(id);
  if (!recipe) return NextResponse.json({ error: "unknown_recipe" }, { status: 404 });
  if (recipe.premium && !isPremiumRequest(req)) {
    return NextResponse.json({ error: "premium_required" }, { status: 402 });
  }

  const loc: Locale = ["pt", "en", "es"].includes(locale) ? locale : "pt";
  const ir = recipe.build(loc);
  const validation = validateIR(ir);
  if (!validation.ok) {
    console.error(`receita ${id} inválida:`, validation.issues);
    return NextResponse.json({ error: "invalid_recipe", issues: validation.issues }, { status: 500 });
  }

  const payload = await deliver(ir, [recipe.description[loc]]);
  return NextResponse.json(payload);
}
