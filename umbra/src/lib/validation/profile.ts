import { z } from "zod";

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

export const profileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .regex(USERNAME_RE, "De 3 a 24 caracteres: letras, números o guion bajo."),
    display_name: z.string().trim().min(1, "¿Cómo quieres que te llamen?").max(60, "Máximo 60 caracteres."),
    bio: optionalText(600),
    looking_for: optionalText(400),
    personal_projects: optionalText(600),
    country: optionalShort(2, 60),
    region: optionalShort(2, 80),
    availability: z.enum(["open", "sometimes", "closed"]),
    languages: z.array(z.string().trim().min(2).max(30)).max(10, "Máximo 10 idiomas."),
    interests: z
      .array(z.string().regex(/^[a-z0-9-]{2,40}$/))
      .min(3, "Elige al menos 3 intereses.")
      .max(24, "Máximo 24 intereses."),
    favorites: z.array(z.string()).max(3, "Elige como máximo 3 temas favoritos."),
  })
  .transform((d) => ({ ...d, favorites: d.favorites.filter((f) => d.interests.includes(f)) }));

export type ProfileInput = z.infer<typeof profileSchema>;

/** Extrae los campos del formulario, incluidos los múltiples. */
export function readProfileForm(fd: FormData) {
  const one = (k: string) => String(fd.get(k) ?? "");
  return {
    username: one("username"),
    display_name: one("display_name"),
    bio: one("bio"),
    looking_for: one("looking_for"),
    personal_projects: one("personal_projects"),
    country: one("country"),
    region: one("region"),
    availability: one("availability") || "sometimes",
    languages: fd.getAll("languages").map(String),
    interests: fd.getAll("interests").map(String),
    favorites: fd.getAll("favorites").map(String),
  };
}
