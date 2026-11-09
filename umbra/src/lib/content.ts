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
    description: "Siete foros con normas propias y subcategorías: del cosmos a la huerta, pasando por el Ágora.",
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
    href: "/comunidad/agora",
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

/** Clasificación epistémica de una aportación (lo que se ofrece al publicar). */
export const EPISTEMIC_KINDS = [
  {
    key: "documented",
    name: "Hecho documentado",
    short: "Documentado",
    mark: "D",
    description: "Se apoya en fuentes verificables que se citan.",
  },
  {
    key: "hypothesis",
    name: "Hipótesis",
    short: "Hipótesis",
    mark: "H",
    description: "Una posibilidad por explorar; no se presenta como hecho.",
  },
  {
    key: "interpretation",
    name: "Interpretación",
    short: "Interpretación",
    mark: "I",
    description: "Una lectura argumentada de hechos o fuentes.",
  },
  {
    key: "opinion",
    name: "Opinión",
    short: "Opinión",
    mark: "O",
    description: "Una postura personal argumentada.",
  },
  {
    key: "open_question",
    name: "Pregunta abierta",
    short: "Pregunta abierta",
    mark: "?",
    description: "Una duda sin respuesta establecida.",
  },
] as const;

/** Valor heredado (antes de la v2): solo para mostrar publicaciones antiguas. */
const LEGACY_EXPERIENCE = {
  key: "experience",
  name: "Experiencia",
  short: "Experiencia",
  mark: "E",
  description: "Algo vivido en primera persona.",
} as const;

/** Tipos de publicación. */
export const POST_TYPES = [
  { key: "debate", name: "Debate", description: "Una cuestión para discutir con argumentos." },
  { key: "question", name: "Pregunta", description: "Buscas respuesta o ayuda de la comunidad." },
  { key: "research", name: "Investigación", description: "Un trabajo en curso o terminado, con método y fuentes." },
  { key: "discovery", name: "Descubrimiento", description: "Algo que has encontrado y merece atención." },
  { key: "experience", name: "Experiencia personal", description: "Algo vivido en primera persona." },
  { key: "resource", name: "Recurso", description: "Un libro, enlace, herramienta o guía útil." },
  { key: "poll", name: "Encuesta", description: "Una pregunta con opciones para votar." },
  { key: "idea", name: "Idea", description: "Una propuesta para desarrollar entre varias personas." },
] as const;
export type PostTypeKey = (typeof POST_TYPES)[number]["key"];
export const TYPE_BY_KEY = Object.fromEntries(POST_TYPES.map((t) => [t.key, t])) as Record<PostTypeKey, (typeof POST_TYPES)[number]>;

/** Clasificación que se propone por defecto para cada tipo. */
export const DEFAULT_KIND_FOR_TYPE: Partial<Record<PostTypeKey, (typeof EPISTEMIC_KINDS)[number]["key"]>> = {
  question: "open_question",
  research: "interpretation",
  poll: "open_question",
};

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

/** Los siete foros (espejo editorial de la tabla `forums`, para la portada pública). */
export const FORUMS = [
  ["universo", "Universo", "Cosmos, astronomía, exploración espacial y fenómenos sin explicar."],
  ["ciencia", "Ciencia", "Física, química, biología y salud, con método."],
  ["historia", "Historia y culturas", "Civilizaciones, arqueología, tradiciones y símbolos."],
  ["conciencia", "Conciencia y pensamiento", "Mente, percepción, filosofía y ética."],
  ["tecnologia", "Tecnología y futuro", "Inteligencia artificial, software libre y sociedad."],
  ["naturaleza", "Naturaleza y vida práctica", "Huerta, bioconstrucción, autosuficiencia y oficios."],
  ["agora", "Ágora", "La plaza abierta: presentaciones, ideas y conversación libre."],
] as const;

/** Clasificaciones que se pueden elegir al publicar. */
export type PostKind = (typeof EPISTEMIC_KINDS)[number]["key"];
/** Cualquier valor guardado (incluido el heredado «experience»). */
export type AnyPostKind = PostKind | "experience";
type KindInfo = { key: AnyPostKind; name: string; short: string; mark: string; description: string };
export const KIND_BY_KEY = Object.fromEntries(
  [...EPISTEMIC_KINDS, LEGACY_EXPERIENCE].map((k) => [k.key, k]),
) as Record<AnyPostKind, KindInfo>;

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

/** Territorios relacionados con cada área del catálogo (para recomendaciones). */
export const AREA_TO_CATEGORIES: Record<string, string[]> = {
  cosmos: ["universo"],
  fisica: ["ciencia"],
  biologia: ["ciencia", "vida-rural"],
  mente: ["conciencia"],
  filosofia: ["conciencia", "debate"],
  historia: ["historia"],
  arqueologia: ["historia", "misterios"],
  anomalias: ["misterios"],
  tradiciones: ["simbolismo", "conciencia"],
  tecnologia: ["tecnologia"],
  naturaleza: ["vida-rural"],
  agricultura: ["autosuficiencia", "vida-rural"],
  arquitectura: ["bioconstruccion"],
  exploracion: ["supervivencia"],
  arte: ["debate"],
  sociedad: ["debate"],
  ingenieria: ["tecnologia", "supervivencia"],
  emprendimiento: ["tecnologia"],
  bienestar: ["conciencia"],
  literatura: ["historia", "debate"],
  relaciones: ["debate"],
  agora: ["debate"],
};

/** Relación de una persona con un tema. */
export const TOPIC_RELATIONS = [
  { key: "interested", label: "Me interesa", short: "Interés" },
  { key: "learning", label: "Estoy aprendiendo", short: "Aprendiendo" },
  { key: "knowledgeable", label: "Tengo conocimientos", short: "Conocimientos" },
  { key: "experienced", label: "Tengo experiencia", short: "Experiencia" },
  { key: "can_teach", label: "Puedo enseñar o ayudar", short: "Puede enseñar" },
  { key: "seeking_collaborators", label: "Busco colaboradores", short: "Busca colaborar" },
] as const;
export type TopicRelationKey = (typeof TOPIC_RELATIONS)[number]["key"];
export const RELATION_LABEL = Object.fromEntries(TOPIC_RELATIONS.map((r) => [r.key, r])) as Record<
  TopicRelationKey,
  (typeof TOPIC_RELATIONS)[number]
>;

/** Objetivos dentro de la comunidad. */
export const GOALS = [
  { key: "learn", label: "Aprender" },
  { key: "research", label: "Investigar" },
  { key: "debate", label: "Debatir" },
  { key: "share", label: "Compartir conocimientos" },
  { key: "meet_people", label: "Encontrar personas" },
  { key: "friendship", label: "Crear amistades" },
  { key: "find_collaborators", label: "Encontrar colaboradores" },
  { key: "join_projects", label: "Participar en proyectos" },
  { key: "create_circles", label: "Crear círculos" },
  { key: "join_communities", label: "Participar en comunidades" },
  { key: "organize_meetups", label: "Organizar encuentros" },
  { key: "share_experiences", label: "Compartir experiencias" },
] as const;
export type GoalKey = (typeof GOALS)[number]["key"];
export const GOAL_LABEL = Object.fromEntries(GOALS.map((g) => [g.key, g.label])) as Record<GoalKey, string>;

/** Visibilidad de cada apartado del perfil. */
export const VISIBILITY_OPTIONS = [
  { key: "public", label: "Miembros", hint: "Cualquier persona registrada" },
  { key: "connections", label: "Conexiones", hint: "Solo tus conexiones" },
  { key: "private", label: "Solo yo", hint: "Nadie más" },
] as const;
export type VisibilityKey = (typeof VISIBILITY_OPTIONS)[number]["key"];

export const PRIVACY_SECTIONS = [
  { key: "location", label: "Ubicación", hint: "País y región" },
  { key: "about", label: "Presentación", hint: "Quién soy, qué exploro, qué aporto, habilidades" },
  { key: "interests", label: "Intereses y objetivos", hint: "Temas, conocimientos y objetivos" },
  { key: "activity", label: "Actividad", hint: "Publicaciones, círculos y proyectos en tu perfil" },
  { key: "network", label: "Red", hint: "Tus conexiones" },
] as const;
export type PrivacySectionKey = (typeof PRIVACY_SECTIONS)[number]["key"];


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
