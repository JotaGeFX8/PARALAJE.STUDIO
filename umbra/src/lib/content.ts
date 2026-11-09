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
  description: "Tu identidad en UMBRA.",
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
  open: "Abierta a conversar",
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
