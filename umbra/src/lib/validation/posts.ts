import { z } from "zod";

export const KIND_VALUES = ["documented", "hypothesis", "interpretation", "opinion", "open_question"] as const;
export const TYPE_VALUES = ["debate", "question", "research", "discovery", "experience", "resource", "poll", "idea"] as const;

/** Archivos adjuntos admitidos (el bucket aplica la misma lista). */
export const ATTACHMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/csv": "csv",
  "application/epub+zip": "epub",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/vnd.oasis.opendocument.spreadsheet": "ods",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};
export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const sourceList = z
  .array(z.string().trim().max(500, "Cada fuente admite 500 caracteres."))
  .max(12, "Máximo 12 fuentes.")
  .transform((a) => a.filter(Boolean));

const tagList = z
  .array(z.string().trim().min(2, "Etiquetas de 2 a 32 caracteres.").max(32, "Etiquetas de 2 a 32 caracteres."))
  .max(5, "Máximo 5 etiquetas.");

const attachment = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/),
  name: z.string().trim().min(1).max(160),
  mime: z.string().refine((m) => m in ATTACHMENT_TYPES, "Tipo de archivo no admitido."),
  size: z.number().int().min(1).max(MAX_ATTACHMENT_BYTES, "Cada archivo admite 10 MB."),
});

export const postSchema = z
  .object({
    circle: z.string().optional().transform((v) => v || null),
    forum: z.string().trim().max(40).optional().transform((v) => v || null),
    category: z.string().trim().max(40).optional().transform((v) => v || null),
    title: z.string().trim().max(160, "Máximo 160 caracteres.").optional().transform((v) => v || null),
    body: z.string().trim().min(1, "Escribe algo.").max(20000, "Máximo 20.000 caracteres."),
    type: z.enum(TYPE_VALUES, { error: "Elige el tipo de publicación." }),
    kind: z.enum(KIND_VALUES, { error: "Elige cómo clasificas tu aportación." }),
    sources: sourceList,
    tags: tagList,
    poll_options: z.array(z.string().trim().max(120, "Cada opción admite 120 caracteres.")).max(10, "Máximo 10 opciones."),
    poll_multiple: z.boolean(),
    poll_days: z.enum(["", "1", "3", "7", "30"]),
    attachments: z.array(attachment).max(MAX_ATTACHMENTS, `Máximo ${MAX_ATTACHMENTS} archivos.`),
  })
  .superRefine((d, ctx) => {
    const needsTitle = !d.circle && d.forum !== "agora" && (d.forum || d.category);
    if (needsTitle && (!d.title || d.title.length < 3)) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "En los foros, el título es obligatorio (mín. 3 caracteres)." });
    } else if (d.title && d.title.length < 3) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "Mínimo 3 caracteres." });
    }
    if (d.kind === "documented" && d.sources.length === 0) {
      ctx.addIssue({ code: "custom", path: ["sources"], message: "Lo documentado necesita al menos una fuente." });
    }
  });

export type PostInput = z.infer<typeof postSchema>;

function parseAttachments(raw: string): unknown {
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

export function readPostForm(fd: FormData) {
  return {
    circle: String(fd.get("circle") ?? ""),
    forum: String(fd.get("forum") ?? ""),
    category: String(fd.get("category") ?? ""),
    title: String(fd.get("title") ?? ""),
    body: String(fd.get("body") ?? ""),
    type: String(fd.get("type") ?? "debate"),
    kind: String(fd.get("kind") ?? ""),
    sources: fd.getAll("sources").map(String),
    tags: String(fd.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    poll_options: fd
      .getAll("poll_options")
      .map(String)
      .filter((o) => o.trim()),
    poll_multiple: fd.get("poll_multiple") === "on",
    poll_days: String(fd.get("poll_days") ?? ""),
    attachments: parseAttachments(String(fd.get("attachments") ?? "")),
  };
}

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Escribe tu comentario.").max(5000, "Máximo 5.000 caracteres."),
});

export const reportSchema = z.object({
  target_type: z.enum(["post", "comment", "profile", "message", "circle", "project", "book", "book_recommendation"]),
  target_id: z.uuid(),
  reason: z.enum(["spam", "harassment", "hate", "illegal", "personal_data", "mislabeled", "other"], {
    error: "Elige un motivo.",
  }),
  details: z.string().trim().max(1000, "Máximo 1.000 caracteres."),
});
