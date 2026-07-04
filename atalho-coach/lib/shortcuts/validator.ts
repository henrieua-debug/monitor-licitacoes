// Validador do IR — o "Craig Loop". Roda antes da serialização; cada erro volta
// para o modelo com índice do passo e mensagem acionável, no espírito do validador
// do Shortcuts Playground (MIT, Federico Viticci/MacStories), portado para o IR.

import { getAction } from "./catalog";
import type {
  IRStep,
  IRValue,
  IRVariableRef,
  ShortcutIR,
  ValidationIssue,
  ValidationResult,
} from "./types";

const NEEDS_VALUE = new Set(["equals", "notEquals", "contains", "notContains", "beginsWith", "endsWith", "greaterThan", "lessThan"]);
const EXISTENCE = new Set(["hasValue", "hasNoValue"]);
const ALLOW_EMPTY_STRING_KEYS = new Set(["WFReplaceTextReplace", "WFTextCustomSeparator"]);

function* iterRefs(v: IRValue): Generator<IRVariableRef> {
  if (typeof v !== "object" || v === null) return;
  if (Array.isArray(v)) {
    for (const item of v) yield* iterRefs(item);
    return;
  }
  if ("text" in v && Array.isArray(v.text)) {
    for (const part of v.text) if (typeof part !== "string") yield part;
    return;
  }
  if ("dict" in v) {
    for (const val of Object.values(v.dict)) yield* iterRefs(val);
    return;
  }
  if ("askEachTime" in v) return;
  if ("var" in v || "ref" in v || "special" in v) yield v as IRVariableRef;
}

export function validateIR(ir: ShortcutIR): ValidationResult {
  const issues: ValidationIssue[] = [];
  const err = (code: string, message: string, step?: number) =>
    issues.push({ severity: "error", code, message, step });
  const warn = (code: string, message: string, step?: number) =>
    issues.push({ severity: "warning", code, message, step });

  if (!ir.name || !ir.name.trim()) err("empty-name", "O atalho precisa de um nome.");
  if (!ir.steps || ir.steps.length === 0) err("no-steps", "O atalho não tem nenhum passo.");

  // Saídas (ref) e variáveis definidas até cada ponto; blocos abertos.
  const definedRefs = new Set<string>();
  const definedVars = new Set<string>();
  const stack: { kind: "if" | "repeat" | "repeatEach" | "menu"; sawOtherwise?: boolean; items?: string[]; caseCount?: number; openedAt: number }[] = [];

  const checkRef = (ref: IRVariableRef, i: number, where: string) => {
    const keys = [ref.var, ref.ref, ref.special].filter((x) => x !== undefined).length;
    if (keys === 0) {
      err("empty-ref", `Referência vazia em ${where}: informe var, ref ou special.`, i);
      return;
    }
    if (keys > 1) err("ambiguous-ref", `Referência ambígua em ${where}: use só um de var/ref/special.`, i);
    if (ref.ref !== undefined && !definedRefs.has(ref.ref)) {
      err("unknown-ref", `"${ref.ref}" em ${where} não corresponde ao ref de nenhuma ação ANTERIOR. Declare ref na ação que produz o valor.`, i);
    }
    if (ref.var !== undefined && !definedVars.has(ref.var)) {
      err("unknown-var", `Variável "${ref.var}" usada em ${where} antes de um setvariable com WFVariableName="${ref.var}".`, i);
    }
    if ((ref.special === "RepeatItem" || ref.special === "RepeatIndex") && !stack.some((b) => b.kind === "repeat" || b.kind === "repeatEach")) {
      err("repeat-item-outside-loop", `${ref.special} usado fora de um bloco repeat/repeatEach.`, i);
    }
  };

  ir.steps.forEach((step: IRStep, i: number) => {
    switch (step.type) {
      case "action": {
        const action = getAction(step.identifier);
        if (!action) {
          err(
            "unknown-action",
            `Ação desconhecida "${step.identifier}". Use APENAS identificadores do catálogo fornecido. Para integrar apps sem ação no catálogo, use is.workflow.actions.openurl com o esquema de URL do app.`,
            i
          );
          break;
        }
        const params = step.params ?? {};
        const known = new Map(action.params.map((p) => [p.key, p]));

        for (const p of action.params) {
          if (p.required && !(p.key in params)) {
            err("missing-param", `${action.name}: parâmetro obrigatório ${p.key} ausente.`, i);
          }
        }

        for (const [key, value] of Object.entries(params)) {
          const spec = known.get(key);
          if (!spec) {
            err("unknown-param", `${action.name}: parâmetro "${key}" não existe. Parâmetros válidos: ${action.params.map((p) => p.key).join(", ") || "(nenhum)"}.`, i);
            continue;
          }
          if (typeof value === "string" && value.trim() === "" && !ALLOW_EMPTY_STRING_KEYS.has(key)) {
            err("empty-param", `${action.name}: ${key} está vazio.`, i);
          }
          if (spec.type === "enum" && typeof value === "string" && spec.enumValues && !spec.enumValues.includes(value)) {
            err("invalid-enum", `${action.name}: ${key}="${value}" inválido. Valores aceitos: ${spec.enumValues.join(", ")}.`, i);
          }
          for (const ref of iterRefs(value)) checkRef(ref, i, `${action.name}.${key}`);
        }

        // Heurística do Calculate: operadores ASCII degradam silenciosamente para soma.
        if (step.identifier === "is.workflow.actions.math") {
          const op = params.WFMathOperation;
          if (op === "*" || op === "/") {
            err("ascii-math-operator", `Calculate: use os caracteres Unicode × (multiplicação) e ÷ (divisão) — "${op}" vira soma silenciosamente.`, i);
          }
          if (op === "+") err("plus-operator", "Calculate: OMITA WFMathOperation para soma.", i);
        }

        if (step.identifier === "is.workflow.actions.setvariable" || step.identifier === "is.workflow.actions.appendvariable") {
          const name = params.WFVariableName;
          if (typeof name === "string" && name.trim()) definedVars.add(name);
        }

        if (step.ref) {
          if (!action.hasOutput) warn("ref-without-output", `${action.name} não produz saída, mas declara ref="${step.ref}".`, i);
          definedRefs.add(step.ref);
        }
        break;
      }

      case "if": {
        checkRef(step.input, i, "if.input");
        if (NEEDS_VALUE.has(step.operator) && (step.value === undefined || step.value === "")) {
          err("missing-condition-value", `If com operador "${step.operator}" exige value.`, i);
        }
        if (EXISTENCE.has(step.operator) && step.value !== undefined) {
          warn("extra-condition-value", `If com operador "${step.operator}" ignora value.`, i);
        }
        stack.push({ kind: "if", openedAt: i });
        break;
      }

      case "otherwise": {
        const top = stack[stack.length - 1];
        if (!top || top.kind !== "if") err("orphan-otherwise", "otherwise fora de um bloco if.", i);
        else if (top.sawOtherwise) err("double-otherwise", "Segundo otherwise no mesmo if.", i);
        else top.sawOtherwise = true;
        break;
      }

      case "endif": {
        const top = stack.pop();
        if (!top || top.kind !== "if") err("orphan-endif", "endif sem if correspondente.", i);
        break;
      }

      case "repeat": {
        if (!Number.isFinite(step.count) || step.count < 1) err("invalid-repeat-count", "repeat.count deve ser >= 1.", i);
        stack.push({ kind: "repeat", openedAt: i });
        break;
      }

      case "repeatEach": {
        checkRef(step.input, i, "repeatEach.input");
        stack.push({ kind: "repeatEach", openedAt: i });
        break;
      }

      case "endrepeat": {
        const top = stack.pop();
        if (!top || (top.kind !== "repeat" && top.kind !== "repeatEach")) err("orphan-endrepeat", "endrepeat sem repeat correspondente.", i);
        break;
      }

      case "menu": {
        if (!step.items || step.items.length === 0) err("empty-menu", "menu precisa de pelo menos 1 item.", i);
        if (!step.prompt || !step.prompt.trim()) err("empty-menu-prompt", "menu precisa de prompt.", i);
        stack.push({ kind: "menu", items: step.items, caseCount: 0, openedAt: i });
        break;
      }

      case "case": {
        const top = stack[stack.length - 1];
        if (!top || top.kind !== "menu") {
          err("orphan-case", "case fora de um bloco menu.", i);
          break;
        }
        const expected = top.items?.[top.caseCount ?? 0];
        if (expected !== step.label) {
          err("case-label-mismatch", `case "${step.label}" não casa com o item ${(top.caseCount ?? 0) + 1} do menu ("${expected ?? "?"}"). Os cases devem seguir a MESMA ordem e texto EXATO de menu.items.`, i);
        }
        top.caseCount = (top.caseCount ?? 0) + 1;
        break;
      }

      case "endmenu": {
        const top = stack.pop();
        if (!top || top.kind !== "menu") {
          err("orphan-endmenu", "endmenu sem menu correspondente.", i);
          break;
        }
        if ((top.caseCount ?? 0) !== (top.items?.length ?? 0)) {
          err("menu-case-count", `menu tem ${top.items?.length} itens mas ${top.caseCount} cases — precisa de um case por item, na mesma ordem.`, top.openedAt);
        }
        break;
      }
    }
  });

  for (const open of stack) {
    err("unclosed-block", `Bloco ${open.kind} aberto no passo ${open.openedAt} nunca foi fechado (falta end${open.kind === "menu" ? "menu" : open.kind === "if" ? "if" : "repeat"}).`, open.openedAt);
  }

  return { ok: !issues.some((x) => x.severity === "error"), issues };
}

/** Formata os problemas para realimentar o modelo (Craig Loop). */
export function issuesForModel(result: ValidationResult): string {
  return result.issues
    .map((x) => `- [${x.severity}] passo ${x.step ?? "-"} (${x.code}): ${x.message}`)
    .join("\n");
}
