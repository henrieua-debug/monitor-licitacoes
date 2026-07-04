import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { issueSession, verifySession } from "@/lib/server/premium";
import { PREMIUM_RECIPES } from "@/lib/proposals/premium-recipes";

describe("sessão premium (cookie HMAC)", () => {
  beforeEach(() => {
    process.env.APP_SECRET = "segredo-de-teste";
  });
  afterEach(() => {
    delete process.env.APP_SECRET;
  });

  it("emite e verifica uma sessão válida", () => {
    const cookie = issueSession("Pessoa@Email.com");
    const session = verifySession(cookie.value);
    expect(session).not.toBeNull();
    expect(session!.email).toBe("pessoa@email.com");
  });

  it("rejeita assinatura adulterada", () => {
    const cookie = issueSession("a@b.com");
    const [payload] = cookie.value.split(".");
    expect(verifySession(`${payload}.assinatura-falsa`)).toBeNull();
    const outro = Buffer.from("hacker@mal.com|99999999999999").toString("base64url");
    const [, sig] = cookie.value.split(".");
    expect(verifySession(`${outro}.${sig}`)).toBeNull();
  });

  it("rejeita sessão expirada", () => {
    const exp = Date.now() - 1000;
    const payload = Buffer.from(`a@b.com|${exp}`).toString("base64url");
    // Reassina corretamente o payload expirado para isolar a checagem de expiração.
    const { createHmac } = require("node:crypto") as typeof import("node:crypto");
    const sig = createHmac("sha256", "segredo-de-teste").update(payload).digest("base64url");
    expect(verifySession(`${payload}.${sig}`)).toBeNull();
  });
});

describe("catálogo premium", () => {
  it("todas as receitas premium estão marcadas", () => {
    expect(PREMIUM_RECIPES.length).toBeGreaterThanOrEqual(10);
    for (const r of PREMIUM_RECIPES) expect(r.premium).toBe(true);
  });
});
