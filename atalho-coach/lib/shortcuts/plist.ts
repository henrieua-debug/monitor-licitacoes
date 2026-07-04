// Serializador IR → plist XML (.shortcut não assinado, formato aceito pelo `shortcuts sign`).
// Especificação verificada contra exports reais do app Atalhos e o compilador Cherri:
// - attachments usam offsets UTF-16 (em JS, índices de string JÁ são UTF-16) e placeholder U+FFFC;
// - parâmetros de EXIBIÇÃO exigem WFTextTokenString (attachment puro renderiza vazio);
// - o WFInput do conditional tem wrapper especial {Type:"Variable", Variable:{...}};
// - WFControlFlowMode é <integer>; booleans são <true/>/<false/>; WFItemType 0=texto 1=dict 2=array 3=número 4=bool.

import { getAction } from "./catalog";
import type {
  IRConditionOperator,
  IRInterpolatedText,
  IRStep,
  IRValue,
  IRVariableRef,
  ShortcutIR,
} from "./types";

// ---------------------------------------------------------------------------
// Árvore de plist: valores JS + marcadores explícitos para tipos ambíguos.

type PNode =
  | string
  | number
  | boolean
  | PNode[]
  | { [key: string]: PNode }
  | PInt
  | PReal;

class PInt {
  constructor(public v: number) {}
}
class PReal {
  constructor(public v: number) {}
}

const int = (v: number) => new PInt(Math.trunc(v));

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function writeNode(node: PNode, indent: string, out: string[]): void {
  if (node instanceof PInt) {
    out.push(`${indent}<integer>${node.v}</integer>`);
  } else if (node instanceof PReal) {
    out.push(`${indent}<real>${node.v}</real>`);
  } else if (typeof node === "string") {
    out.push(`${indent}<string>${esc(node)}</string>`);
  } else if (typeof node === "boolean") {
    out.push(`${indent}${node ? "<true/>" : "<false/>"}`);
  } else if (typeof node === "number") {
    if (Number.isInteger(node)) out.push(`${indent}<integer>${node}</integer>`);
    else out.push(`${indent}<real>${node}</real>`);
  } else if (Array.isArray(node)) {
    if (node.length === 0) {
      out.push(`${indent}<array/>`);
      return;
    }
    out.push(`${indent}<array>`);
    for (const item of node) writeNode(item, indent + "\t", out);
    out.push(`${indent}</array>`);
  } else {
    const entries = Object.entries(node);
    if (entries.length === 0) {
      out.push(`${indent}<dict/>`);
      return;
    }
    out.push(`${indent}<dict>`);
    for (const [k, v] of entries) {
      out.push(`${indent}\t<key>${esc(k)}</key>`);
      writeNode(v, indent + "\t", out);
    }
    out.push(`${indent}</dict>`);
  }
}

// ---------------------------------------------------------------------------
// UUIDs e contexto de serialização.

export function newUUID(): string {
  const c = globalThis.crypto;
  return c.randomUUID().toUpperCase();
}

interface RefInfo {
  uuid: string;
  outputName: string;
}

interface Ctx {
  refs: Map<string, RefInfo>;
  usesShortcutInput: boolean;
}

function attachmentValue(ref: IRVariableRef, ctx: Ctx): Record<string, PNode> {
  if (ref.special) {
    switch (ref.special) {
      case "ShortcutInput":
        ctx.usesShortcutInput = true;
        return { Type: "ExtensionInput" };
      case "Clipboard":
        return { Type: "Clipboard" };
      case "CurrentDate":
        return { Type: "CurrentDate" };
      case "Ask":
        return { Type: "Ask" };
      case "DeviceDetails":
        return { Type: "DeviceDetails" };
      // Dentro de loops, item/índice são variáveis nomeadas mágicas — nunca ActionOutput.
      case "RepeatItem":
        return { Type: "Variable", VariableName: "Repeat Item" };
      case "RepeatIndex":
        return { Type: "Variable", VariableName: "Repeat Index" };
    }
  }
  if (ref.var) return { Type: "Variable", VariableName: ref.var };
  if (ref.ref) {
    const info = ctx.refs.get(ref.ref);
    if (!info) throw new Error(`ref desconhecida: "${ref.ref}" (valide o IR antes de serializar)`);
    return { Type: "ActionOutput", OutputUUID: info.uuid, OutputName: info.outputName };
  }
  throw new Error("referência vazia: informe var, ref ou special");
}

function tokenAttachment(ref: IRVariableRef, ctx: Ctx): Record<string, PNode> {
  return { Value: attachmentValue(ref, ctx), WFSerializationType: "WFTextTokenAttachment" };
}

/** Monta um WFTextTokenString a partir de partes literais e referências (offsets UTF-16). */
function tokenString(parts: (string | IRVariableRef)[], ctx: Ctx): Record<string, PNode> {
  let s = "";
  const attachments: Record<string, PNode> = {};
  for (const part of parts) {
    if (typeof part === "string") {
      s += part;
    } else {
      // Em JS, .length conta code units UTF-16 — exatamente o que o formato exige.
      attachments[`{${s.length}, 1}`] = attachmentValue(part, ctx);
      s += "￼";
    }
  }
  const value: Record<string, PNode> = { string: s };
  if (Object.keys(attachments).length > 0) value.attachmentsByRange = attachments;
  return { Value: value, WFSerializationType: "WFTextTokenString" };
}

// Parâmetros de exibição: attachment puro renderiza vazio em runtime — sempre token string.
// WFURL também prefere token string (attachment puro pode quebrar a importação).
const DISPLAY_PARAM_KEYS = new Set([
  "WFAlertActionMessage",
  "WFAlertActionTitle",
  "WFNotificationActionBody",
  "WFNotificationActionTitle",
  "Text",
  "WFTextActionText",
  "WFURL",
  "WFURLActionURL",
  "WFAskActionPrompt",
  "WFSendMessageContent",
]);

// Literais numéricos que o app grava como <string> (verificado em exports reais).
const NUMBER_AS_STRING_KEYS = new Set(["WFNumberActionNumber", "WFMathOperand", "WFNumberValue"]);

// Parâmetros que são dicts PLANOS de plist (não WFDictionaryFieldValue).
const RAW_DICT_KEYS = new Set(["WFSelectedApp", "FocusModes", "AppIntentDescriptor", "IntentAppDefinition"]);

function isRef(v: IRValue): v is IRVariableRef {
  return typeof v === "object" && v !== null && !Array.isArray(v) &&
    ("var" in v || "ref" in v || "special" in v) && !("text" in v) && !("dict" in v);
}

function isInterpolated(v: IRValue): v is IRInterpolatedText {
  return typeof v === "object" && v !== null && "text" in v && Array.isArray((v as IRInterpolatedText).text);
}

/** Serializa um dicionário/array no formato WFDictionaryFieldValue / WFArrayParameterState. */
function dictionaryItems(entries: Record<string, IRValue>, ctx: Ctx): PNode[] {
  return Object.entries(entries).map(([k, v]) => dictionaryItem(k, v, ctx));
}

function dictionaryItem(key: string, v: IRValue, ctx: Ctx): PNode {
  const wfKey = tokenString([key], ctx);
  if (typeof v === "boolean") {
    return { WFItemType: int(4), WFKey: wfKey, WFValue: { Value: v, WFSerializationType: "WFNumberSubstitutableState" } };
  }
  if (typeof v === "number") {
    return { WFItemType: int(3), WFKey: wfKey, WFValue: tokenString([String(v)], ctx) };
  }
  if (Array.isArray(v)) {
    return {
      WFItemType: int(2),
      WFKey: wfKey,
      WFValue: { Value: v.map((item, i) => arrayItem(item, i, ctx)), WFSerializationType: "WFArrayParameterState" },
    };
  }
  if (typeof v === "object" && v !== null && "dict" in v) {
    return {
      WFItemType: int(1),
      WFKey: wfKey,
      WFValue: {
        Value: { Value: { WFDictionaryFieldValueItems: dictionaryItems(v.dict, ctx) }, WFSerializationType: "WFDictionaryFieldValue" },
        WFSerializationType: "WFDictionaryFieldValue",
      },
    };
  }
  // string / referência / texto interpolado
  const parts = isRef(v) ? [v] : isInterpolated(v) ? v.text : [String(v)];
  return { WFItemType: int(0), WFKey: wfKey, WFValue: tokenString(parts, ctx) };
}

function arrayItem(v: IRValue, index: number, ctx: Ctx): PNode {
  if (typeof v === "object" && v !== null && "dict" in v && !Array.isArray(v)) {
    return {
      WFItemType: int(1),
      WFValue: {
        Value: { Value: { WFDictionaryFieldValueItems: dictionaryItems(v.dict, ctx) }, WFSerializationType: "WFDictionaryFieldValue" },
        WFSerializationType: "WFDictionaryFieldValue",
      },
    };
  }
  const parts = isRef(v) ? [v] : isInterpolated(v) ? v.text : [String(v)];
  return { WFItemType: int(0), WFValue: tokenString(parts, ctx) };
}

/** Converte um IRValue no nó plist do parâmetro. */
function paramValue(key: string, v: IRValue, ctx: Ctx): PNode {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") {
    return NUMBER_AS_STRING_KEYS.has(key) ? String(v) : v;
  }
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    // Listas simples (ex.: WFItems da ação List) — itens como token strings.
    return v.map((item, i) => arrayItem(item, i, ctx));
  }
  if (isInterpolated(v)) return tokenString(v.text, ctx);
  if ("askEachTime" in v && v.askEachTime) {
    const value: Record<string, PNode> = { Type: "Ask" };
    if (v.prompt) value.Prompt = v.prompt;
    return { Value: value, WFSerializationType: "WFTextTokenAttachment" };
  }
  if ("quantity" in v && "unit" in v) {
    return {
      Value: { Magnitude: new PReal(v.quantity), Unit: v.unit },
      WFSerializationType: "WFQuantityFieldValue",
    };
  }
  if ("dict" in v) {
    if (RAW_DICT_KEYS.has(key)) {
      const raw: Record<string, PNode> = {};
      for (const [k, val] of Object.entries(v.dict)) {
        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") raw[k] = val;
      }
      return raw;
    }
    return {
      Value: { WFDictionaryFieldValueItems: dictionaryItems(v.dict, ctx) },
      WFSerializationType: "WFDictionaryFieldValue",
    };
  }
  if (isRef(v)) {
    return DISPLAY_PARAM_KEYS.has(key) ? tokenString([v], ctx) : tokenAttachment(v, ctx);
  }
  throw new Error(`valor de parâmetro não suportado em ${key}`);
}

// ---------------------------------------------------------------------------
// Condições do If (códigos verificados contra atalho de amostra da Apple).

const CONDITION_CODES: Record<IRConditionOperator, number> = {
  lessThan: 0,
  greaterThan: 2,
  equals: 4,
  notEquals: 5,
  beginsWith: 8,
  endsWith: 9,
  contains: 99,
  hasValue: 100,
  hasNoValue: 101,
  notContains: 999,
};

const NUMBER_OPERATORS = new Set<IRConditionOperator>(["lessThan", "greaterThan"]);
const EXISTENCE_OPERATORS = new Set<IRConditionOperator>(["hasValue", "hasNoValue"]);

// ---------------------------------------------------------------------------
// Serialização principal.

const INPUT_CONTENT_ITEM_CLASSES = [
  "WFAppStoreAppContentItem",
  "WFArticleContentItem",
  "WFContactContentItem",
  "WFDateContentItem",
  "WFEmailAddressContentItem",
  "WFGenericFileContentItem",
  "WFImageContentItem",
  "WFiTunesProductContentItem",
  "WFLocationContentItem",
  "WFDCMapsLinkContentItem",
  "WFAVAssetContentItem",
  "WFPDFContentItem",
  "WFPhoneNumberContentItem",
  "WFRichTextContentItem",
  "WFSafariWebPageContentItem",
  "WFStringContentItem",
  "WFURLContentItem",
];

const DEFAULT_GLYPH = 61440;
const DEFAULT_COLOR = 463140863; // azul

export function irToPlist(ir: ShortcutIR): string {
  const ctx: Ctx = { refs: new Map(), usesShortcutInput: false };

  // 1º passe: UUID para toda ação com `ref` + nome da saída (catálogo ou fallback).
  for (const step of ir.steps) {
    if (step.type === "action" && step.ref) {
      const catalog = getAction(step.identifier);
      const outputName =
        step.customOutputName ??
        catalog?.outputName ??
        catalog?.name ??
        step.identifier.split(".").pop() ??
        "Output";
      ctx.refs.set(step.ref, { uuid: newUUID(), outputName });
    }
  }

  const actions: PNode[] = [];
  // Pilha de blocos abertos; menus carregam os itens para casar título por posição.
  const stack: { kind: "if" | "repeat" | "menu"; grouping: string; identifier: string }[] = [];

  for (const step of ir.steps) {
    switch (step.type) {
      case "action": {
        const params: Record<string, PNode> = {};
        if (step.ref) params.UUID = ctx.refs.get(step.ref)!.uuid;
        if (step.customOutputName) params.CustomOutputName = step.customOutputName;
        for (const [k, v] of Object.entries(step.params ?? {})) {
          params[k] = paramValue(k, v, ctx);
        }
        // Open App em OS recentes espera também o dict plano WFSelectedApp.
        if (step.identifier === "is.workflow.actions.openapp" && typeof params.WFAppIdentifier === "string") {
          params.WFSelectedApp = { BundleIdentifier: params.WFAppIdentifier };
        }
        // Count exige as chaves Input e WFInput com o mesmo attachment.
        if (step.identifier === "is.workflow.actions.count" && params.WFInput !== undefined && params.Input === undefined) {
          params.Input = params.WFInput;
        }
        actions.push({ WFWorkflowActionIdentifier: step.identifier, WFWorkflowActionParameters: params });
        break;
      }

      case "if": {
        const grouping = newUUID();
        stack.push({ kind: "if", grouping, identifier: "is.workflow.actions.conditional" });
        const params: Record<string, PNode> = {
          GroupingIdentifier: grouping,
          WFControlFlowMode: int(0),
          WFCondition: int(CONDITION_CODES[step.operator]),
          // Wrapper ESPECIAL do conditional — attachment "nu" importa como chip em branco.
          WFInput: { Type: "Variable", Variable: tokenAttachment(step.input, ctx) },
        };
        if (NUMBER_OPERATORS.has(step.operator)) {
          params.WFNumberValue = String(step.value ?? 0);
        } else if (!EXISTENCE_OPERATORS.has(step.operator)) {
          params.WFConditionalActionString = String(step.value ?? "");
        }
        actions.push({
          WFWorkflowActionIdentifier: "is.workflow.actions.conditional",
          WFWorkflowActionParameters: params,
        });
        break;
      }

      case "otherwise": {
        const block = stack[stack.length - 1];
        actions.push({
          WFWorkflowActionIdentifier: "is.workflow.actions.conditional",
          WFWorkflowActionParameters: { GroupingIdentifier: block.grouping, WFControlFlowMode: int(1) },
        });
        break;
      }

      case "endif": {
        const block = stack.pop()!;
        actions.push({
          WFWorkflowActionIdentifier: "is.workflow.actions.conditional",
          WFWorkflowActionParameters: { GroupingIdentifier: block.grouping, WFControlFlowMode: int(2) },
        });
        break;
      }

      case "repeat": {
        const grouping = newUUID();
        stack.push({ kind: "repeat", grouping, identifier: "is.workflow.actions.repeat.count" });
        actions.push({
          WFWorkflowActionIdentifier: "is.workflow.actions.repeat.count",
          WFWorkflowActionParameters: {
            GroupingIdentifier: grouping,
            WFControlFlowMode: int(0),
            WFRepeatCount: int(step.count),
          },
        });
        break;
      }

      case "repeatEach": {
        const grouping = newUUID();
        stack.push({ kind: "repeat", grouping, identifier: "is.workflow.actions.repeat.each" });
        actions.push({
          WFWorkflowActionIdentifier: "is.workflow.actions.repeat.each",
          WFWorkflowActionParameters: {
            GroupingIdentifier: grouping,
            WFControlFlowMode: int(0),
            WFInput: tokenAttachment(step.input, ctx),
          },
        });
        break;
      }

      case "endrepeat": {
        const block = stack.pop()!;
        actions.push({
          WFWorkflowActionIdentifier: block.identifier,
          WFWorkflowActionParameters: { GroupingIdentifier: block.grouping, WFControlFlowMode: int(2) },
        });
        break;
      }

      case "menu": {
        const grouping = newUUID();
        stack.push({ kind: "menu", grouping, identifier: "is.workflow.actions.choosefrommenu" });
        actions.push({
          WFWorkflowActionIdentifier: "is.workflow.actions.choosefrommenu",
          WFWorkflowActionParameters: {
            GroupingIdentifier: grouping,
            WFControlFlowMode: int(0),
            WFMenuPrompt: step.prompt,
            WFMenuItems: step.items,
          },
        });
        break;
      }

      case "case": {
        const block = stack[stack.length - 1];
        actions.push({
          WFWorkflowActionIdentifier: "is.workflow.actions.choosefrommenu",
          WFWorkflowActionParameters: {
            GroupingIdentifier: block.grouping,
            WFControlFlowMode: int(1),
            WFMenuItemTitle: step.label,
          },
        });
        break;
      }

      case "endmenu": {
        const block = stack.pop()!;
        actions.push({
          WFWorkflowActionIdentifier: "is.workflow.actions.choosefrommenu",
          WFWorkflowActionParameters: { GroupingIdentifier: block.grouping, WFControlFlowMode: int(2) },
        });
        break;
      }
    }
  }

  const root: Record<string, PNode> = {
    WFQuickActionSurfaces: [],
    WFWorkflowActions: actions,
    WFWorkflowClientVersion: "2700.0.4",
    WFWorkflowHasOutputFallback: false,
    WFWorkflowHasShortcutInputVariables: ctx.usesShortcutInput,
    WFWorkflowIcon: {
      WFWorkflowIconGlyphNumber: int(ir.iconGlyph ?? DEFAULT_GLYPH),
      WFWorkflowIconStartColor: int(ir.iconColor ?? DEFAULT_COLOR),
    },
    WFWorkflowImportQuestions: [],
    WFWorkflowInputContentItemClasses: ctx.usesShortcutInput ? INPUT_CONTENT_ITEM_CLASSES : [],
    WFWorkflowMinimumClientVersion: int(900),
    WFWorkflowMinimumClientVersionString: "900",
    WFWorkflowOutputContentItemClasses: [],
    WFWorkflowTypes: [],
  };

  const out: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
  ];
  writeNode(root, "", out);
  out.push("</plist>");
  return out.join("\n") + "\n";
}
