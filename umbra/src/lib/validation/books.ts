import { z } from "zod";

const year = z
  .string()
  .trim()
  .transform((v) => (v ? Number(v) : null))
  .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 2100), "Año no válido.");

const isbn = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^0-9Xx]/g, "").toUpperCase())
  .refine((v) => v === "" || /^(97[89])?\d{9}[\dX]$/.test(v), "ISBN de 10 o 13 cifras (opcional).");

export const recommendationSchema = z.object({
  body: z.string().trim().min(20, "Cuenta por qué lo recomiendas (mín. 20 caracteres).").max(3000, "Máximo 3.000 caracteres."),
  level: z.enum(["intro", "intermediate", "advanced"], { error: "Elige el nivel." }),
  rating: z
    .string()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 5), "Valoración de 1 a 5."),
});

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Indica el título.").max(200, "Máximo 200 caracteres."),
  authors: z.string().trim().min(2, "Indica la autoría.").max(200, "Máximo 200 caracteres."),
  year,
  isbn,
  area: z.string().trim().max(40),
  topics: z.array(z.coerce.number().int().positive()).max(6, "Máximo 6 temas."),
});

export function readRecommendation(fd: FormData) {
  return {
    body: String(fd.get("body") ?? ""),
    level: String(fd.get("level") ?? "intro"),
    rating: String(fd.get("rating") ?? ""),
  };
}

export function readBook(fd: FormData) {
  return {
    title: String(fd.get("title") ?? ""),
    authors: String(fd.get("authors") ?? ""),
    year: String(fd.get("year") ?? ""),
    isbn: String(fd.get("isbn") ?? ""),
    area: String(fd.get("area") ?? ""),
    topics: fd.getAll("topics").map(String),
  };
}
