import { describe, expect, it } from "vitest";
import { irToPlist } from "@/lib/shortcuts/plist";
import { validateIR } from "@/lib/shortcuts/validator";
import { RECIPES } from "@/lib/proposals/recipes";
import type { Locale } from "@/lib/i18n/dictionaries";
import type { ShortcutIR } from "@/lib/shortcuts/types";

const A = "is.workflow.actions";

describe("irToPlist", () => {
  it("serializa texto interpolado com placeholder U+FFFC e range UTF-16", () => {
    const ir: ShortcutIR = {
      name: "Teste",
      steps: [
        { type: "action", identifier: `${A}.gettext`, params: { WFTextActionText: "Bom dia!" }, ref: "txt" },
        {
          type: "action",
          identifier: `${A}.alert`,
          params: { WFAlertActionMessage: { text: ["Mensagem: ", { ref: "txt" }] } },
        },
      ],
    };
    const xml = irToPlist(ir);
    expect(xml).toContain("WFTextTokenString");
    expect(xml).toContain("<key>{10, 1}</key>"); // "Mensagem: " tem 10 unidades UTF-16
    expect(xml).toContain("Mensagem: ￼");
    expect(xml).toContain("<string>Text</string>"); // OutputName do gettext
    expect(xml).toMatch(/<string>[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}<\/string>/);
  });

  it("emite o wrapper especial do conditional e fecha o bloco com o mesmo GroupingIdentifier", () => {
    const ir: ShortcutIR = {
      name: "Cond",
      steps: [
        { type: "action", identifier: `${A}.getbatterylevel`, params: {}, ref: "bat" },
        { type: "if", input: { ref: "bat" }, operator: "lessThan", value: 20 },
        { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: "Bateria baixa" } },
        { type: "endif" },
      ],
    };
    const xml = irToPlist(ir);
    expect(xml).toContain("is.workflow.actions.conditional");
    expect(xml).toContain("<key>WFControlFlowMode</key>");
    expect(xml).toContain("<integer>0</integer>");
    expect(xml).toContain("<integer>2</integer>");
    // Wrapper especial: WFInput -> {Type: Variable, Variable: {Value..., WFSerializationType}}
    expect(xml).toMatch(/<key>WFInput<\/key>\s*<dict>\s*<key>Type<\/key>\s*<string>Variable<\/string>\s*<key>Variable<\/key>/);
    expect(xml).toContain("<key>WFNumberValue</key>");
    expect(xml).toContain("<string>20</string>"); // literal numérico como string
    const groupings = [...xml.matchAll(/<key>GroupingIdentifier<\/key>\s*<string>([0-9A-F-]+)<\/string>/g)].map((m) => m[1]);
    expect(groupings).toHaveLength(2);
    expect(groupings[0]).toBe(groupings[1]);
  });

  it("serializa menu com um case por item e envelope completo", () => {
    const ir: ShortcutIR = {
      name: "Menu",
      steps: [
        { type: "menu", prompt: "Escolha", items: ["Um", "Dois"] },
        { type: "case", label: "Um" },
        { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: "1" } },
        { type: "case", label: "Dois" },
        { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: "2" } },
        { type: "endmenu" },
      ],
    };
    const xml = irToPlist(ir);
    expect(xml).toContain("WFMenuPrompt");
    expect((xml.match(/WFMenuItemTitle/g) ?? []).length).toBe(2);
    expect(xml).toContain("WFWorkflowClientVersion");
    expect(xml).toContain("<key>WFWorkflowMinimumClientVersion</key>");
    expect(xml).toContain("WFQuickActionSurfaces");
    expect(xml).toContain("WFWorkflowIcon");
  });

  it("emite quantidade como WFQuantityFieldValue e espelha Input no Count", () => {
    const ir: ShortcutIR = {
      name: "Q",
      steps: [
        { type: "action", identifier: `${A}.timer.start`, params: { WFDuration: { quantity: 25, unit: "min" } } },
        { type: "action", identifier: `${A}.list`, params: { WFItems: ["a", "b"] }, ref: "l" },
        { type: "action", identifier: `${A}.count`, params: { WFInput: { ref: "l" } } },
      ],
    };
    const xml = irToPlist(ir);
    expect(xml).toContain("WFQuantityFieldValue");
    expect(xml).toContain("<key>Magnitude</key>");
    expect(xml).toContain("<string>min</string>");
    expect(xml).toContain("<key>Input</key>"); // espelho do Count
  });

  it("marca WFWorkflowHasShortcutInputVariables quando usa ShortcutInput", () => {
    const ir: ShortcutIR = {
      name: "In",
      steps: [{ type: "action", identifier: `${A}.setclipboard`, params: { WFInput: { special: "ShortcutInput" } } }],
    };
    const xml = irToPlist(ir);
    expect(xml).toMatch(/<key>WFWorkflowHasShortcutInputVariables<\/key>\s*<true\/>/);
    expect(xml).toContain("ExtensionInput");
    expect(xml).toContain("WFStringContentItem"); // input classes preenchidas
  });
});

describe("receitas curadas", () => {
  const locales: Locale[] = ["pt", "en", "es"];
  for (const recipe of RECIPES) {
    for (const locale of locales) {
      it(`${recipe.id} valida e serializa em ${locale}`, () => {
        const ir = recipe.build(locale);
        const result = validateIR(ir);
        expect(result.issues.filter((i) => i.severity === "error")).toEqual([]);
        const xml = irToPlist(ir);
        expect(xml).toContain("WFWorkflowActions");
        expect(xml.length).toBeGreaterThan(500);
      });
    }
  }
});
