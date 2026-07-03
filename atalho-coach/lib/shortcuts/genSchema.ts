// Schema Zod do que o MODELO devolve (structured outputs) + conversão para o IR.
// Restrições do structured outputs: sem schemas recursivos e sem additionalProperties
// dinâmico — por isso params são pares {key, value} e dicts/arrays viajam como JSON string.

import { z } from "zod";
import type {
  IRInterpolatedText,
  IRStep,
  IRValue,
  IRVariableRef,
  ShortcutIR,
} from "./types";

const SPECIALS = [
  "ShortcutInput",
  "Clipboard",
  "CurrentDate",
  "Ask",
  "RepeatItem",
  "RepeatIndex",
  "DeviceDetails",
] as const;

const OPERATORS = [
  "equals",
  "notEquals",
  "contains",
  "notContains",
  "beginsWith",
  "endsWith",
  "greaterThan",
  "lessThan",
  "hasValue",
  "hasNoValue",
] as const;

const GenRef = z.object({
  var: z.string().optional().describe("nome de variável criada com setvariable"),
  ref: z.string().optional().describe("ref de uma ação anterior"),
  special: z.enum(SPECIALS).optional(),
});

const GenTextPart = z.object({
  literal: z.string().optional(),
  var: z.string().optional(),
  ref: z.string().optional(),
  special: z.enum(SPECIALS).optional(),
});

const GenValue = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("string"), value: z.string() }),
  z.object({ kind: z.literal("number"), value: z.number() }),
  z.object({ kind: z.literal("boolean"), value: z.boolean() }),
  z.object({ kind: z.literal("var"), name: z.string() }),
  z.object({ kind: z.literal("ref"), ref: z.string() }),
  z.object({ kind: z.literal("special"), special: z.enum(SPECIALS) }),
  z.object({ kind: z.literal("askEachTime"), prompt: z.string().optional() }),
  z
    .object({ kind: z.literal("text"), parts: z.array(GenTextPart) })
    .describe("texto com variáveis interpoladas"),
  z
    .object({ kind: z.literal("json"), raw: z.string() })
    .describe("dicionário ou lista, codificado como JSON string"),
]);

const GenParam = z.object({ key: z.string(), value: GenValue });

const GenStep = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("action"),
    identifier: z.string().describe("identificador do catálogo, ex. is.workflow.actions.gettext"),
    params: z.array(GenParam).optional(),
    ref: z.string().optional().describe("id local para referenciar a saída desta ação"),
  }),
  z.object({
    type: z.literal("if"),
    input: GenRef,
    operator: z.enum(OPERATORS),
    value: z.union([z.string(), z.number()]).optional(),
  }),
  z.object({ type: z.literal("otherwise") }),
  z.object({ type: z.literal("endif") }),
  z.object({ type: z.literal("repeat"), count: z.number() }),
  z.object({ type: z.literal("repeatEach"), input: GenRef }),
  z.object({ type: z.literal("endrepeat") }),
  z.object({ type: z.literal("menu"), prompt: z.string(), items: z.array(z.string()) }),
  z.object({ type: z.literal("case"), label: z.string() }),
  z.object({ type: z.literal("endmenu") }),
]);

export const GenShortcutSchema = z.object({
  name: z.string().describe("nome curto do atalho, no idioma do usuário"),
  summary: z
    .array(z.string())
    .describe("o que o atalho faz, passo a passo, em frases curtas no idioma do usuário"),
  steps: z.array(GenStep),
});

export type GenShortcut = z.infer<typeof GenShortcutSchema>;
type GenValueT = z.infer<typeof GenValue>;
type GenRefT = z.infer<typeof GenRef>;

function refToIR(r: GenRefT): IRVariableRef {
  return { var: r.var, ref: r.ref, special: r.special };
}

function jsonToIRValue(v: unknown): IRValue {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.map(jsonToIRValue);
  const dict: Record<string, IRValue> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) dict[k] = jsonToIRValue(val);
  return { dict };
}

function valueToIR(v: GenValueT): IRValue {
  switch (v.kind) {
    case "string":
    case "number":
    case "boolean":
      return v.value;
    case "var":
      return { var: v.name };
    case "ref":
      return { ref: v.ref };
    case "special":
      return { special: v.special };
    case "askEachTime":
      return { askEachTime: true, prompt: v.prompt };
    case "text": {
      const parts: IRInterpolatedText["text"] = v.parts.map((p) =>
        p.literal !== undefined ? p.literal : { var: p.var, ref: p.ref, special: p.special }
      );
      return { text: parts };
    }
    case "json": {
      try {
        return jsonToIRValue(JSON.parse(v.raw));
      } catch {
        // JSON inválido vira string literal; o validador aponta se o parâmetro exigia dict.
        return v.raw;
      }
    }
  }
}

export function genToIR(gen: GenShortcut): ShortcutIR {
  const steps: IRStep[] = gen.steps.map((s) => {
    switch (s.type) {
      case "action": {
        const params: Record<string, IRValue> = {};
        for (const p of s.params ?? []) params[p.key] = valueToIR(p.value);
        return { type: "action", identifier: s.identifier, params, ref: s.ref };
      }
      case "if":
        return { type: "if", input: refToIR(s.input), operator: s.operator, value: s.value };
      case "repeatEach":
        return { type: "repeatEach", input: refToIR(s.input) };
      default:
        return s;
    }
  });
  return { name: gen.name, steps };
}
