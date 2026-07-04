// Prateleira PREMIUM — receitas elaboradas, exclusivas para assinantes.
// Multi-passos, menus, APIs e laços; todas validadas pela suíte de testes.

import type { Locale } from "@/lib/i18n/dictionaries";
import type { IRStep } from "@/lib/shortcuts/types";
import type { Recipe } from "./engine";

const A = "is.workflow.actions";

const t = (pt: string, en: string, es: string): Record<Locale, string> => ({ pt, en, es });

function credit(locale: Locale): IRStep {
  const text = {
    pt: "Atalho premium do Atalho Coach ⭐ Revise as ações antes de usar.",
    en: "Atalho Coach premium shortcut ⭐ Review the actions before using.",
    es: "Atajo premium de Atalho Coach ⭐ Revisa las acciones antes de usar.",
  }[locale];
  return { type: "action", identifier: `${A}.comment`, params: { WFCommentActionText: text } };
}

export const PREMIUM_RECIPES: Recipe[] = [
  {
    id: "painel-do-dia",
    emoji: "🧭",
    level: "bold",
    premium: true,
    title: t("Painel do Dia", "Daily Dashboard", "Panel del Día"),
    description: t(
      "Um toque e você vê tudo: clima agora, seus 5 próximos compromissos, bateria e a cotação do dólar — num painel só.",
      "One tap shows everything: current weather, your next 5 events, battery and the USD rate — in a single panel.",
      "Un toque y lo ves todo: clima, tus 5 próximos eventos, batería y el dólar — en un solo panel."
    ),
    goals: ["morning", "productivity", "power"],
    routines: ["meetings", "commute"],
    build: (locale) => {
      const L = {
        pt: { clima: "🌤 Clima: ", agenda: "🗓 Agenda:", bateria: "🔋 Bateria: ", dolar: "💵 Dólar: R$ " },
        en: { clima: "🌤 Weather: ", agenda: "🗓 Schedule:", bateria: "🔋 Battery: ", dolar: "💵 USD→BRL: " },
        es: { clima: "🌤 Clima: ", agenda: "🗓 Agenda:", bateria: "🔋 Batería: ", dolar: "💵 Dólar: R$ " },
      }[locale];
      return {
        name: { pt: "Painel do Dia", en: "Daily Dashboard", es: "Panel del Día" }[locale],
        iconGlyph: 61440,
        iconColor: 946986751,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.weather.currentconditions`, params: {}, ref: "clima" },
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
            ref: "agenda",
          },
          { type: "action", identifier: `${A}.getbatterylevel`, params: {}, ref: "bateria" },
          {
            type: "action",
            identifier: `${A}.downloadurl`,
            params: { WFURL: "https://economia.awesomeapi.com.br/json/last/USD-BRL" },
            ref: "resp",
          },
          { type: "action", identifier: `${A}.detect.dictionary`, params: { WFInput: { ref: "resp" } }, ref: "json" },
          { type: "action", identifier: `${A}.getvalueforkey`, params: { WFInput: { ref: "json" }, WFDictionaryKey: "USDBRL" }, ref: "par" },
          { type: "action", identifier: `${A}.getvalueforkey`, params: { WFInput: { ref: "par" }, WFDictionaryKey: "bid" }, ref: "dolar" },
          {
            type: "action",
            identifier: `${A}.showresult`,
            params: {
              Text: {
                text: [
                  L.clima, { ref: "clima" }, "\n\n",
                  L.agenda, "\n", { ref: "agenda" }, "\n\n",
                  L.bateria, { ref: "bateria" }, "%\n",
                  L.dolar, { ref: "dolar" },
                ],
              },
            },
          },
        ],
      };
    },
  },

  {
    id: "assistente-de-reuniao",
    emoji: "🎯",
    level: "bold",
    premium: true,
    title: t("Assistente de Reunião", "Meeting Assistant", "Asistente de Reunión"),
    description: t(
      "Antes: liga o foco e o timer. Durante: dita a ata direto para um arquivo. Depois: mensagem de follow-up pronta.",
      "Before: Focus + timer on. During: dictate minutes straight to a file. After: a ready follow-up message.",
      "Antes: concentración y timer. Durante: dicta el acta a un archivo. Después: mensaje de seguimiento listo."
    ),
    goals: ["focus", "productivity"],
    routines: ["meetings"],
    build: (locale) => {
      const L = {
        pt: {
          prompt: "Assistente de reunião:",
          i1: "🚀 Começar reunião (foco + 30 min)",
          i2: "📝 Ditar ata",
          i3: "📤 Mensagem de follow-up",
          focoOk: "Foco ligado por 30 minutos. Boa reunião!",
          ataFile: "Atas.txt",
          ataOk: "Ata registrada ✅",
          followup: "Oi! Obrigado pela reunião de hoje. Combinamos os próximos passos — te envio o resumo em breve. Qualquer coisa, me chama!",
        },
        en: {
          prompt: "Meeting assistant:",
          i1: "🚀 Start meeting (focus + 30 min)",
          i2: "📝 Dictate minutes",
          i3: "📤 Follow-up message",
          focoOk: "Focus on for 30 minutes. Have a great meeting!",
          ataFile: "Minutes.txt",
          ataOk: "Minutes saved ✅",
          followup: "Hi! Thanks for today's meeting. We agreed on next steps — summary coming soon. Ping me anytime!",
        },
        es: {
          prompt: "Asistente de reunión:",
          i1: "🚀 Empezar reunión (concentración + 30 min)",
          i2: "📝 Dictar acta",
          i3: "📤 Mensaje de seguimiento",
          focoOk: "Concentración activada por 30 minutos. ¡Buena reunión!",
          ataFile: "Actas.txt",
          ataOk: "Acta guardada ✅",
          followup: "¡Hola! Gracias por la reunión de hoy. Acordamos los próximos pasos — pronto envío el resumen. ¡Cualquier cosa, escríbeme!",
        },
      }[locale];
      return {
        name: { pt: "Assistente de Reunião", en: "Meeting Assistant", es: "Asistente de Reunión" }[locale],
        iconGlyph: 61440,
        iconColor: 463140863,
        steps: [
          credit(locale),
          { type: "menu", prompt: L.prompt, items: [L.i1, L.i2, L.i3] },
          { type: "case", label: L.i1 },
          { type: "action", identifier: `${A}.dnd.set`, params: { Enabled: 1 } },
          { type: "action", identifier: `${A}.timer.start`, params: { WFDuration: { quantity: 30, unit: "min" } } },
          { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: L.focoOk } },
          { type: "case", label: L.i2 },
          { type: "action", identifier: `${A}.dictatetext`, params: { WFDictateTextStopListening: "On Tap" }, ref: "ata" },
          { type: "action", identifier: `${A}.date`, params: { WFDateActionMode: "Current Date" }, ref: "agora" },
          {
            type: "action",
            identifier: `${A}.format.date`,
            params: { WFDate: { ref: "agora" }, WFDateFormatStyle: "Short", WFTimeFormatStyle: "Short" },
            ref: "quando",
          },
          {
            type: "action",
            identifier: `${A}.file.append`,
            params: { WFFilePath: L.ataFile, WFInput: { text: ["\n[", { ref: "quando" }, "]\n", { ref: "ata" }] } },
            ref: "arq",
          },
          { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: L.ataOk } },
          { type: "case", label: L.i3 },
          {
            type: "action",
            identifier: `${A}.sendmessage`,
            params: { WFSendMessageContent: L.followup, ShowWhenRun: true },
          },
          { type: "endmenu" },
        ],
      };
    },
  },

  {
    id: "modo-viagem",
    emoji: "🧳",
    level: "bold",
    premium: true,
    title: t("Modo Viagem", "Travel Mode", "Modo Viaje"),
    description: t(
      "Canivete de viagem: traduz o que você copiou, converte moeda com câmbio ao vivo, guarda o endereço do hotel e liga o modo avião.",
      "A travel multitool: translates what you copied, converts currency with live rates, stores the hotel address and toggles airplane mode.",
      "Navaja de viaje: traduce lo copiado, convierte moneda con cambio en vivo, guarda la dirección del hotel y activa el modo avión."
    ),
    goals: ["power"],
    routines: ["travel"],
    build: (locale) => {
      const lang = { pt: "pt_BR", en: "en_US", es: "es_ES" }[locale];
      const L = {
        pt: {
          prompt: "Modo viagem:",
          i1: "🌍 Traduzir o que copiei",
          i2: "💱 Converter dólar → real",
          i3: "🏨 Guardar endereço do hotel",
          i4: "✈️ Ligar modo avião",
          askValor: "Quantos dólares?",
          askHotel: "Endereço do hotel?",
          hotelOk: "Endereço copiado — cole para o motorista.",
          reais: " reais",
        },
        en: {
          prompt: "Travel mode:",
          i1: "🌍 Translate what I copied",
          i2: "💱 Convert USD → BRL",
          i3: "🏨 Save hotel address",
          i4: "✈️ Airplane mode on",
          askValor: "How many dollars?",
          askHotel: "Hotel address?",
          hotelOk: "Address copied — paste it for the driver.",
          reais: " BRL",
        },
        es: {
          prompt: "Modo viaje:",
          i1: "🌍 Traducir lo que copié",
          i2: "💱 Convertir dólar → real",
          i3: "🏨 Guardar dirección del hotel",
          i4: "✈️ Activar modo avión",
          askValor: "¿Cuántos dólares?",
          askHotel: "¿Dirección del hotel?",
          hotelOk: "Dirección copiada — pégala para el conductor.",
          reais: " reales",
        },
      }[locale];
      return {
        name: { pt: "Modo Viagem", en: "Travel Mode", es: "Modo Viaje" }[locale],
        iconGlyph: 61440,
        iconColor: 431817727,
        steps: [
          credit(locale),
          { type: "menu", prompt: L.prompt, items: [L.i1, L.i2, L.i3, L.i4] },
          { type: "case", label: L.i1 },
          { type: "action", identifier: `${A}.getclipboard`, params: {}, ref: "copiado" },
          {
            type: "action",
            identifier: `${A}.text.translate`,
            params: { WFInputText: { ref: "copiado" }, WFSelectedLanguage: lang },
            ref: "traduzido",
          },
          { type: "action", identifier: `${A}.showresult`, params: { Text: { text: [{ ref: "traduzido" }] } } },
          { type: "case", label: L.i2 },
          { type: "action", identifier: `${A}.ask`, params: { WFAskActionPrompt: L.askValor, WFInputType: "Number" }, ref: "valor" },
          { type: "action", identifier: `${A}.downloadurl`, params: { WFURL: "https://economia.awesomeapi.com.br/json/last/USD-BRL" }, ref: "resp" },
          { type: "action", identifier: `${A}.detect.dictionary`, params: { WFInput: { ref: "resp" } }, ref: "json" },
          { type: "action", identifier: `${A}.getvalueforkey`, params: { WFInput: { ref: "json" }, WFDictionaryKey: "USDBRL" }, ref: "par" },
          { type: "action", identifier: `${A}.getvalueforkey`, params: { WFInput: { ref: "par" }, WFDictionaryKey: "bid" }, ref: "cotacao" },
          {
            type: "action",
            identifier: `${A}.calculateexpression`,
            params: { Input: { text: [{ ref: "valor" }, " × ", { ref: "cotacao" }] } },
            ref: "total",
          },
          {
            type: "action",
            identifier: `${A}.showresult`,
            params: { Text: { text: ["US$ ", { ref: "valor" }, " ≈ ", { ref: "total" }, L.reais] } },
          },
          { type: "case", label: L.i3 },
          { type: "action", identifier: `${A}.ask`, params: { WFAskActionPrompt: L.askHotel }, ref: "hotel" },
          { type: "action", identifier: `${A}.setclipboard`, params: { WFInput: { ref: "hotel" } } },
          { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: L.hotelOk } },
          { type: "case", label: L.i4 },
          { type: "action", identifier: `${A}.airplanemode.set`, params: { OnValue: true } },
          { type: "endmenu" },
        ],
      };
    },
  },

  {
    id: "fotos-para-whatsapp",
    emoji: "🫧",
    level: "bold",
    premium: true,
    title: t("Compressor de Fotos", "Photo Compressor", "Compresor de Fotos"),
    description: t(
      "Escolha várias fotos e ele comprime todas (1280px, JPEG leve) em lote — perfeito para mandar no WhatsApp sem estourar o grupo.",
      "Pick several photos and it compresses them all (1280px, light JPEG) in a batch — perfect for sharing without huge files.",
      "Elige varias fotos y las comprime todas (1280px, JPEG ligero) en lote — perfecto para enviar sin archivos gigantes."
    ),
    apps: ["whatsapp", "telegram", "instagram"],
    goals: ["media", "messages", "power"],
    build: (locale) => {
      const done = {
        pt: ["Prontas! ", { ref: "qtd" } as const, " fotos comprimidas e salvas no álbum. 🫧"],
        en: ["Done! ", { ref: "qtd" } as const, " photos compressed and saved to the album. 🫧"],
        es: ["¡Listas! ", { ref: "qtd" } as const, " fotos comprimidas y guardadas en el álbum. 🫧"],
      }[locale];
      return {
        name: { pt: "Compressor de Fotos", en: "Photo Compressor", es: "Compresor de Fotos" }[locale],
        iconGlyph: 61440,
        iconColor: 1440408063,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.selectphoto`, params: { WFSelectMultiplePhotos: true }, ref: "fotos" },
          { type: "repeatEach", input: { ref: "fotos" } },
          {
            type: "action",
            identifier: `${A}.image.resize`,
            params: { WFImage: { special: "RepeatItem" }, WFImageResizeWidth: 1280 },
            ref: "menor",
          },
          {
            type: "action",
            identifier: `${A}.image.convert`,
            params: { WFInput: { ref: "menor" }, WFImageFormat: "JPEG", WFImageCompressionQuality: 0.7 },
            ref: "jpeg",
          },
          { type: "action", identifier: `${A}.savetocameraroll`, params: { WFInput: { ref: "jpeg" } } },
          { type: "endrepeat" },
          { type: "action", identifier: `${A}.count`, params: { WFInput: { ref: "fotos" }, WFCountType: "Items" }, ref: "qtd" },
          { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: { text: [...done] } } },
        ],
      };
    },
  },

  {
    id: "agua-o-dia-todo",
    emoji: "⚡",
    level: "bold",
    premium: true,
    title: t("Hidratação do Dia", "All-day Hydration", "Hidratación del Día"),
    description: t(
      "Escolha a meta (4, 6 ou 8 copos) e ele cria um lembrete numerado para cada copo do dia — de uma vez só.",
      "Pick your goal (4, 6 or 8 glasses) and it creates a numbered reminder for every glass of the day — all at once.",
      "Elige tu meta (4, 6 u 8 vasos) y crea un recordatorio numerado por cada vaso del día — de una sola vez."
    ),
    apps: ["reminders"],
    goals: ["health", "morning"],
    routines: ["gym"],
    build: (locale) => {
      const L = {
        pt: { prompt: "Quantos copos hoje?", copo: "Beber água — copo ", ok: "Lembretes criados! 💧" },
        en: { prompt: "How many glasses today?", copo: "Drink water — glass ", ok: "Reminders created! 💧" },
        es: { prompt: "¿Cuántos vasos hoy?", copo: "Beber agua — vaso ", ok: "¡Recordatorios creados! 💧" },
      }[locale];
      const bloco = (n: number): IRStep[] => [
        { type: "case", label: String(n) },
        { type: "repeat", count: n },
        {
          type: "action",
          identifier: `${A}.addnewreminder`,
          params: { WFCalendarItemTitle: { text: [L.copo, { special: "RepeatIndex" }] } },
        },
        { type: "endrepeat" },
      ];
      return {
        name: { pt: "Hidratação do Dia", en: "All-day Hydration", es: "Hidratación del Día" }[locale],
        iconGlyph: 61440,
        iconColor: 431817727,
        steps: [
          credit(locale),
          { type: "menu", prompt: L.prompt, items: ["4", "6", "8"] },
          ...bloco(4),
          ...bloco(6),
          ...bloco(8),
          { type: "endmenu" },
          { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: L.ok } },
        ],
      };
    },
  },

  {
    id: "decisor-universal",
    emoji: "🎁",
    level: "medium",
    premium: true,
    title: t("Decisor Universal", "Universal Decider", "Decisor Universal"),
    description: t(
      "Cara ou coroa, dado de 6 lados ou sorteio da SUA lista (restaurantes, filmes, nomes…) — o app decide por você.",
      "Coin flip, six-sided die or a draw from YOUR list (restaurants, movies, names…) — let it decide for you.",
      "Cara o cruz, dado de 6 caras o sorteo de TU lista (restaurantes, películas, nombres…) — que decida por ti."
    ),
    goals: ["power", "media"],
    routines: ["family"],
    build: (locale) => {
      const L = {
        pt: { prompt: "Como decidimos?", i1: "🪙 Cara ou coroa", i2: "🎲 Dado (1-6)", i3: "📝 Sortear da minha lista", cara: "Cara", coroa: "Coroa", ask: "Itens separados por vírgula:" },
        en: { prompt: "How do we decide?", i1: "🪙 Coin flip", i2: "🎲 Die (1-6)", i3: "📝 Draw from my list", cara: "Heads", coroa: "Tails", ask: "Items separated by commas:" },
        es: { prompt: "¿Cómo decidimos?", i1: "🪙 Cara o cruz", i2: "🎲 Dado (1-6)", i3: "📝 Sortear de mi lista", cara: "Cara", coroa: "Cruz", ask: "Elementos separados por comas:" },
      }[locale];
      return {
        name: { pt: "Decisor Universal", en: "Universal Decider", es: "Decisor Universal" }[locale],
        iconGlyph: 61440,
        iconColor: 3980825855,
        steps: [
          credit(locale),
          { type: "menu", prompt: L.prompt, items: [L.i1, L.i2, L.i3] },
          { type: "case", label: L.i1 },
          { type: "action", identifier: `${A}.list`, params: { WFItems: [L.cara, L.coroa] }, ref: "moeda" },
          { type: "action", identifier: `${A}.getitemfromlist`, params: { WFInput: { ref: "moeda" }, WFItemSpecifier: "Random Item" }, ref: "lado" },
          { type: "action", identifier: `${A}.showresult`, params: { Text: { text: ["🪙 ", { ref: "lado" }] } } },
          { type: "case", label: L.i2 },
          { type: "action", identifier: `${A}.list`, params: { WFItems: ["1", "2", "3", "4", "5", "6"] }, ref: "dado" },
          { type: "action", identifier: `${A}.getitemfromlist`, params: { WFInput: { ref: "dado" }, WFItemSpecifier: "Random Item" }, ref: "numero" },
          { type: "action", identifier: `${A}.showresult`, params: { Text: { text: ["🎲 ", { ref: "numero" }] } } },
          { type: "case", label: L.i3 },
          { type: "action", identifier: `${A}.ask`, params: { WFAskActionPrompt: L.ask }, ref: "itens" },
          {
            type: "action",
            identifier: `${A}.text.split`,
            params: { text: { ref: "itens" }, WFTextSeparator: "Custom", WFTextCustomSeparator: "," },
            ref: "opcoes",
          },
          { type: "action", identifier: `${A}.getitemfromlist`, params: { WFInput: { ref: "opcoes" }, WFItemSpecifier: "Random Item" }, ref: "sorteado" },
          { type: "action", identifier: `${A}.showresult`, params: { Text: { text: ["🎁 ", { ref: "sorteado" }] } } },
          { type: "endmenu" },
        ],
      };
    },
  },

  {
    id: "ouvir-textao",
    emoji: "🔔",
    level: "medium",
    premium: true,
    title: t("Ouvir o Textão", "Read It Aloud", "Escuchar el Textazo"),
    description: t(
      "Copiou um artigo ou textão? Ele lê em voz alta enquanto você faz outra coisa — na velocidade que você escolher.",
      "Copied an article or a wall of text? It reads it aloud while you do something else — at the speed you choose.",
      "¿Copiaste un artículo o un textazo? Lo lee en voz alta mientras haces otra cosa — a la velocidad que elijas."
    ),
    goals: ["productivity", "power"],
    routines: ["commute", "study"],
    build: (locale) => {
      const L = {
        pt: { prompt: "Velocidade da leitura:", i1: "🐢 Normal", i2: "🚀 Rápida" },
        en: { prompt: "Reading speed:", i1: "🐢 Normal", i2: "🚀 Fast" },
        es: { prompt: "Velocidad de lectura:", i1: "🐢 Normal", i2: "🚀 Rápida" },
      }[locale];
      const voz = { pt: "pt-BR", en: "en-US", es: "es-ES" }[locale];
      return {
        name: { pt: "Ouvir o Textão", en: "Read It Aloud", es: "Escuchar el Textazo" }[locale],
        iconGlyph: 61440,
        iconColor: 4271458815,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.getclipboard`, params: {}, ref: "texto" },
          { type: "menu", prompt: L.prompt, items: [L.i1, L.i2] },
          { type: "case", label: L.i1 },
          {
            type: "action",
            identifier: `${A}.speaktext`,
            params: { WFText: { text: [{ ref: "texto" }] }, WFSpeakTextRate: 0.5, WFSpeakTextLanguage: voz },
          },
          { type: "case", label: L.i2 },
          {
            type: "action",
            identifier: `${A}.speaktext`,
            params: { WFText: { text: [{ ref: "texto" }] }, WFSpeakTextRate: 0.62, WFSpeakTextLanguage: voz },
          },
          { type: "endmenu" },
        ],
      };
    },
  },

  {
    id: "ritual-de-dormir",
    emoji: "🌙",
    level: "bold",
    premium: true,
    title: t("Ritual de Dormir", "Wind-down Ritual", "Ritual de Dormir"),
    description: t(
      "Gratidão do dia num diário, foco ligado, brilho e volume no mínimo e um 'boa noite' falado — o iPhone te ajuda a desligar.",
      "Gratitude journaling, Focus on, brightness and volume down and a spoken 'good night' — your iPhone helps you switch off.",
      "Gratitud en un diario, concentración activada, brillo y volumen al mínimo y un 'buenas noches' hablado."
    ),
    goals: ["health", "focus"],
    routines: ["family", "study"],
    build: (locale) => {
      const L = {
        pt: { ask: "Pelo que você é grato hoje?", file: "Gratidao.txt", boanoite: "Boa noite. Descanse bem." },
        en: { ask: "What are you grateful for today?", file: "Gratitude.txt", boanoite: "Good night. Rest well." },
        es: { ask: "¿Por qué estás agradecido hoy?", file: "Gratitud.txt", boanoite: "Buenas noches. Descansa bien." },
      }[locale];
      const voz = { pt: "pt-BR", en: "en-US", es: "es-ES" }[locale];
      return {
        name: { pt: "Ritual de Dormir", en: "Wind-down Ritual", es: "Ritual de Dormir" }[locale],
        iconGlyph: 61440,
        iconColor: 2071128575,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.ask`, params: { WFAskActionPrompt: L.ask }, ref: "gratidao" },
          { type: "action", identifier: `${A}.date`, params: { WFDateActionMode: "Current Date" }, ref: "hoje" },
          { type: "action", identifier: `${A}.format.date`, params: { WFDate: { ref: "hoje" }, WFDateFormatStyle: "Short" }, ref: "data" },
          {
            type: "action",
            identifier: `${A}.file.append`,
            params: { WFFilePath: L.file, WFInput: { text: ["[", { ref: "data" }, "] ", { ref: "gratidao" }] } },
            ref: "arq",
          },
          { type: "action", identifier: `${A}.dnd.set`, params: { Enabled: 1 } },
          { type: "action", identifier: `${A}.setbrightness`, params: { WFBrightness: 0.1 } },
          { type: "action", identifier: `${A}.setvolume`, params: { WFVolume: 0.2 } },
          { type: "action", identifier: `${A}.speaktext`, params: { WFText: L.boanoite, WFSpeakTextLanguage: voz } },
        ],
      };
    },
  },

  {
    id: "radar-do-dolar",
    emoji: "🧠",
    level: "bold",
    premium: true,
    title: t("Radar do Dólar", "Dollar Radar", "Radar del Dólar"),
    description: t(
      "Escolha seu teto (R$ 5,00 / 5,50 / 6,00): ele consulta o câmbio ao vivo e AVISA com alarde se passou — ou mostra discreto se está abaixo.",
      "Pick your ceiling (R$ 5.00 / 5.50 / 6.00): it checks the live rate and ALERTS loudly if it crossed — or shows quietly if below.",
      "Elige tu techo (R$ 5,00 / 5,50 / 6,00): consulta el cambio en vivo y AVISA fuerte si lo superó — o lo muestra discreto si está debajo."
    ),
    apps: ["banking"],
    goals: ["power", "productivity"],
    build: (locale) => {
      const L = {
        pt: { prompt: "Avisar se o dólar passar de:", acima: "🚨 Dólar ACIMA do seu teto: R$ ", abaixo: "Dólar tranquilo: R$ " },
        en: { prompt: "Alert if USD goes above:", acima: "🚨 USD ABOVE your ceiling: R$ ", abaixo: "USD is calm: R$ " },
        es: { prompt: "Avisar si el dólar supera:", acima: "🚨 Dólar POR ENCIMA de tu techo: R$ ", abaixo: "Dólar tranquilo: R$ " },
      }[locale];
      const bloco = (label: string, teto: number): IRStep[] => [
        { type: "case", label },
        { type: "if", input: { ref: "cotacao" }, operator: "greaterThan", value: teto },
        {
          type: "action",
          identifier: `${A}.notification`,
          params: { WFNotificationActionBody: { text: [L.acima, { ref: "cotacao" }] } },
        },
        { type: "otherwise" },
        { type: "action", identifier: `${A}.showresult`, params: { Text: { text: [L.abaixo, { ref: "cotacao" }] } } },
        { type: "endif" },
      ];
      return {
        name: { pt: "Radar do Dólar", en: "Dollar Radar", es: "Radar del Dólar" }[locale],
        iconGlyph: 61440,
        iconColor: 4292093695,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.downloadurl`, params: { WFURL: "https://economia.awesomeapi.com.br/json/last/USD-BRL" }, ref: "resp" },
          { type: "action", identifier: `${A}.detect.dictionary`, params: { WFInput: { ref: "resp" } }, ref: "json" },
          { type: "action", identifier: `${A}.getvalueforkey`, params: { WFInput: { ref: "json" }, WFDictionaryKey: "USDBRL" }, ref: "par" },
          { type: "action", identifier: `${A}.getvalueforkey`, params: { WFInput: { ref: "par" }, WFDictionaryKey: "bid" }, ref: "cotacao" },
          { type: "menu", prompt: L.prompt, items: ["5,00", "5,50", "6,00"] },
          ...bloco("5,00", 5),
          ...bloco("5,50", 5.5),
          ...bloco("6,00", 6),
          { type: "endmenu" },
        ],
      };
    },
  },

  {
    id: "inbox-por-voz",
    emoji: "🪄",
    level: "medium",
    premium: true,
    title: t("Inbox por Voz", "Voice Inbox", "Inbox por Voz"),
    description: t(
      "Teve uma ideia andando na rua? Fale — ele transcreve, carimba a data e guarda na nota 'Inbox'. Zero fricção.",
      "Got an idea on the go? Speak — it transcribes, timestamps and files it in your 'Inbox' note. Zero friction.",
      "¿Se te ocurrió algo por la calle? Habla — lo transcribe, le pone fecha y lo guarda en tu nota 'Inbox'."
    ),
    apps: ["notes"],
    goals: ["productivity", "power"],
    routines: ["commute", "creator"],
    build: (locale) => {
      const ok = { pt: "Capturado no Inbox 🪄", en: "Captured in Inbox 🪄", es: "Capturado en Inbox 🪄" }[locale];
      return {
        name: { pt: "Inbox por Voz", en: "Voice Inbox", es: "Inbox por Voz" }[locale],
        iconGlyph: 61440,
        iconColor: 3679049983,
        steps: [
          credit(locale),
          { type: "action", identifier: `${A}.dictatetext`, params: { WFDictateTextStopListening: "After Pause" }, ref: "ideia" },
          { type: "action", identifier: `${A}.date`, params: { WFDateActionMode: "Current Date" }, ref: "agora" },
          {
            type: "action",
            identifier: `${A}.format.date`,
            params: { WFDate: { ref: "agora" }, WFDateFormatStyle: "Short", WFTimeFormatStyle: "Short" },
            ref: "quando",
          },
          {
            type: "action",
            identifier: `${A}.appendnote`,
            params: { WFNote: "Inbox", WFInput: { text: ["[", { ref: "quando" }, "] ", { ref: "ideia" }] } },
          },
          { type: "action", identifier: `${A}.notification`, params: { WFNotificationActionBody: ok } },
        ],
      };
    },
  },
];
