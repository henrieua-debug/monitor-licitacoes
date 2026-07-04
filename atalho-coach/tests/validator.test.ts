import { describe, expect, it } from "vitest";
import { validateIR } from "@/lib/shortcuts/validator";
import type { ShortcutIR } from "@/lib/shortcuts/types";

const A = "is.workflow.actions";

const codes = (ir: ShortcutIR) => validateIR(ir).issues.map((i) => i.code);

describe("validateIR", () => {
  it("aceita um atalho simples válido", () => {
    const r = validateIR({
      name: "Ok",
      steps: [
        { type: "action", identifier: `${A}.gettext`, params: { WFTextActionText: "oi" }, ref: "t" },
        { type: "action", identifier: `${A}.showresult`, params: { Text: { text: [{ ref: "t" }] } } },
      ],
    });
    expect(r.ok).toBe(true);
  });

  it("rejeita ação desconhecida", () => {
    expect(
      codes({ name: "X", steps: [{ type: "action", identifier: `${A}.inventada`, params: {} }] })
    ).toContain("unknown-action");
  });

  it("rejeita parâmetro desconhecido e obrigatório ausente", () => {
    const c = codes({
      name: "X",
      steps: [{ type: "action", identifier: `${A}.gettext`, params: { WFOops: "x" } }],
    });
    expect(c).toContain("unknown-param");
    expect(c).toContain("missing-param");
  });

  it("rejeita ref para ação posterior (forward reference)", () => {
    const c = codes({
      name: "X",
      steps: [
        { type: "action", identifier: `${A}.showresult`, params: { Text: { text: [{ ref: "t" }] } } },
        { type: "action", identifier: `${A}.gettext`, params: { WFTextActionText: "oi" }, ref: "t" },
      ],
    });
    expect(c).toContain("unknown-ref");
  });

  it("rejeita variável usada antes do setvariable", () => {
    const c = codes({
      name: "X",
      steps: [{ type: "action", identifier: `${A}.getvariable`, params: { WFVariable: { var: "nada" } } }],
    });
    expect(c).toContain("unknown-var");
  });

  it("rejeita blocos desbalanceados", () => {
    const c = codes({
      name: "X",
      steps: [
        { type: "action", identifier: `${A}.getbatterylevel`, params: {}, ref: "b" },
        { type: "if", input: { ref: "b" }, operator: "lessThan", value: 20 },
      ],
    });
    expect(c).toContain("unclosed-block");
    expect(codes({ name: "Y", steps: [{ type: "endif" }] })).toContain("orphan-endif");
  });

  it("rejeita case fora de ordem e contagem errada de cases", () => {
    const c = codes({
      name: "X",
      steps: [
        { type: "menu", prompt: "?", items: ["Um", "Dois"] },
        { type: "case", label: "Dois" },
        { type: "endmenu" },
      ],
    });
    expect(c).toContain("case-label-mismatch");
    expect(c).toContain("menu-case-count");
  });

  it("rejeita RepeatItem fora de loop e operador ASCII no math", () => {
    expect(
      codes({
        name: "X",
        steps: [{ type: "action", identifier: `${A}.setclipboard`, params: { WFInput: { special: "RepeatItem" } } }],
      })
    ).toContain("repeat-item-outside-loop");
    expect(
      codes({
        name: "Y",
        steps: [
          { type: "action", identifier: `${A}.number`, params: { WFNumberActionNumber: 2 }, ref: "n" },
          { type: "action", identifier: `${A}.math`, params: { WFInput: { ref: "n" }, WFMathOperation: "*", WFMathOperand: 3 } },
        ],
      })
    ).toContain("ascii-math-operator");
  });

  it("rejeita if sem value quando o operador exige", () => {
    const c = codes({
      name: "X",
      steps: [
        { type: "action", identifier: `${A}.gettext`, params: { WFTextActionText: "a" }, ref: "t" },
        { type: "if", input: { ref: "t" }, operator: "equals" },
        { type: "endif" },
      ],
    });
    expect(c).toContain("missing-condition-value");
  });

  it("rejeita enum inválido", () => {
    const c = codes({
      name: "X",
      steps: [
        { type: "action", identifier: `${A}.getclipboard`, params: {}, ref: "c" },
        { type: "action", identifier: `${A}.text.translate`, params: { WFInputText: { ref: "c" }, WFSelectedLanguage: "xx_XX" } },
      ],
    });
    expect(c).toContain("invalid-enum");
  });
});
