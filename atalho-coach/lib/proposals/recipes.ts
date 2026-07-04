// Receitas curadas — o "catálogo vivo" do consultor. Cada receita gera IR válido
// no idioma do usuário e é recomendada pelo motor conforme o perfil do quiz.

import type { Locale } from "@/lib/i18n/dictionaries";
import type { IRStep, ShortcutIR } from "@/lib/shortcuts/types";
import type { Recipe, RecipeLevel } from "./engine";
import autoRecipesData from "./auto-recipes.json";

const A = "is.workflow.actions";

// Receitas geradas automaticamente (fórum + gerador diário) — ver scripts/gerar-receita.ts.
export interface StoredRecipe {
  id: string;
  emoji: string;
  level: RecipeLevel;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  goals?: string[];
  apps?: string[];
  routines?: string[];
  ir: Record<Locale, ShortcutIR>;
}

export function storedToRecipe(stored: StoredRecipe): Recipe {
  return {
    id: stored.id,
    emoji: stored.emoji,
    level: stored.level,
    title: stored.title,
    description: stored.description,
    goals: stored.goals ?? ["power", "productivity"],
    apps: stored.apps,
    routines: stored.routines,
    build: (locale) => stored.ir[locale] ?? stored.ir.pt,
  };
}

export const AUTO_RECIPES: StoredRecipe[] = autoRecipesData as unknown as StoredRecipe[];

const t = (pt: string, en: string, es: string): Record<Locale, string> => ({ pt, en, es });

function credit(locale: Locale): IRStep {
  const text = {
    pt: "Criado com Atalho Coach. Revise as ações antes de usar.",
    en: "Created with Atalho Coach. Review the actions before using.",
    es: "Creado con Atalho Coach. Revisa las acciones antes de usar.",
  }[locale];
  return { type: "action", identifier: `${A}.comment`, params: { WFCommentActionText: text } };
}

export const RECIPES: Recipe[] = [
  {
    id: "bom-dia",
    emoji: "🌅",
    level: "simple",
    title: t("Bom dia no automático", "Morning on autopilot", "Buenos días en automático"),
    description: t(
      "Um toque: clima de agora e a data de hoje numa notificação para começar o dia.",
      "One tap: current weather and today's date in a notification to start your day.",
      "Un toque: el clima de ahora y la fecha de hoy en una notificación para empezar el día."
    ),
    goals: ["morning"],
    routines: ["commute", "family"],
    build: (locale) => {
      const title = { pt: "Bom dia! ☀️", en: "Good morning! ☀️", es: "¡Buenos días! ☀️" }[locale];
      const body = {
        pt: ["Hoje é ", { ref: "data" } as const, ". Clima agora: ", { ref: "clima" } as const],
        en: ["Today is ", { ref: "data" } as const, ". Weather now: ", { ref: "clima" } as const],
        es: ["Hoy es ", { ref: "data" } as const, ". Clima ahora: ", { ref: "clima" } as const],
      }[locale];
      return {
        name: { pt: "Bom dia", en: "Good Morning", es: "Buenos días" }[locale],
        iconGlyph: 61440,
        iconColor: 4274264319,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.date`, params: { WFDateActionMode: "Current Date" }, ref: "hoje" },
          {
            type: "action",
            identifier: `${A}.format.date`,
            params: { WFDate: { ref: "hoje" }, WFDateFormatStyle: "Long", WFTimeFormatStyle: "None" },
            ref: "data",
          },
          { type: "action", identifier: `${A}.weather.currentconditions`, params: {}, ref: "clima" },
          {
            type: "action",
            identifier: `${A}.notification`,
            params: { WFNotificationActionTitle: title, WFNotificationActionBody: { text: [...body] } },
          },
        ],
      };
    },
  },

  {
    id: "modo-treino-spotify",
    emoji: "🏋️",
    level: "medium",
    title: t("Modo Treino (Spotify)", "Workout Mode (Spotify)", "Modo Entrenamiento (Spotify)"),
    description: t(
      "Silencia notificações, aumenta o volume e abre o Spotify — tudo num toque ao chegar na academia.",
      "Silences notifications, raises the volume and opens Spotify — all in one tap when you hit the gym.",
      "Silencia notificaciones, sube el volumen y abre Spotify — todo con un toque al llegar al gimnasio."
    ),
    apps: ["spotify"],
    routines: ["gym"],
    goals: ["media", "health"],
    devices: ["iphone"],
    build: (locale) => ({
      name: { pt: "Modo Treino", en: "Workout Mode", es: "Modo Entrenamiento" }[locale],
      iconGlyph: 61440,
      iconColor: 4282601983,
      steps: [
        credit(locale),
        { type: "action", identifier: `${A}.dnd.set`, params: { Enabled: 1 } },
        { type: "action", identifier: `${A}.setvolume`, params: { WFVolume: 0.8 } },
        { type: "action", identifier: `${A}.openapp`, params: { WFAppIdentifier: "com.spotify.client" } },
      ],
    }),
  },

  {
    id: "pomodoro",
    emoji: "🍅",
    level: "bold",
    title: t("Pomodoro de bolso", "Pocket Pomodoro", "Pomodoro de bolsillo"),
    description: t(
      "Escolha 25 ou 50 minutos: liga o foco, inicia o timer e avisa quando começar.",
      "Pick 25 or 50 minutes: turns on Focus, starts the timer and tells you it began.",
      "Elige 25 o 50 minutos: activa la concentración, inicia el temporizador y te avisa."
    ),
    goals: ["focus", "productivity"],
    routines: ["study", "meetings"],
    build: (locale) => {
      const prompt = { pt: "Quanto tempo de foco?", en: "How long should we focus?", es: "¿Cuánto tiempo de concentración?" }[locale];
      const started = {
        pt: "Foco ligado. Bom trabalho! 🍅",
        en: "Focus is on. Deep work time! 🍅",
        es: "Concentración activada. ¡A trabajar! 🍅",
      }[locale];
      const item25 = { pt: "25 minutos", en: "25 minutes", es: "25 minutos" }[locale];
      const item50 = { pt: "50 minutos", en: "50 minutes", es: "50 minutos" }[locale];
      const block = (minutes: number): IRStep[] => [
        { type: "action", identifier: `${A}.dnd.set`, params: { Enabled: 1 } },
        { type: "action", identifier: `${A}.timer.start`, params: { WFDuration: { quantity: minutes, unit: "min" } } },
        { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: started } },
      ];
      return {
        name: { pt: "Pomodoro", en: "Pomodoro", es: "Pomodoro" }[locale],
        iconGlyph: 61440,
        iconColor: 4282601983,
        steps: [
          credit(locale),
          { type: "menu", prompt, items: [item25, item50] },
          { type: "case", label: item25 },
          ...block(25),
          { type: "case", label: item50 },
          ...block(50),
          { type: "endmenu" },
        ],
      };
    },
  },

  {
    id: "chego-em",
    emoji: "🚗",
    level: "medium",
    title: t("“Chego em…” num toque", "“Be there in…” in one tap", "“Llego en…” con un toque"),
    description: t(
      "Preso no trânsito? Escolha 10, 20 ou 30 minutos e a mensagem sai pronta.",
      "Stuck in traffic? Pick 10, 20 or 30 minutes and the message is ready to send.",
      "¿Atascado? Elige 10, 20 o 30 minutos y el mensaje sale listo."
    ),
    apps: ["whatsapp"],
    routines: ["commute", "family"],
    goals: ["messages"],
    devices: ["iphone"],
    build: (locale) => {
      const prompt = { pt: "Chego em quanto tempo?", en: "How long until you arrive?", es: "¿En cuánto llegas?" }[locale];
      const msg = (n: number) =>
        ({
          pt: `A caminho! Chego em ~${n} minutos. 🚗`,
          en: `On my way! There in ~${n} minutes. 🚗`,
          es: `¡En camino! Llego en ~${n} minutos. 🚗`,
        })[locale];
      const items = ["10 min", "20 min", "30 min"];
      const caseFor = (label: string, n: number): IRStep[] => [
        { type: "case", label },
        { type: "action", identifier: `${A}.gettext`, params: { WFTextActionText: msg(n) }, ref: `m${n}` },
        { type: "action", identifier: `${A}.urlencode`, params: { WFInput: { ref: `m${n}` } }, ref: `e${n}` },
        {
          type: "action",
          identifier: `${A}.url`,
          params: { WFURLActionURL: { text: ["whatsapp://send?text=", { ref: `e${n}` }] } },
          ref: `u${n}`,
        },
        { type: "action", identifier: `${A}.openurl`, params: { WFInput: { ref: `u${n}` } } },
      ];
      return {
        name: { pt: "Chego em…", en: "Be there in…", es: "Llego en…" }[locale],
        iconGlyph: 61440,
        iconColor: 4292093695,
        steps: [
          credit(locale),
          { type: "menu", prompt, items },
          ...caseFor(items[0], 10),
          ...caseFor(items[1], 20),
          ...caseFor(items[2], 30),
          { type: "endmenu" },
        ],
      };
    },
  },

  {
    id: "diario-1-linha",
    emoji: "📓",
    level: "medium",
    title: t("Diário de 1 linha", "One-line journal", "Diario de 1 línea"),
    description: t(
      "Toda noite, uma pergunta. A resposta vai com data para um arquivo de texto no iCloud — seu diário sem app de diário.",
      "Every night, one question. The answer lands with a date in a text file on iCloud — a journal without a journal app.",
      "Cada noche, una pregunta. La respuesta va con fecha a un archivo de texto en iCloud — un diario sin app de diario."
    ),
    goals: ["productivity", "health"],
    routines: ["study", "family"],
    build: (locale) => {
      const ask = { pt: "Como foi seu dia, em uma linha?", en: "How was your day, in one line?", es: "¿Cómo fue tu día, en una línea?" }[locale];
      const done = { pt: "Anotado no diário ✅", en: "Saved to your journal ✅", es: "Anotado en el diario ✅" }[locale];
      const file = { pt: "Diario.txt", en: "Journal.txt", es: "Diario.txt" }[locale];
      return {
        name: { pt: "Diário de 1 linha", en: "One-line Journal", es: "Diario de 1 línea" }[locale],
        iconGlyph: 61440,
        iconColor: 2071128575,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.ask`, params: { WFAskActionPrompt: ask }, ref: "resposta" },
          { type: "action", identifier: `${A}.date`, params: { WFDateActionMode: "Current Date" }, ref: "hoje" },
          {
            type: "action",
            identifier: `${A}.format.date`,
            params: { WFDate: { ref: "hoje" }, WFDateFormatStyle: "Short" },
            ref: "data",
          },
          {
            type: "action",
            identifier: `${A}.file.append`,
            params: {
              WFFilePath: file,
              WFInput: { text: ["[", { ref: "data" }, "] ", { ref: "resposta" }] },
            },
            ref: "arquivo",
          },
          { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: done } },
        ],
      };
    },
  },

  {
    id: "cotacao-dolar",
    emoji: "💵",
    level: "bold",
    title: t("Dólar agora", "Dollar right now", "Dólar ahora"),
    description: t(
      "Consulta uma API pública e mostra a cotação do dólar em reais — sem abrir app nenhum.",
      "Calls a public API and shows the USD exchange rate — without opening any app.",
      "Consulta una API pública y muestra la cotización del dólar — sin abrir ninguna app."
    ),
    apps: ["banking"],
    goals: ["power", "productivity"],
    build: (locale) => {
      const label = { pt: "Dólar agora: R$ ", en: "USD → BRL now: ", es: "Dólar ahora: R$ " }[locale];
      return {
        name: { pt: "Dólar agora", en: "Dollar Now", es: "Dólar ahora" }[locale],
        iconGlyph: 61440,
        iconColor: 4292093695,
        steps: [
          credit(locale),
          {
            type: "action",
            identifier: `${A}.downloadurl`,
            params: { WFURL: "https://economia.awesomeapi.com.br/json/last/USD-BRL" },
            ref: "resp",
          },
          { type: "action", identifier: `${A}.detect.dictionary`, params: { WFInput: { ref: "resp" } }, ref: "json" },
          {
            type: "action",
            identifier: `${A}.getvalueforkey`,
            params: { WFInput: { ref: "json" }, WFDictionaryKey: "USDBRL" },
            ref: "par",
          },
          {
            type: "action",
            identifier: `${A}.getvalueforkey`,
            params: { WFInput: { ref: "par" }, WFDictionaryKey: "bid" },
            ref: "valor",
          },
          {
            type: "action",
            identifier: `${A}.showresult`,
            params: { Text: { text: [label, { ref: "valor" }] } },
          },
        ],
      };
    },
  },

  {
    id: "bateria-falada",
    emoji: "🔋",
    level: "simple",
    title: t("Bateria em voz alta", "Battery out loud", "Batería en voz alta"),
    description: t(
      "O iPhone fala quanto de bateria resta. Simples, útil no carro — e uma boa primeira automação.",
      "Your iPhone speaks the remaining battery. Simple, handy in the car — a great first automation.",
      "El iPhone dice cuánta batería queda. Simple, útil en el coche — una gran primera automatización."
    ),
    goals: ["power", "morning"],
    build: (locale) => {
      const phrase = {
        pt: ["A bateria está em ", { ref: "nivel" } as const, " por cento"],
        en: ["Battery is at ", { ref: "nivel" } as const, " percent"],
        es: ["La batería está al ", { ref: "nivel" } as const, " por ciento"],
      }[locale];
      return {
        name: { pt: "Bateria falada", en: "Battery Out Loud", es: "Batería hablada" }[locale],
        iconGlyph: 61440,
        iconColor: 4271458815,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.getbatterylevel`, params: {}, ref: "nivel" },
          { type: "action", identifier: `${A}.speaktext`, params: { WFText: { text: [...phrase] } } },
        ],
      };
    },
  },

  {
    id: "agenda-do-dia",
    emoji: "🗓️",
    level: "bold",
    title: t("Minha agenda, resumida", "My day, summarized", "Mi agenda, resumida"),
    description: t(
      "Junta seus próximos 5 compromissos numa lista limpa e mostra de uma vez — perfeito antes da primeira reunião.",
      "Collects your next 5 events into one clean list and shows it at once — perfect before the first meeting.",
      "Junta tus próximos 5 eventos en una lista limpia y la muestra de una vez — perfecto antes de la primera reunión."
    ),
    routines: ["meetings"],
    goals: ["morning", "productivity"],
    build: (locale) => {
      const header = { pt: "Sua agenda de hoje:", en: "Your schedule today:", es: "Tu agenda de hoy:" }[locale];
      return {
        name: { pt: "Agenda do dia", en: "Today's Schedule", es: "Agenda del día" }[locale],
        iconGlyph: 61440,
        iconColor: 946986751,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.getupcomingevents`, params: { WFGetUpcomingItemCount: 5 }, ref: "eventos" },
          { type: "repeatEach", input: { ref: "eventos" } },
          {
            type: "action",
            identifier: `${A}.appendvariable`,
            params: { WFVariableName: "Agenda", WFInput: { special: "RepeatItem" } },
          },
          { type: "endrepeat" },
          { type: "action", identifier: `${A}.getvariable`, params: { WFVariable: { var: "Agenda" } }, ref: "lista" },
          {
            type: "action",
            identifier: `${A}.text.combine`,
            params: { text: { ref: "lista" }, WFTextSeparator: "New Lines" },
            ref: "texto",
          },
          { type: "action", identifier: `${A}.showresult`, params: { Text: { text: [header, "\n", { ref: "texto" }] } } },
        ],
      };
    },
  },

  {
    id: "traduz-clipboard",
    emoji: "🌍",
    level: "medium",
    title: t("Tradutor de bolso", "Pocket translator", "Traductor de bolsillo"),
    description: t(
      "Copiou um texto em outro idioma? Um toque: traduz o que está na área de transferência e mostra na tela.",
      "Copied text in another language? One tap: translates whatever is on the clipboard and shows it.",
      "¿Copiaste un texto en otro idioma? Un toque: traduce lo del portapapeles y lo muestra."
    ),
    routines: ["travel", "study"],
    goals: ["power"],
    build: (locale) => {
      const target = { pt: "pt_BR", en: "en_US", es: "es_ES" }[locale];
      return {
        name: { pt: "Tradutor de bolso", en: "Pocket Translator", es: "Traductor de bolsillo" }[locale],
        iconGlyph: 61440,
        iconColor: 431817727,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.getclipboard`, params: {}, ref: "copiado" },
          {
            type: "action",
            identifier: `${A}.text.translate`,
            params: { WFInputText: { ref: "copiado" }, WFSelectedLanguage: target },
            ref: "traduzido",
          },
          { type: "action", identifier: `${A}.showresult`, params: { Text: { text: [{ ref: "traduzido" }] } } },
        ],
      };
    },
  },

  {
    id: "qr-wifi",
    emoji: "📶",
    level: "bold",
    title: t("QR do meu Wi-Fi", "My Wi-Fi QR", "QR de mi Wi-Fi"),
    description: t(
      "Visita em casa? Gere um QR code que conecta qualquer pessoa ao seu Wi-Fi sem digitar senha.",
      "Guests over? Generate a QR code that connects anyone to your Wi-Fi without typing the password.",
      "¿Visitas en casa? Genera un QR que conecta a cualquiera a tu Wi-Fi sin escribir la contraseña."
    ),
    goals: ["power"],
    build: (locale) => {
      const askSsid = { pt: "Nome da rede (SSID)?", en: "Network name (SSID)?", es: "¿Nombre de la red (SSID)?" }[locale];
      const askPass = { pt: "Senha do Wi-Fi?", en: "Wi-Fi password?", es: "¿Contraseña del Wi-Fi?" }[locale];
      return {
        name: { pt: "QR do Wi-Fi", en: "Wi-Fi QR", es: "QR del Wi-Fi" }[locale],
        iconGlyph: 61440,
        iconColor: 463140863,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.ask`, params: { WFAskActionPrompt: askSsid }, ref: "ssid" },
          { type: "action", identifier: `${A}.ask`, params: { WFAskActionPrompt: askPass }, ref: "senha" },
          {
            type: "action",
            identifier: `${A}.generatebarcode`,
            params: { WFText: { text: ["WIFI:T:WPA;S:", { ref: "ssid" }, ";P:", { ref: "senha" }, ";;"] } },
            ref: "qr",
          },
          { type: "action", identifier: `${A}.share`, params: { WFInput: { ref: "qr" } } },
        ],
      };
    },
  },

  {
    id: "lembrete-agua",
    emoji: "💧",
    level: "simple",
    title: t("Pausa pra água", "Water break", "Pausa para agua"),
    description: t(
      "Um toque cria o lembrete de beber água e já confirma com uma notificação.",
      "One tap creates a drink-water reminder and confirms with a notification.",
      "Un toque crea el recordatorio de beber agua y lo confirma con una notificación."
    ),
    apps: ["reminders"],
    goals: ["health", "morning"],
    build: (locale) => {
      const title = { pt: "Beber água 💧", en: "Drink water 💧", es: "Beber agua 💧" }[locale];
      const ok = { pt: "Lembrete criado!", en: "Reminder created!", es: "¡Recordatorio creado!" }[locale];
      return {
        name: { pt: "Pausa pra água", en: "Water Break", es: "Pausa para agua" }[locale],
        iconGlyph: 61440,
        iconColor: 431817727,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.addnewreminder`, params: { WFCalendarItemTitle: title } },
          { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: ok } },
        ],
      };
    },
  },

  {
    id: "compartilhar-musica",
    emoji: "🎵",
    level: "medium",
    title: t("Que música é essa?", "What's playing?", "¿Qué canción es esta?"),
    description: t(
      "Pega a música que está tocando e manda pra quem você quiser — nome e artista prontos na mensagem.",
      "Grabs the song that's playing and sends it to anyone — name and artist ready in the message.",
      "Toma la canción que suena y la envía a quien quieras — nombre y artista listos en el mensaje."
    ),
    apps: ["applemusic", "spotify"],
    goals: ["media", "messages"],
    build: (locale) => {
      const prefix = { pt: "Tocando agora: ", en: "Now playing: ", es: "Sonando ahora: " }[locale];
      return {
        name: { pt: "Que música é essa?", en: "What's Playing?", es: "¿Qué canción es?" }[locale],
        iconGlyph: 61440,
        iconColor: 3980825855,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.getcurrentsong`, params: {}, ref: "musica" },
          {
            type: "action",
            identifier: `${A}.gettext`,
            params: { WFTextActionText: { text: [prefix, { ref: "musica" }, " 🎵"] } },
            ref: "texto",
          },
          { type: "action", identifier: `${A}.share`, params: { WFInput: { ref: "texto" } } },
        ],
      };
    },
  },
];

// Catálogo completo: curadas + geradas automaticamente (mais novas primeiro).
export const ALL_RECIPES: Recipe[] = [...AUTO_RECIPES.map(storedToRecipe).reverse(), ...RECIPES];

export function getRecipe(id: string): Recipe | undefined {
  return ALL_RECIPES.find((r) => r.id === id);
}
