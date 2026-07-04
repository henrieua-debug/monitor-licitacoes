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
  z
    .object({ kind: z.literal("quantity"), magnitude: z.number(), unit: z.string() })
    .describe("quantidade com unidade, ex. 25 min (para timer, durações)"),
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

// Normalizador de candidatos "quase certos" — modelos gratuitos (Gemini free tier)
// frequentemente erram o envelope, não o conteúdo: params como objeto em vez de
// lista {key,value}, literais crus em vez de {kind:...}, summary como string única.
// Corrigir isso antes do safeParse multiplica a taxa de sucesso do Craig Loop.
export function normalizeGenCandidate(input: unknown): unknown {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return input;
  const obj = { ...(input as Record<string, unknown>) };
  if (typeof obj.summary === "string") obj.summary = [obj.summary];
  if (Array.isArray(obj.steps)) obj.steps = obj.steps.map(normalizeStep);
  return obj;
}

function normalizeStep(step: unknown): unknown {
  if (typeof step !== "object" || step === null) return step;
  const s = { ...(step as Record<string, unknown>) };
  if (s.type === "action") {
    if (s.params && !Array.isArray(s.params) && typeof s.params === "object") {
      s.params = Object.entries(s.params as Record<string, unknown>).map(([key, value]) => ({
        key,
        value: wrapValue(value),
      }));
    } else if (Array.isArray(s.params)) {
      s.params = s.params.map((p) =>
        typeof p === "object" && p !== null && "key" in p
          ? { ...(p as Record<string, unknown>), value: wrapValue((p as Record<string, unknown>).value) }
          : p
      );
    }
  }
  if ((s.type === "if" || s.type === "repeatEach") && typeof s.input === "string") {
    s.input = { ref: s.input };
  }
  return s;
}

function wrapValue(v: unknown): unknown {
  if (typeof v === "object" && v !== null && !Array.isArray(v) && "kind" in v) return v;
  if (typeof v === "string") return { kind: "string", value: v };
  if (typeof v === "number") return { kind: "number", value: v };
  if (typeof v === "boolean") return { kind: "boolean", value: v };
  if (typeof v === "object" && v !== null && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    if (typeof o.var === "string") return { kind: "var", name: o.var };
    if (typeof o.ref === "string") return { kind: "ref", ref: o.ref };
    if (typeof o.special === "string") return { kind: "special", special: o.special };
    if (Array.isArray(o.parts)) return { kind: "text", parts: o.parts };
    if (Array.isArray(o.text)) {
      return { kind: "text", parts: o.text.map((p) => (typeof p === "string" ? { literal: p } : p)) };
    }
    if (typeof o.magnitude === "number" && typeof o.unit === "string") {
      return { kind: "quantity", magnitude: o.magnitude, unit: o.unit };
    }
    if (typeof o.raw === "string") return { kind: "json", raw: o.raw };
  }
  return { kind: "json", raw: JSON.stringify(v ?? null) };
}

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
    case "quantity":
      return { quantity: v.magnitude, unit: v.unit };
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
