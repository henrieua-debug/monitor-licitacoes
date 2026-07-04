// Catálogo VERIFICADO de ações do app Atalhos.
// Fontes: exports XML reais do app (corpus golden do Shortcuts Playground, MIT),
// structs do compilador Cherri e docs da comunidade (sebj/iOS-Shortcuts-Reference,
// zachary7829). Ações cujo esquema não foi confirmado ficam FORA — o gerador
// contorna com openurl + esquemas de URL dos apps, que são estáveis.

import type { CatalogAction } from "./types";

const A = "is.workflow.actions";

export const CATALOG: CatalogAction[] = [
  // ---------- texto ----------
  {
    identifier: `${A}.comment`,
    name: "Comment",
    category: "scripting",
    params: [{ key: "WFCommentActionText", type: "string", required: true, description: "texto do comentário" }],
    hasOutput: false,
    notes: "Use como 1º passo para explicar o que o atalho faz.",
  },
  {
    identifier: `${A}.gettext`,
    name: "Text",
    category: "text",
    params: [{ key: "WFTextActionText", type: "tokenstring", required: true }],
    hasOutput: true,
    outputName: "Text",
  },
  {
    identifier: `${A}.text.split`,
    name: "Split Text",
    category: "text",
    params: [
      { key: "text", type: "attachment", required: true, description: "texto a dividir" },
      { key: "WFTextSeparator", type: "enum", required: false, enumValues: ["New Lines", "Spaces", "Every Character", "Custom"] },
      { key: "WFTextCustomSeparator", type: "string", required: false },
    ],
    hasOutput: true,
    outputName: "Split Text",
  },
  {
    identifier: `${A}.text.combine`,
    name: "Combine Text",
    category: "text",
    params: [
      { key: "text", type: "attachment", required: true },
      { key: "WFTextSeparator", type: "enum", required: false, enumValues: ["New Lines", "Spaces", "Custom"] },
      { key: "WFTextCustomSeparator", type: "string", required: false },
    ],
    hasOutput: true,
    outputName: "Combined Text",
  },
  {
    identifier: `${A}.text.replace`,
    name: "Replace Text",
    category: "text",
    params: [
      { key: "WFInput", type: "attachment", required: true, description: "texto de entrada (esta ação usa WFInput, não text)" },
      { key: "WFReplaceTextFind", type: "string", required: true },
      { key: "WFReplaceTextReplace", type: "string", required: false, description: "vazio = remover" },
      { key: "WFReplaceTextCaseSensitive", type: "boolean", required: false },
      { key: "WFReplaceTextRegularExpression", type: "boolean", required: false },
    ],
    hasOutput: true,
    outputName: "Updated Text",
  },
  {
    identifier: `${A}.text.match`,
    name: "Match Text",
    category: "text",
    params: [
      { key: "text", type: "attachment", required: true },
      { key: "WFMatchTextPattern", type: "string", required: true, description: "regex" },
      { key: "WFMatchTextCaseSensitive", type: "boolean", required: false },
    ],
    hasOutput: true,
    outputName: "Matches",
  },
  {
    identifier: `${A}.text.changecase`,
    name: "Change Case",
    category: "text",
    params: [
      { key: "text", type: "attachment", required: true },
      { key: "WFCaseType", type: "enum", required: false, enumValues: ["UPPERCASE", "lowercase", "Capitalize with Title Case"] },
    ],
    hasOutput: true,
    outputName: "Updated Text",
  },

  // ---------- web ----------
  {
    identifier: `${A}.url`,
    name: "URL",
    category: "web",
    params: [{ key: "WFURLActionURL", type: "tokenstring", required: true }],
    hasOutput: true,
    outputName: "URL",
  },
  {
    identifier: `${A}.openurl`,
    name: "Open URLs",
    category: "web",
    params: [{ key: "WFInput", type: "attachment", required: true, description: "URL a abrir (ref de uma ação URL)" }],
    hasOutput: false,
    notes:
      "Abre qualquer URL, inclusive esquemas de apps: whatsapp://send?text=..., spotify:playlist:..., shortcuts://, comgooglemaps://?daddr=..., music://, tel:, facetime:. É a forma mais confiável de integrar apps de terceiros.",
  },
  {
    identifier: `${A}.downloadurl`,
    name: "Get Contents of URL",
    category: "web",
    params: [
      { key: "WFURL", type: "tokenstring", required: true },
      { key: "WFHTTPMethod", type: "enum", required: false, enumValues: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
      { key: "WFHTTPHeaders", type: "dictionary", required: false },
      { key: "WFHTTPBodyType", type: "enum", required: false, enumValues: ["JSON", "Form", "File"] },
      { key: "WFJSONValues", type: "dictionary", required: false, description: "corpo JSON quando WFHTTPBodyType=JSON" },
      { key: "WFFormValues", type: "dictionary", required: false },
    ],
    hasOutput: true,
    outputName: "Contents of URL",
    notes: "Para APIs REST. GET não precisa de WFHTTPMethod.",
  },
  {
    identifier: `${A}.urlencode`,
    name: "URL Encode",
    category: "web",
    params: [
      { key: "WFInput", type: "attachment", required: true },
      { key: "WFEncodeMode", type: "enum", required: false, enumValues: ["Encode", "Decode"] },
    ],
    hasOutput: true,
    outputName: "URL Encoded Text",
  },

  // ---------- exibição ----------
  {
    identifier: `${A}.showresult`,
    name: "Show Result",
    category: "display",
    params: [{ key: "Text", type: "tokenstring", required: true }],
    hasOutput: false,
  },
  {
    identifier: `${A}.alert`,
    name: "Show Alert",
    category: "display",
    params: [
      { key: "WFAlertActionMessage", type: "tokenstring", required: true },
      { key: "WFAlertActionTitle", type: "tokenstring", required: false },
      { key: "WFAlertActionCancelButtonShown", type: "boolean", required: false, description: "false = sem botão Cancelar" },
    ],
    hasOutput: false,
    notes: "Com Cancelar visível, cancelar interrompe o atalho — funciona como confirmação.",
  },
  {
    identifier: `${A}.notification`,
    name: "Show Notification",
    category: "display",
    params: [
      { key: "WFNotificationActionBody", type: "tokenstring", required: true },
      { key: "WFNotificationActionTitle", type: "tokenstring", required: false },
    ],
    hasOutput: false,
  },
  {
    identifier: `${A}.speaktext`,
    name: "Speak Text",
    category: "display",
    params: [
      { key: "WFText", type: "tokenstring", required: true },
      { key: "WFSpeakTextWait", type: "boolean", required: false },
    ],
    hasOutput: false,
  },

  // ---------- entrada do usuário ----------
  {
    identifier: `${A}.ask`,
    name: "Ask for Input",
    category: "input",
    params: [
      { key: "WFAskActionPrompt", type: "tokenstring", required: true },
      { key: "WFInputType", type: "enum", required: false, enumValues: ["Text", "Number", "URL", "Date", "Time", "Date and Time"] },
      { key: "WFAskActionDefaultAnswer", type: "tokenstring", required: false },
    ],
    hasOutput: true,
    outputName: "Provided Input",
  },
  {
    identifier: `${A}.choosefromlist`,
    name: "Choose from List",
    category: "input",
    params: [
      { key: "WFInput", type: "attachment", required: true, description: "lista de onde escolher" },
      { key: "WFChooseFromListActionPrompt", type: "string", required: false },
      { key: "WFChooseFromListActionSelectMultiple", type: "boolean", required: false },
    ],
    hasOutput: true,
    outputName: "Chosen Item",
  },
  {
    identifier: `${A}.dictatetext`,
    name: "Dictate Text",
    category: "input",
    params: [
      { key: "WFDictateTextStopListening", type: "enum", required: false, enumValues: ["After Pause", "After Short Pause", "On Tap"] },
    ],
    hasOutput: true,
    outputName: "Dictated Text",
  },

  // ---------- variáveis ----------
  {
    identifier: `${A}.setvariable`,
    name: "Set Variable",
    category: "variables",
    params: [
      { key: "WFVariableName", type: "string", required: true },
      { key: "WFInput", type: "attachment", required: true },
    ],
    hasOutput: false,
  },
  {
    identifier: `${A}.appendvariable`,
    name: "Add to Variable",
    category: "variables",
    params: [
      { key: "WFVariableName", type: "string", required: true },
      { key: "WFInput", type: "attachment", required: true },
    ],
    hasOutput: false,
    notes: "Transforma a variável numa lista, adicionando itens.",
  },
  {
    identifier: `${A}.getvariable`,
    name: "Get Variable",
    category: "variables",
    params: [{ key: "WFVariable", type: "attachment", required: true }],
    hasOutput: true,
    outputName: "Variable",
  },

  // ---------- listas e dicionários ----------
  {
    identifier: `${A}.list`,
    name: "List",
    category: "data",
    params: [{ key: "WFItems", type: "array", required: true, description: "itens da lista (strings)" }],
    hasOutput: true,
    outputName: "List",
  },
  {
    identifier: `${A}.getitemfromlist`,
    name: "Get Item from List",
    category: "data",
    params: [
      { key: "WFInput", type: "attachment", required: true },
      { key: "WFItemSpecifier", type: "enum", required: false, enumValues: ["First Item", "Last Item", "Random Item", "Item At Index"] },
      { key: "WFItemIndex", type: "number", required: false },
    ],
    hasOutput: true,
    outputName: "Item from List",
  },
  {
    identifier: `${A}.dictionary`,
    name: "Dictionary",
    category: "data",
    params: [{ key: "WFItems", type: "dictionary", required: true }],
    hasOutput: true,
    outputName: "Dictionary",
  },
  {
    identifier: `${A}.detect.dictionary`,
    name: "Get Dictionary from Input",
    category: "data",
    params: [{ key: "WFInput", type: "attachment", required: true }],
    hasOutput: true,
    outputName: "Dictionary",
    notes: "Converte JSON (ex.: resposta de API) em dicionário.",
  },
  {
    identifier: `${A}.getvalueforkey`,
    name: "Get Dictionary Value",
    category: "data",
    params: [
      { key: "WFInput", type: "attachment", required: true },
      { key: "WFDictionaryKey", type: "tokenstring", required: true },
    ],
    hasOutput: true,
    outputName: "Dictionary Value",
  },
  {
    identifier: `${A}.setvalueforkey`,
    name: "Set Dictionary Value",
    category: "data",
    params: [
      { key: "WFDictionary", type: "attachment", required: true },
      { key: "WFDictionaryKey", type: "tokenstring", required: true },
      { key: "WFDictionaryValue", type: "tokenstring", required: true },
    ],
    hasOutput: true,
    outputName: "Dictionary",
  },
  {
    identifier: `${A}.count`,
    name: "Count",
    category: "data",
    params: [
      { key: "WFInput", type: "attachment", required: true },
      { key: "WFCountType", type: "enum", required: false, enumValues: ["Items", "Characters", "Words", "Sentences", "Lines"] },
    ],
    hasOutput: true,
    outputName: "Count",
    notes: "O serializador espelha WFInput na chave Input automaticamente (exigência da ação).",
  },

  // ---------- números ----------
  {
    identifier: `${A}.number`,
    name: "Number",
    category: "math",
    params: [{ key: "WFNumberActionNumber", type: "number", required: true }],
    hasOutput: true,
    outputName: "Number",
  },
  {
    identifier: `${A}.math`,
    name: "Calculate",
    category: "math",
    params: [
      { key: "WFInput", type: "attachment", required: true, description: "primeiro operando" },
      { key: "WFMathOperation", type: "enum", required: false, enumValues: ["-", "×", "÷"], description: "OMITA para soma; × e ÷ são os caracteres Unicode" },
      { key: "WFMathOperand", type: "number", required: false, description: "segundo operando (número ou referência)" },
    ],
    hasOutput: true,
    outputName: "Calculation Result",
    notes: "NUNCA use * ou / ASCII — o app interpreta como soma silenciosamente.",
  },
  {
    identifier: `${A}.calculateexpression`,
    name: "Calculate Expression",
    category: "math",
    params: [{ key: "Input", type: "tokenstring", required: true, description: "expressão, ex. (3+4)×2" }],
    hasOutput: true,
    outputName: "Calculation Result",
  },
  {
    identifier: `${A}.format.number`,
    name: "Format Number",
    category: "math",
    params: [
      { key: "WFNumber", type: "attachment", required: true },
      { key: "WFNumberFormatDecimalPlaces", type: "number", required: false },
    ],
    hasOutput: true,
    outputName: "Formatted Number",
  },
  {
    identifier: `${A}.round`,
    name: "Round Number",
    category: "math",
    params: [
      { key: "WFInput", type: "attachment", required: true },
      { key: "WFRoundMode", type: "enum", required: false, enumValues: ["Normal", "Always Round Up", "Always Round Down"] },
    ],
    hasOutput: true,
    outputName: "Rounded Number",
  },

  // ---------- datas ----------
  {
    identifier: `${A}.date`,
    name: "Date",
    category: "date",
    params: [
      { key: "WFDateActionMode", type: "enum", required: false, enumValues: ["Current Date", "Specified Date"] },
      { key: "WFDateActionDate", type: "string", required: false },
    ],
    hasOutput: true,
    outputName: "Date",
  },
  {
    identifier: `${A}.format.date`,
    name: "Format Date",
    category: "date",
    params: [
      { key: "WFDate", type: "attachment", required: true },
      { key: "WFDateFormatStyle", type: "enum", required: false, enumValues: ["None", "Short", "Medium", "Long", "Relative", "RFC 2822", "ISO 8601", "Custom"] },
      { key: "WFDateFormatString", type: "string", required: false, description: "ex. HH:mm — exige WFDateFormatStyle=Custom" },
      { key: "WFTimeFormatStyle", type: "enum", required: false, enumValues: ["None", "Short", "Medium", "Long"] },
    ],
    hasOutput: true,
    outputName: "Formatted Date",
  },

  // ---------- área de transferência ----------
  {
    identifier: `${A}.getclipboard`,
    name: "Get Clipboard",
    category: "clipboard",
    params: [],
    hasOutput: true,
    outputName: "Clipboard",
  },
  {
    identifier: `${A}.setclipboard`,
    name: "Copy to Clipboard",
    category: "clipboard",
    params: [{ key: "WFInput", type: "attachment", required: true }],
    hasOutput: false,
  },

  // ---------- codificação ----------
  {
    identifier: `${A}.base64encode`,
    name: "Base64 Encode",
    category: "encoding",
    params: [
      { key: "WFInput", type: "attachment", required: true },
      { key: "WFEncodeMode", type: "enum", required: false, enumValues: ["Encode", "Decode"] },
    ],
    hasOutput: true,
    outputName: "Base64 Encoded",
  },
  {
    identifier: `${A}.hash`,
    name: "Generate Hash",
    category: "encoding",
    params: [
      { key: "WFInput", type: "attachment", required: true },
      { key: "WFHashType", type: "enum", required: false, enumValues: ["MD5", "SHA1", "SHA256", "SHA512"] },
    ],
    hasOutput: true,
    outputName: "Hashed Data",
  },

  // ---------- fluxo ----------
  {
    identifier: `${A}.delay`,
    name: "Wait",
    category: "scripting",
    params: [{ key: "WFDelayTime", type: "number", required: true, description: "segundos" }],
    hasOutput: false,
  },
  {
    identifier: `${A}.exit`,
    name: "Stop Shortcut",
    category: "scripting",
    params: [],
    hasOutput: false,
  },
  {
    identifier: `${A}.nothing`,
    name: "Nothing",
    category: "scripting",
    params: [],
    hasOutput: false,
    notes: "Limpa a saída anterior (útil no fim de um ramo do If).",
  },
  {
    identifier: `${A}.runworkflow`,
    name: "Run Shortcut",
    category: "scripting",
    params: [
      { key: "WFWorkflowName", type: "string", required: true, description: "nome exato do outro atalho" },
      { key: "WFInput", type: "attachment", required: false },
      { key: "WFShowWorkflow", type: "boolean", required: false },
    ],
    hasOutput: true,
    outputName: "Shortcut Result",
  },

  // ---------- dispositivo ----------
  {
    identifier: `${A}.getbatterylevel`,
    name: "Get Battery Level",
    category: "device",
    params: [],
    hasOutput: true,
    outputName: "Battery Level",
  },
  {
    identifier: `${A}.getdevicedetails`,
    name: "Get Device Details",
    category: "device",
    params: [
      { key: "WFDeviceDetail", type: "enum", required: true, enumValues: ["Device Name", "Device Model", "System Version", "Current Volume", "Battery Level"] },
    ],
    hasOutput: true,
    outputName: "Device Details",
  },
  {
    identifier: `${A}.getipaddress`,
    name: "Get IP Address",
    category: "device",
    params: [
      { key: "WFIPAddressSourceOption", type: "enum", required: false, enumValues: ["Local", "External"] },
      { key: "WFIPAddressTypeOption", type: "enum", required: false, enumValues: ["IPv4", "IPv6"] },
    ],
    hasOutput: true,
    outputName: "IP Address",
  },
  {
    identifier: `${A}.setbrightness`,
    name: "Set Brightness",
    category: "device",
    params: [{ key: "WFBrightness", type: "number", required: true, description: "0 a 1 (ex. 0.5)" }],
    hasOutput: false,
  },
  {
    identifier: `${A}.setvolume`,
    name: "Set Volume",
    category: "device",
    params: [{ key: "WFVolume", type: "number", required: true, description: "0 a 1 (ex. 0.5)" }],
    hasOutput: false,
  },
  {
    identifier: `${A}.airplanemode.set`,
    name: "Set Airplane Mode",
    category: "device",
    params: [{ key: "OnValue", type: "boolean", required: true }],
    hasOutput: false,
  },
  {
    identifier: `${A}.wifi.set`,
    name: "Set Wi-Fi",
    category: "device",
    params: [{ key: "OnValue", type: "boolean", required: true }],
    hasOutput: false,
  },
  {
    identifier: `${A}.bluetooth.set`,
    name: "Set Bluetooth",
    category: "device",
    params: [{ key: "OnValue", type: "boolean", required: true }],
    hasOutput: false,
  },
  {
    identifier: `${A}.lowpowermode.set`,
    name: "Set Low Power Mode",
    category: "device",
    params: [{ key: "OnValue", type: "boolean", required: true }],
    hasOutput: false,
  },
  {
    identifier: `${A}.vibrate`,
    name: "Vibrate Device",
    category: "device",
    params: [],
    hasOutput: false,
    notes: "Só iPhone.",
  },

  // ---------- apps e comunicação ----------
  {
    identifier: `${A}.openapp`,
    name: "Open App",
    category: "apps",
    params: [
      { key: "WFAppIdentifier", type: "string", required: true, description: "bundle ID, ex. com.apple.Music, com.spotify.client, net.whatsapp.WhatsApp" },
    ],
    hasOutput: false,
    notes: "O serializador também emite WFSelectedApp automaticamente a partir do bundle ID.",
  },
  {
    identifier: `${A}.sendmessage`,
    name: "Send Message",
    category: "communication",
    params: [
      { key: "WFSendMessageContent", type: "tokenstring", required: true },
      { key: "WFSendMessageActionRecipients", type: "array", required: false, description: "telefones/e-mails; omita para o app perguntar" },
      { key: "ShowWhenRun", type: "boolean", required: false, description: "mostrar a folha de composição" },
    ],
    hasOutput: false,
  },
  {
    identifier: `${A}.sendemail`,
    name: "Send Email",
    category: "communication",
    params: [
      { key: "WFSendEmailActionToRecipients", type: "array", required: true, description: "e-mails de destino" },
      { key: "WFSendEmailActionSubject", type: "tokenstring", required: false },
      { key: "WFSendEmailActionInputAttachments", type: "tokenstring", required: true, description: "corpo do e-mail" },
      { key: "WFSendEmailActionShowComposeSheet", type: "boolean", required: false },
    ],
    hasOutput: false,
  },
  {
    identifier: `${A}.dnd.set`,
    name: "Set Focus",
    category: "device",
    params: [
      { key: "Enabled", type: "number", required: true, description: "1=ligar, 0=desligar" },
      { key: "Operation", type: "enum", required: false, enumValues: ["Turn", "Toggle"] },
      {
        key: "FocusModes",
        type: "dictionary",
        required: false,
        description: 'modo de foco: {"dict":{"DisplayString":"Do Not Disturb","Identifier":"com.apple.donotdisturb.mode.default"}}',
      },
      { key: "AssertionType", type: "enum", required: false, enumValues: ["Turned Off", "Time", "I Leave", "Event Ends"] },
    ],
    hasOutput: false,
    notes: "Liga/desliga o modo Não Perturbe/Foco. Omita FocusModes para o Não Perturbe padrão.",
  },
  {
    identifier: `${A}.text.translate`,
    name: "Translate Text",
    category: "text",
    params: [
      { key: "WFInputText", type: "tokenstring", required: true },
      {
        key: "WFSelectedLanguage",
        type: "enum",
        required: true,
        enumValues: ["ar_AE", "zh_CN", "nl_NL", "en_GB", "en_US", "fr_FR", "de_DE", "it_IT", "jp_JP", "ko_KR", "pl_PL", "pt_BR", "ru_RU", "es_ES", "tr_TR"],
      },
    ],
    hasOutput: true,
    outputName: "Translated Text",
  },
  {
    identifier: `${A}.getdirections`,
    name: "Show Directions",
    category: "location",
    params: [
      { key: "WFDestination", type: "tokenstring", required: true, description: "endereço ou nome do lugar" },
      { key: "WFGetDirectionsActionApp", type: "enum", required: false, enumValues: ["Maps", "Google Maps", "Waze"] },
      { key: "WFGetDirectionsActionMode", type: "enum", required: false, enumValues: ["Driving", "Walking", "Transit", "Biking"] },
    ],
    hasOutput: false,
  },
  {
    identifier: `${A}.addnewreminder`,
    name: "Add New Reminder",
    category: "productivity",
    params: [
      { key: "WFCalendarItemTitle", type: "tokenstring", required: true },
      { key: "WFCalendarItemNotes", type: "tokenstring", required: false },
    ],
    hasOutput: true,
    outputName: "New Reminder",
  },
  {
    identifier: `${A}.addnewevent`,
    name: "Add New Event",
    category: "productivity",
    params: [
      { key: "WFCalendarItemTitle", type: "tokenstring", required: true },
      { key: "WFCalendarItemStartDate", type: "tokenstring", required: true, description: "ex. Today at 9:00" },
      { key: "WFCalendarItemEndDate", type: "tokenstring", required: true },
      { key: "WFCalendarItemNotes", type: "tokenstring", required: false },
      { key: "WFCalendarItemLocation", type: "tokenstring", required: false },
    ],
    hasOutput: true,
    outputName: "New Event",
    notes: "O identificador é addnewevent (NÃO addnewcalendarevent).",
  },
  {
    identifier: `${A}.getupcomingevents`,
    name: "Get Upcoming Events",
    category: "productivity",
    params: [{ key: "WFGetUpcomingItemCount", type: "number", required: false, description: "quantos eventos" }],
    hasOutput: true,
    outputName: "Upcoming Events",
  },
  {
    identifier: `${A}.appendnote`,
    name: "Append to Note",
    category: "productivity",
    params: [
      { key: "WFNote", type: "tokenstring", required: true, description: "nome da nota" },
      { key: "WFInput", type: "tokenstring", required: true, description: "texto a acrescentar" },
    ],
    hasOutput: false,
  },
  {
    identifier: `${A}.file.append`,
    name: "Append to File",
    category: "files",
    params: [
      { key: "WFFilePath", type: "tokenstring", required: true, description: "caminho na pasta Shortcuts do iCloud Drive" },
      { key: "WFInput", type: "tokenstring", required: true },
      { key: "WFAppendFileWriteMode", type: "enum", required: false, enumValues: ["Append", "Prepend"] },
    ],
    hasOutput: true,
    outputName: "Appended File",
    notes: "Ótimo para diários/logs em arquivo de texto.",
  },
  {
    identifier: `${A}.timer.start`,
    name: "Start Timer",
    category: "productivity",
    params: [
      { key: "WFDuration", type: "dictionary", required: true, description: 'quantidade: {"kind":"quantity","magnitude":25,"unit":"min"} (unidades: hr|min|sec)' },
    ],
    hasOutput: false,
  },
  {
    identifier: `${A}.pausemusic`,
    name: "Play/Pause",
    category: "media",
    params: [
      { key: "WFPlayPauseBehavior", type: "enum", required: false, enumValues: ["Play", "Pause", "Play/Pause"] },
    ],
    hasOutput: false,
  },
  {
    identifier: `${A}.takescreenshot`,
    name: "Take Screenshot",
    category: "device",
    params: [],
    hasOutput: true,
    outputName: "Screenshot",
  },
  {
    identifier: `${A}.lockscreen`,
    name: "Lock Screen",
    category: "device",
    params: [],
    hasOutput: false,
    notes: "iOS 17+.",
  },
  {
    identifier: `${A}.flashlight`,
    name: "Set Flashlight",
    category: "device",
    params: [
      { key: "state", type: "number", required: false, description: "1=ligar, 0=desligar" },
      { key: "operation", type: "enum", required: false, enumValues: ["set", "toggle"] },
    ],
    hasOutput: false,
    notes: "Só iPhone/iPad.",
  },
  {
    identifier: `${A}.getwifi`,
    name: "Get Network Details",
    category: "device",
    params: [
      { key: "WFNetworkDetailsNetwork", type: "enum", required: true, enumValues: ["Wi-Fi", "Cellular"] },
      { key: "WFWiFiDetail", type: "enum", required: false, enumValues: ["Network Name", "BSSID"] },
    ],
    hasOutput: true,
    outputName: "Network Details",
  },
  {
    identifier: `${A}.wallpaper.set`,
    name: "Set Wallpaper",
    category: "device",
    params: [
      { key: "WFInput", type: "attachment", required: true },
      { key: "WFWallpaperShowPreview", type: "boolean", required: false },
    ],
    hasOutput: false,
  },
  {
    identifier: `${A}.recordaudio`,
    name: "Record Audio",
    category: "media",
    params: [
      { key: "WFRecordingCompression", type: "enum", required: false, enumValues: ["Normal", "Very High"] },
      { key: "WFRecordingStart", type: "enum", required: false, enumValues: ["On Tap", "Immediately"] },
    ],
    hasOutput: true,
    outputName: "Recorded Audio",
  },

  // ---------- mídia, fotos e localização ----------
  {
    identifier: `${A}.getcurrentsong`,
    name: "Get Current Song",
    category: "media",
    params: [],
    hasOutput: true,
    outputName: "Current Song",
  },
  {
    identifier: `${A}.takephoto`,
    name: "Take Photo",
    category: "media",
    params: [{ key: "WFCameraCaptureShowPreview", type: "boolean", required: false }],
    hasOutput: true,
    outputName: "Photo",
  },
  {
    identifier: `${A}.selectphoto`,
    name: "Select Photos",
    category: "media",
    params: [{ key: "WFSelectMultiplePhotos", type: "boolean", required: false }],
    hasOutput: true,
    outputName: "Photos",
  },
  {
    identifier: `${A}.savetocameraroll`,
    name: "Save to Photo Album",
    category: "media",
    params: [{ key: "WFInput", type: "attachment", required: true }],
    hasOutput: false,
  },
  {
    identifier: `${A}.image.convert`,
    name: "Convert Image",
    category: "media",
    params: [
      { key: "WFInput", type: "attachment", required: true },
      { key: "WFImageFormat", type: "enum", required: true, enumValues: ["JPEG", "TIFF", "GIF", "PNG", "BMP", "PDF", "HEIF", "Match Input"] },
      { key: "WFImageCompressionQuality", type: "number", required: false, description: "0 a 1" },
    ],
    hasOutput: true,
    outputName: "Converted Image",
  },
  {
    identifier: `${A}.image.resize`,
    name: "Resize Image",
    category: "media",
    params: [
      { key: "WFImage", type: "attachment", required: true },
      { key: "WFImageResizeWidth", type: "number", required: false },
      { key: "WFImageResizeHeight", type: "number", required: false },
    ],
    hasOutput: true,
    outputName: "Resized Image",
  },
  {
    identifier: `${A}.extracttextfromimage`,
    name: "Extract Text from Image",
    category: "media",
    params: [{ key: "WFImage", type: "attachment", required: true }],
    hasOutput: true,
    outputName: "Text from Image",
  },
  {
    identifier: `${A}.generatebarcode`,
    name: "Generate QR Code",
    category: "media",
    params: [{ key: "WFText", type: "tokenstring", required: true }],
    hasOutput: true,
    outputName: "QR Code",
  },
  {
    identifier: `${A}.getcurrentlocation`,
    name: "Get Current Location",
    category: "location",
    params: [],
    hasOutput: true,
    outputName: "Current Location",
  },
  {
    identifier: `${A}.weather.currentconditions`,
    name: "Get Current Weather",
    category: "location",
    params: [],
    hasOutput: true,
    outputName: "Weather Conditions",
  },

  // ---------- compartilhar e arquivos ----------
  {
    identifier: `${A}.share`,
    name: "Share",
    category: "sharing",
    params: [{ key: "WFInput", type: "attachment", required: true }],
    hasOutput: false,
  },
  {
    identifier: `${A}.makepdf`,
    name: "Make PDF",
    category: "files",
    params: [{ key: "WFInput", type: "attachment", required: true }],
    hasOutput: true,
    outputName: "PDF",
  },
  {
    identifier: `${A}.print`,
    name: "Print",
    category: "files",
    params: [{ key: "WFInput", type: "attachment", required: true }],
    hasOutput: false,
  },
];

const byId = new Map(CATALOG.map((a) => [a.identifier, a]));

export function getAction(identifier: string): CatalogAction | undefined {
  return byId.get(identifier);
}

/** Documentação compacta do catálogo para o system prompt do gerador. */
export function catalogPromptDocs(): string {
  const lines: string[] = [];
  for (const a of CATALOG) {
    const params = a.params
      .map((p) => {
        let s = `${p.key}:${p.type}${p.required ? "!" : ""}`;
        if (p.enumValues) s += `[${p.enumValues.join("|")}]`;
        if (p.description) s += ` (${p.description})`;
        return s;
      })
      .join(", ");
    const output = a.hasOutput ? ` -> ${a.outputName}` : "";
    const notes = a.notes ? ` | ${a.notes}` : "";
    lines.push(`- ${a.identifier} (${a.name})${output}${params ? ` | params: ${params}` : ""}${notes}`);
  }
  return lines.join("\n");
}
