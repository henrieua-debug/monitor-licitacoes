import type { Locale } from "@/lib/i18n/dictionaries";
import type { UserProfile } from "@/lib/profile";
import type { ShortcutIR } from "@/lib/shortcuts/types";

export type RecipeLevel = "simple" | "medium" | "bold";

export interface Recipe {
  id: string;
  emoji: string;
  level: RecipeLevel;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  /** Combina se o usuário tiver QUALQUER um destes apps (vazio = sempre combina). */
  apps?: string[];
  routines?: string[];
  goals?: string[];
  /** Restringe a certos aparelhos (ex.: só faz sentido no iPhone). */
  devices?: string[];
  build: (locale: Locale) => ShortcutIR;
}

export interface ScoredRecipe {
  recipe: Recipe;
  score: number;
  /** Rótulos (já localizados fora) do que casou com o perfil. */
  matchedApps: string[];
  matchedRoutines: string[];
  matchedGoals: string[];
}

const LEVEL_WEIGHT: Record<UserProfile["boldness"], Record<RecipeLevel, number>> = {
  safe: { simple: 3, medium: 1, bold: -2 },
  bold: { simple: 1, medium: 3, bold: 2 },
  wild: { simple: 0, medium: 2, bold: 4 },
};

export function scoreRecipes(recipes: Recipe[], profile: UserProfile): ScoredRecipe[] {
  const scored = recipes
    .filter((r) => !r.devices || r.devices.some((d) => profile.devices.includes(d)))
    .map((recipe) => {
      const matchedApps = (recipe.apps ?? []).filter((a) => profile.apps.includes(a));
      const matchedRoutines = (recipe.routines ?? []).filter((r) => profile.routine.includes(r));
      const matchedGoals = (recipe.goals ?? []).filter((g) => profile.goals.includes(g));

      // Receita que exige apps específicos e o usuário não tem nenhum: descartada.
      if (recipe.apps && recipe.apps.length > 0 && matchedApps.length === 0) return null;

      const score =
        matchedApps.length * 3 +
        matchedRoutines.length * 2 +
        matchedGoals.length * 2 +
        LEVEL_WEIGHT[profile.boldness][recipe.level];

      return { recipe, score, matchedApps, matchedRoutines, matchedGoals };
    })
    .filter((s): s is ScoredRecipe => s !== null && s.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
