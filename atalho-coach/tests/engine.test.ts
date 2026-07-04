import { describe, expect, it } from "vitest";
import { scoreRecipes } from "@/lib/proposals/engine";
import { RECIPES } from "@/lib/proposals/recipes";
import type { UserProfile } from "@/lib/profile";

const base: UserProfile = {
  devices: ["iphone"],
  apps: [],
  routine: [],
  goals: [],
  boldness: "bold",
  completedAt: "2026-07-04T00:00:00Z",
};

describe("scoreRecipes", () => {
  it("descarta receitas que exigem apps que o usuário não tem", () => {
    const scored = scoreRecipes(RECIPES, { ...base, goals: ["media"] });
    expect(scored.find((s) => s.recipe.id === "modo-treino-spotify")).toBeUndefined();
  });

  it("recomenda receita do Spotify para quem tem Spotify e treina", () => {
    const scored = scoreRecipes(RECIPES, { ...base, apps: ["spotify"], routine: ["gym"], goals: ["media"] });
    const ids = scored.map((s) => s.recipe.id);
    expect(ids[0]).toBe("modo-treino-spotify");
  });

  it("perfil conservador rebaixa receitas arrojadas", () => {
    const safe = scoreRecipes(RECIPES, { ...base, boldness: "safe", goals: ["morning", "power"] });
    const wild = scoreRecipes(RECIPES, { ...base, boldness: "wild", goals: ["morning", "power"] });
    const safeTop = safe[0]?.recipe.level;
    expect(safeTop).toBe("simple");
    expect(wild.some((s) => s.recipe.level === "bold")).toBe(true);
  });

  it("explica por que recomendou (apps/rotina/objetivos casados)", () => {
    const scored = scoreRecipes(RECIPES, { ...base, apps: ["whatsapp"], routine: ["commute"], goals: ["messages"] });
    const chegoEm = scored.find((s) => s.recipe.id === "chego-em");
    expect(chegoEm).toBeDefined();
    expect(chegoEm!.matchedApps).toContain("whatsapp");
    expect(chegoEm!.matchedRoutines).toContain("commute");
  });
});
