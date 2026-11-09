import { z } from "zod";

export const KIND_VALUES = ["documented", "hypothesis", "opinion", "experience"] as const;

const sourceList = z
  .array(z.string().trim().max(500, "Cada fuente admite 500 caracteres."))
  .max(12, "Máximo 12 fuentes.")
  .transform((a) => a.filter(Boolean));

const tagList = z
  .array(z.string().trim().min(2, "Etiquetas de 2 a 32 caracteres.").max(32, "Etiquetas de 2 a 32 caracteres."))
  .max(5, "Máximo 5 etiquetas.");

export const postSchema = z
  .object({
    category: z.string().trim().max(40).optional().transform((v) => v || null),
    title: z.string().trim().max(160, "Máximo 160 caracteres.").optional().transform((v) => v || null),
    body: z.string().trim().min(1, "Escribe algo.").max(20000, "Máximo 20.000 caracteres."),
    kind: z.enum(KIND_VALUES, { error: "Elige qué tipo de aportación es." }),
    is_question: z.boolean(),
    sources: sourceList,
    tags: tagList,
  })
  .superRefine((d, ctx) => {
    if (d.category && (!d.title || d.title.length < 3)) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "En los foros, el título es obligatorio (mín. 3 caracteres)." });
    }
    if (d.title && d.title.length < 3) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "Mínimo 3 caracteres." });
    }
    if (d.kind === "documented" && d.sources.length === 0) {
      ctx.addIssue({ code: "custom", path: ["sources"], message: "Lo documentado necesita al menos una fuente." });
    }
  });

export type PostInput = z.infer<typeof postSchema>;

export function readPostForm(fd: FormData) {
  return {
    category: String(fd.get("category") ?? ""),
    title: String(fd.get("title") ?? ""),
    body: String(fd.get("body") ?? ""),
    kind: String(fd.get("kind") ?? ""),
    is_question: fd.get("is_question") === "on",
    sources: fd.getAll("sources").map(String),
    tags: String(fd.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Escribe tu comentario.").max(5000, "Máximo 5.000 caracteres."),
});

export const reportSchema = z.object({
  target_type: z.enum(["post", "comment", "profile", "message", "circle", "project"]),
  target_id: z.uuid(),
  reason: z.enum(["spam", "harassment", "hate", "illegal", "personal_data", "mislabeled", "other"], {
    error: "Elige un motivo.",
  }),
  details: z.string().trim().max(1000, "Máximo 1.000 caracteres."),
});
