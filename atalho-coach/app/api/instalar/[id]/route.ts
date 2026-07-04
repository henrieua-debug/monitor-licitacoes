import { getRecipe } from "@/lib/proposals/recipes";
import { deliver } from "@/lib/server/deliver";
import { validateIR } from "@/lib/shortcuts/validator";
import type { Locale } from "@/lib/i18n/dictionaries";

export const runtime = "nodejs";

// URL pública do arquivo .shortcut de uma receita — permite o hand-off em 1 toque
// via "shortcuts://import-shortcut?url=...", que abre direto o app Atalhos.
// Só receitas gratuitas: as premium usam link do iCloud (icloud-links.json) para
// não expor o arquivo sem autenticação.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = getRecipe(id);
  if (!recipe) return new Response("unknown recipe", { status: 404 });
  if (recipe.premium) return new Response("premium", { status: 402 });

  const q = new URL(req.url).searchParams.get("locale");
  const locale: Locale = (["pt", "en", "es"] as const).includes(q as Locale) ? (q as Locale) : "pt";

  const ir = recipe.build(locale);
  const validation = validateIR(ir);
  if (!validation.ok) {
    console.error(`instalar ${id}: IR inválido`, validation.issues);
    return new Response("invalid recipe", { status: 500 });
  }

  const payload = await deliver(ir, []);
  const bytes = Uint8Array.from(atob(payload.fileBase64), (c) => c.charCodeAt(0));
  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": `attachment; filename="${payload.fileName}"`,
      "cache-control": "public, max-age=300",
    },
  });
}
