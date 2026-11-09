import { z } from "zod";
import { GOALS, PRIVACY_SECTIONS, TOPIC_RELATIONS } from "@/lib/content";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((v) => v.replace(/\r\n/g, "\n"));

const optionalShort = (min: number, max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .refine((v) => v === "" || v.length >= min, `Mínimo ${min} caracteres.`)
    .transform((v) => (v === "" ? null : v));

export const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

/** Máximo de temas elegibles en el editor y de temas principales. */
export const MAX_TOPICS = 80;
export const MAX_PRIMARY = 5;
export const MAX_SKILLS = 30;

const relationKeys = TOPIC_RELATIONS.map((r) => r.key) as [string, ...string[]];
const goalKeys = GOALS.map((g) => g.key) as [string, ...string[]];
const visibility = z.enum(["public", "connections", "private"]);

const topicItem = z.object({
  topic_id: z.number().int().positive(),
  relation: z.enum(relationKeys),
  is_primary: z.boolean(),
});

export const profileSchema = z.object({
  username: z.string().trim().regex(USERNAME_RE, "De 3 a 24 caracteres: letras, números o guion bajo."),
  display_name: z.string().trim().min(1, "¿Cómo quieres que te llamen?").max(60, "Máximo 60 caracteres."),
  bio: optionalText(600),
  exploring: optionalText(600),
  can_offer: optionalText(600),
  looking_for: optionalText(400),
  personal_projects: optionalText(600),
  skills: z
    .array(z.string().trim().min(2, "Cada habilidad necesita 2 caracteres o más.").max(40, "Máximo 40 caracteres por habilidad."))
    .max(MAX_SKILLS, `Máximo ${MAX_SKILLS} habilidades.`)
    .transform((list) => {
      const seen = new Set<string>();
      return list.filter((s) => {
        const k = s.toLocaleLowerCase("es");
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }),
  country: optionalShort(2, 60),
  region: optionalShort(2, 80),
  availability: z.enum(["open", "sometimes", "closed"]),
  languages: z.array(z.string().trim().min(2).max(30)).max(10, "Máximo 10 idiomas."),
  topics: z
    .array(topicItem)
    .max(MAX_TOPICS, `Máximo ${MAX_TOPICS} temas.`)
    .refine((t) => t.filter((x) => x.is_primary).length <= MAX_PRIMARY, `Marca como principales ${MAX_PRIMARY} temas como máximo.`)
    .refine((t) => new Set(t.map((x) => x.topic_id)).size === t.length, "Hay temas repetidos."),
  goals: z.array(z.enum(goalKeys)).max(GOALS.length),
  privacy: z.object(Object.fromEntries(PRIVACY_SECTIONS.map((s) => [s.key, visibility])) as Record<
    (typeof PRIVACY_SECTIONS)[number]["key"],
    typeof visibility
  >),
});

export type ProfileInput = z.infer<typeof profileSchema>;

function parseTopics(raw: string): unknown {
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return null;
  }
}

/** Extrae los campos del formulario, incluidos los múltiples y la lista de temas (JSON). */
export function readProfileForm(fd: FormData) {
  const one = (k: string) => String(fd.get(k) ?? "");
  return {
    username: one("username"),
    display_name: one("display_name"),
    bio: one("bio"),
    exploring: one("exploring"),
    can_offer: one("can_offer"),
    looking_for: one("looking_for"),
    personal_projects: one("personal_projects"),
    skills: fd.getAll("skills").map(String),
    country: one("country"),
    region: one("region"),
    availability: one("availability") || "sometimes",
    languages: fd.getAll("languages").map(String),
    topics: parseTopics(one("topics")),
    goals: fd.getAll("goals").map(String),
    privacy: Object.fromEntries(PRIVACY_SECTIONS.map((s) => [s.key, one(`privacy_${s.key}`) || "public"])),
  };
}
