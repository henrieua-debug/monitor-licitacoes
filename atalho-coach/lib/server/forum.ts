// Fórum de sugestões — backend fino sobre o Supabase (free tier) via PostgREST.
// O navegador nunca fala com o Supabase: as rotas /api/forum usam a service key
// no servidor. Sem SUPABASE_URL/SUPABASE_SERVICE_KEY o fórum fica desligado.

export interface Suggestion {
  id: string;
  titulo: string;
  descricao: string;
  idioma: string;
  votos: number;
  status: "aberta" | "criada";
  created_at: string;
}

export function forumEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

function headers(): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_KEY!;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "content-type": "application/json",
  };
}

function base(): string {
  return `${process.env.SUPABASE_URL!.replace(/\/$/, "")}/rest/v1`;
}

export async function listSuggestions(): Promise<Suggestion[]> {
  const res = await fetch(`${base()}/sugestoes?select=*&order=votos.desc,created_at.desc&limit=100`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  return (await res.json()) as Suggestion[];
}

export async function createSuggestion(titulo: string, descricao: string, idioma: string): Promise<void> {
  const res = await fetch(`${base()}/sugestoes`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify({ titulo, descricao, idioma }),
  });
  if (!res.ok) throw new Error(`supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export async function voteSuggestion(id: string): Promise<void> {
  const res = await fetch(`${base()}/rpc/votar`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ sugestao_id: id }),
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
}

/** Sugestão aberta mais votada — insumo do gerador diário de automações. */
export async function topOpenSuggestion(): Promise<Suggestion | null> {
  const res = await fetch(
    `${base()}/sugestoes?select=*&status=eq.aberta&order=votos.desc,created_at.asc&limit=1`,
    { headers: headers(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const rows = (await res.json()) as Suggestion[];
  return rows[0] ?? null;
}

export async function markCreated(id: string): Promise<void> {
  const res = await fetch(`${base()}/sugestoes?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify({ status: "criada" }),
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
}
