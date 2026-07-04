// Perfil do usuário coletado no micro-quiz. Fica só no localStorage —
// no iOS não há API para detectar apps instalados (e as diretrizes da App Store
// proíbem fingerprinting), então perguntar é o único caminho correto.

export type Boldness = "safe" | "bold" | "wild";

export interface UserProfile {
  devices: string[]; // "iphone" | "mac" | "ipad" | "watch"
  apps: string[]; // ids de KNOWN_APPS
  routine: string[]; // ids de ROUTINES
  goals: string[]; // ids de GOALS
  boldness: Boldness;
  completedAt: string;
}

export const KNOWN_APPS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "spotify", label: "Spotify" },
  { id: "applemusic", label: "Apple Music" },
  { id: "youtube", label: "YouTube" },
  { id: "gmail", label: "Gmail" },
  { id: "outlook", label: "Outlook" },
  { id: "gcal", label: "Google Calendar" },
  { id: "maps", label: "Google Maps / Waze" },
  { id: "notion", label: "Notion" },
  { id: "todoist", label: "Todoist / Things" },
  { id: "notes", label: "Notas (Apple)" },
  { id: "reminders", label: "Lembretes (Apple)" },
  { id: "telegram", label: "Telegram" },
  { id: "slack", label: "Slack" },
  { id: "uber", label: "Uber / 99" },
  { id: "ifood", label: "iFood" },
  { id: "banking", label: "Banco / Pix" },
  { id: "strava", label: "Strava / Fitness" },
  { id: "kindle", label: "Kindle / Books" },
] as const;

export const ROUTINES = [
  { id: "commute", pt: "Pego trânsito / transporte todo dia", en: "I commute daily", es: "Viajo al trabajo a diario" },
  { id: "meetings", pt: "Dia cheio de reuniões", en: "Back-to-back meetings", es: "Día lleno de reuniones" },
  { id: "gym", pt: "Treino / academia", en: "Gym / training", es: "Gimnasio / entrenamiento" },
  { id: "study", pt: "Estudo com frequência", en: "I study often", es: "Estudio con frecuencia" },
  { id: "family", pt: "Rotina com família / filhos", en: "Family / kids routine", es: "Rutina con familia / hijos" },
  { id: "travel", pt: "Viajo com frequência", en: "I travel often", es: "Viajo con frecuencia" },
  { id: "creator", pt: "Crio conteúdo / redes sociais", en: "I create content / social media", es: "Creo contenido / redes" },
] as const;

export const GOALS = [
  { id: "morning", pt: "Começar o dia no automático", en: "Start the day on autopilot", es: "Empezar el día en automático" },
  { id: "focus", pt: "Proteger meu foco", en: "Protect my focus", es: "Proteger mi concentración" },
  { id: "messages", pt: "Mensagens mais rápidas", en: "Faster messaging", es: "Mensajes más rápidos" },
  { id: "media", pt: "Música e mídia sem fricção", en: "Frictionless music & media", es: "Música y medios sin fricción" },
  { id: "productivity", pt: "Notas, tarefas e lembretes", en: "Notes, tasks & reminders", es: "Notas, tareas y recordatorios" },
  { id: "health", pt: "Hábitos e saúde", en: "Habits & health", es: "Hábitos y salud" },
  { id: "power", pt: "Coisas que ninguém imagina que dá pra fazer", en: "Things nobody imagines are possible", es: "Cosas que nadie imagina posibles" },
] as const;

export const DEVICES = [
  { id: "iphone", label: "iPhone" },
  { id: "mac", label: "Mac" },
  { id: "ipad", label: "iPad" },
  { id: "watch", label: "Apple Watch" },
] as const;

const STORAGE_KEY = "atalho-coach:profile";

export function loadProfile(): UserProfile | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
