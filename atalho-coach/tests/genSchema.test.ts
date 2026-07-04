import { describe, expect, it } from "vitest";
import { GenShortcutSchema, genToIR, normalizeGenCandidate } from "@/lib/shortcuts/genSchema";
import { validateIR } from "@/lib/shortcuts/validator";

describe("normalizeGenCandidate", () => {
  it("aceita o formato canônico sem alterações", () => {
    const canonical = {
      name: "Teste",
      summary: ["faz algo"],
      steps: [
        {
          type: "action",
          identifier: "is.workflow.actions.gettext",
          ref: "t",
          params: [{ key: "WFTextActionText", value: { kind: "string", value: "oi" } }],
        },
      ],
    };
    const parsed = GenShortcutSchema.safeParse(normalizeGenCandidate(canonical));
    expect(parsed.success).toBe(true);
  });

  it("corrige os erros típicos de modelos gratuitos (params como objeto, literais crus, summary string)", () => {
    // Formato "quase certo" que o Gemini free costuma produzir.
    const sloppy = {
      name: "Bateria falada",
      summary: "Fala o nível da bateria",
      steps: [
        { type: "action", identifier: "is.workflow.actions.getbatterylevel", ref: "bat", params: {} },
        {
          type: "action",
          identifier: "is.workflow.actions.speaktext",
          params: {
            WFText: { text: ["Bateria em ", { ref: "bat" }] },
            WFSpeakTextWait: true,
          },
        },
        { type: "if", input: "bat", operator: "lessThan", value: 20 },
        {
          type: "action",
          identifier: "is.workflow.actions.notification",
          params: { WFNotificationActionBody: "Carrega o celular!" },
        },
        { type: "endif" },
      ],
    };
    const parsed = GenShortcutSchema.safeParse(normalizeGenCandidate(sloppy));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const ir = genToIR(parsed.data);
    const validation = validateIR(ir);
    expect(validation.issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("embrulha valores desconhecidos como json em vez de quebrar", () => {
    const weird = {
      name: "X",
      summary: ["y"],
      steps: [
        {
          type: "action",
          identifier: "is.workflow.actions.dictionary",
          params: { WFItems: { chave: "valor", n: 2 } },
        },
      ],
    };
    const parsed = GenShortcutSchema.safeParse(normalizeGenCandidate(weird));
    expect(parsed.success).toBe(true);
  });
});
