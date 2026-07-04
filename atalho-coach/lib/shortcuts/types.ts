// Representação intermediária (IR) de um atalho. O modelo gera IR (não plist cru):
// o serializador cuida de UUIDs, GroupingIdentifiers e attachments — as partes que
// mais quebram quando um LLM escreve XML direto.
//
// O IR é PLANO (if/endif, repeat/endrepeat, menu/case/endmenu) por dois motivos:
// 1. espelha o formato real do plist (WFControlFlowMode 0/1/2 + GroupingIdentifier);
// 2. structured outputs da API não aceitam schemas recursivos — uma lista plana
//    com marcadores valida com schema fixo, e o balanceamento vira checagem do validador.

/** Fontes especiais do sistema referenciáveis em parâmetros. */
export type IRSpecial =
  | "ShortcutInput"
  | "Clipboard"
  | "CurrentDate"
  | "Ask"
  | "RepeatItem"
  | "RepeatIndex"
  | "DeviceDetails";

/** Referência a uma variável nomeada, à saída de uma ação anterior ou a uma fonte especial. */
export interface IRVariableRef {
  /** Nome de variável criada com is.workflow.actions.setvariable. */
  var?: string;
  /** `ref` declarado numa ação anterior (referencia a saída dela). */
  ref?: string;
  special?: IRSpecial;
}

/** Pede o valor ao usuário no momento da execução (Ask Each Time). */
export interface IRAskEachTime {
  askEachTime: true;
  prompt?: string;
}

/** Texto com variáveis interpoladas: partes alternam string literal e referência. */
export interface IRInterpolatedText {
  text: (string | IRVariableRef)[];
}

export interface IRDictionary {
  dict: Record<string, IRValue>;
}

/** Quantidade com unidade (WFQuantityFieldValue), ex. { quantity: 25, unit: "min" }. */
export interface IRQuantity {
  quantity: number;
  unit: string;
}

export type IRValue =
  | string
  | number
  | boolean
  | IRVariableRef
  | IRAskEachTime
  | IRInterpolatedText
  | IRDictionary
  | IRQuantity
  | IRValue[];

/** Operadores de condição suportados pelo If. */
export type IRConditionOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "beginsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "hasValue"
  | "hasNoValue";

export type IRStep =
  | IRActionStep
  | { type: "if"; input: IRVariableRef; operator: IRConditionOperator; value?: string | number }
  | { type: "otherwise" }
  | { type: "endif" }
  | { type: "repeat"; count: number }
  | { type: "repeatEach"; input: IRVariableRef }
  | { type: "endrepeat" }
  | { type: "menu"; prompt: string; items: string[] }
  | { type: "case"; label: string }
  | { type: "endmenu" };

export interface IRActionStep {
  type: "action";
  /** Identificador completo, ex.: "is.workflow.actions.gettext". */
  identifier: string;
  params?: Record<string, IRValue>;
  /** Id local para outras ações referenciarem a saída desta ({ ref: "..." }). */
  ref?: string;
  /** Nome customizado da saída (aparece no editor do Atalhos). */
  customOutputName?: string;
}

export interface ShortcutIR {
  /** Nome do atalho no idioma do usuário. */
  name: string;
  /** Cor do ícone (WFWorkflowIconStartColor) — opcional. */
  iconColor?: number;
  /** Glyph do ícone (WFWorkflowIconGlyphNumber) — opcional. */
  iconGlyph?: number;
  steps: IRStep[];
}

export interface ValidationIssue {
  severity: "error" | "warning";
  /** Código estável da checagem, ex.: "unknown-action". */
  code: string;
  message: string;
  /** Índice do passo com problema. */
  step?: number;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

/** Entrada do catálogo de ações verificado. */
export interface CatalogParam {
  key: string;
  type: "string" | "tokenstring" | "number" | "boolean" | "enum" | "dictionary" | "array" | "attachment";
  required: boolean;
  enumValues?: string[];
  description?: string;
}

export interface CatalogAction {
  identifier: string;
  name: string;
  category: string;
  params: CatalogParam[];
  hasOutput: boolean;
  outputName?: string;
  notes?: string;
}
