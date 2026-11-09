/**
 * Contenido editorial estático de la plataforma (no son datos de usuarios).
 */
import type { ComponentType, SVGProps } from "react";
import {
  IconAgora,
  IconCircles,
  IconCommunity,
  IconConnections,
  IconExplore,
  IconProfile,
  IconProjects,
} from "@/components/ui/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

export type Area = {
  href: string;
  name: string;
  short: string;
  description: string;
  icon: Icon;
  /** Fase del plan en la que la sección queda operativa. */
  phase: number;
};

export const AREAS: Area[] = [
  {
    href: "/explorar",
    name: "Explorar",
    short: "Descubrir",
    description: "Lo que se mueve en la comunidad: publicaciones, debates, círculos, proyectos y personas nuevas.",
    icon: IconExplore,
    phase: 3,
  },
  {
    href: "/comunidad",
    name: "Comunidad",
    short: "Foros",
    description: "Doce territorios de conversación larga y ordenada, del cosmos a la huerta.",
    icon: IconCommunity,
    phase: 3,
  },
  {
    href: "/conexiones",
    name: "Conexiones",
    short: "Personas",
    description: "Encuentra a quien comparte tus preguntas. Afinidad intelectual, no citas.",
    icon: IconConnections,
    phase: 4,
  },
  {
    href: "/circulos",
    name: "Círculos",
    short: "Grupos",
    description: "Grupos públicos, privados o por invitación, con debates y chat propio.",
    icon: IconCircles,
    phase: 5,
  },
  {
    href: "/proyectos",
    name: "Proyectos",
    short: "Iniciativas",
    description: "Donde las conversaciones se convierten en casas, huertos, talleres e investigaciones.",
    icon: IconProjects,
    phase: 5,
  },
  {
    href: "/agora",
    name: "Ágora",
    short: "Plaza",
    description: "La plaza abierta. Preguntas rápidas, ideas sueltas y conversación sin categoría.",
    icon: IconAgora,
    phase: 5,
  },
];

export const PROFILE_AREA: Area = {
  href: "/perfil",
  name: "Perfil",
  short: "Perfil",
  description: "Tu identidad en la comunidad.",
  icon: IconProfile,
  phase: 2,
};

/** Barra inferior móvil: cinco destinos. */
export const MOBILE_NAV = [AREAS[0], AREAS[1], AREAS[2], AREAS[5], PROFILE_AREA];

/** Carácter epistémico de una aportación. */
export const EPISTEMIC_KINDS = [
  {
    key: "documented",
    name: "Documentado",
    mark: "D",
    description: "Se apoya en fuentes verificables que se citan.",
  },
  {
    key: "hypothesis",
    name: "Hipótesis",
    mark: "H",
    description: "Una idea por explorar. Se presenta como posibilidad, no como hecho.",
  },
  {
    key: "opinion",
    name: "Opinión",
    mark: "O",
    description: "Una postura personal argumentada.",
  },
  {
    key: "experience",
    name: "Experiencia",
    mark: "E",
    description: "Algo vivido en primera persona.",
  },
] as const;

export const AVAILABILITY_LABELS = {
  open: "Disponible para conversar",
  sometimes: "Conversa a veces",
  closed: "Ahora no disponible",
} as const;

export const LANGUAGES = [
  "Español",
  "English",
  "Português",
  "Français",
  "Italiano",
  "Deutsch",
  "Català",
  "Euskara",
  "Galego",
] as const;

/** Los doce territorios del foro (espejo de la tabla `categories`). */
export const TERRITORIES = [
  ["universo", "Universo y astronomía"],
  ["ciencia", "Ciencia y física cuántica"],
  ["conciencia", "Conciencia y filosofía"],
  ["historia", "Historia y civilizaciones"],
  ["misterios", "Misterios y fenómenos inexplicados"],
  ["simbolismo", "Sociedades y simbolismo"],
  ["tecnologia", "Tecnología e inteligencia artificial"],
  ["autosuficiencia", "Autosuficiencia"],
  ["bioconstruccion", "Bioconstrucción"],
  ["vida-rural", "Naturaleza y vida rural"],
  ["supervivencia", "Supervivencia y conocimientos prácticos"],
  ["debate", "Debate libre"],
] as const;

export type PostKind = (typeof EPISTEMIC_KINDS)[number]["key"];
export const KIND_BY_KEY = Object.fromEntries(EPISTEMIC_KINDS.map((k) => [k.key, k])) as Record<
  PostKind,
  (typeof EPISTEMIC_KINDS)[number]
>;

/** Reacciones propias de la comunidad (no «me gusta»). */
export const REACTIONS = [
  { key: "valuable", label: "Aporta", hint: "Esta aportación suma a la conversación" },
  { key: "curious", label: "Me intriga", hint: "Quiero saber más" },
  { key: "agree", label: "De acuerdo", hint: "Comparto esta postura" },
  { key: "needs_sources", label: "Pide fuentes", hint: "Necesita referencias para sostenerse" },
] as const;
export type ReactionKey = (typeof REACTIONS)[number]["key"];

/** Ordenaciones de los listados. */
export const SORTS: readonly { key: "recent" | "popular" | "commented" | "trending"; label: string; short?: string }[] = [
  { key: "recent", label: "Recientes" },
  { key: "popular", label: "Populares" },
  { key: "commented", label: "Más comentados", short: "Comentados" },
  { key: "trending", label: "Tendencias" },
];
export type SortKey = (typeof SORTS)[number]["key"];
export function parseSort(v: string | undefined): SortKey {
  return SORTS.some((s) => s.key === v) ? (v as SortKey) : "recent";
}

export const REPORT_REASONS = [
  { key: "spam", label: "Spam o publicidad" },
  { key: "harassment", label: "Acoso o ataques personales" },
  { key: "hate", label: "Discurso de odio" },
  { key: "personal_data", label: "Datos personales de terceros" },
  { key: "mislabeled", label: "Presenta una hipótesis como hecho" },
  { key: "illegal", label: "Contenido ilegal" },
  { key: "other", label: "Otro motivo" },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]["key"];

/** Qué territorios recomendar según los intereses de cada persona. */
export const INTEREST_TO_CATEGORIES: Record<string, string[]> = {
  "fisica-cuantica": ["ciencia", "universo"],
  astronomia: ["universo", "ciencia"],
  conciencia: ["conciencia"],
  civilizaciones: ["historia", "misterios"],
  historia: ["historia"],
  "sociedades-discretas": ["simbolismo", "historia"],
  misterios: ["misterios"],
  uap: ["misterios", "universo"],
  "ia-tecnologia": ["tecnologia"],
  autosuficiencia: ["autosuficiencia", "supervivencia"],
  bioconstruccion: ["bioconstruccion", "autosuficiencia"],
  agricultura: ["vida-rural", "autosuficiencia"],
  "energias-alternativas": ["autosuficiencia", "tecnologia"],
  "vida-rural": ["vida-rural"],
  psicologia: ["conciencia"],
  debate: ["debate"],
  proyectos: ["bioconstruccion", "tecnologia"],
  amistad: ["debate"],
};

export const VISIBILITY = {
  public: { label: "Público", hint: "Cualquier miembro puede ver su contenido y unirse." },
  private: { label: "Privado", hint: "Visible en el listado; el contenido es solo para miembros. Se entra por solicitud." },
  invite: { label: "Por invitación", hint: "Oculto para quien no es miembro. Solo se entra por invitación." },
} as const;

export const PROJECT_STATUS = {
  idea: "Idea",
  planning: "En preparación",
  active: "En marcha",
  paused: "En pausa",
  completed: "Completado",
} as const;
