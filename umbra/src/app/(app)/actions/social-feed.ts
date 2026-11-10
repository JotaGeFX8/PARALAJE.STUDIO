"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { getActionContext, dbErrorMessage, SESSION_EXPIRED } from "@/lib/actions";

type Result = { ok: boolean; message?: string };

/** Seguir o dejar de seguir a una persona (unilateral; no es una conexión). */
export async function followAction(profileId: string, on: boolean): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  if (profileId === userId) return { ok: false, message: "No puedes seguirte a ti." };
  const { error } = on
    ? await supabase.from("member_follows").upsert({ follower_id: userId, followed_id: profileId }, { ignoreDuplicates: true })
    : await supabase.from("member_follows").delete().eq("follower_id", userId).eq("followed_id", profileId);
  if (error) return { ok: false, message: dbErrorMessage(error, "No se pudo actualizar.") };
  return { ok: true };
}

const photoSchema = z.object({
  caption: z.string().trim().max(2200, "Máximo 2.200 caracteres."),
  paths: z.array(z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/)).min(1, "Añade al menos una foto.").max(10, "Máximo 10 fotos."),
  area: z.string().max(40),
  audience: z.enum(["members", "followers", "connections"]),
  forum: z.string().max(40),
  tags: z.array(z.string().trim().min(2).max(32)).max(5, "Máximo 5 etiquetas."),
  draft: z.boolean(),
  alt: z.string().trim().max(300),
});

/** Publica (o guarda como borrador) una publicación de fotos ya subidas por el navegador a la carpeta propia. */
export async function createPhotoPostAction(input: z.input<typeof photoSchema>): Promise<Result & { id?: string }> {
  const parsed = photoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const d = parsed.data;
  if (d.paths.some((p) => !p.startsWith(`${userId}/`))) return { ok: false, message: "Fotos no válidas." };
  const toForum = d.forum && d.forum !== "perfil";
  const { data: row, error } = await supabase
    .from("posts")
    .insert({
      author_id: userId,
      body: d.caption,
      title: null,
      kind: "opinion",
      post_type: "photo",
      image_paths: d.paths,
      forum_slug: toForum ? d.forum : null,
      area_slug: d.area || null,
      audience: toForum ? "members" : d.audience,
      is_draft: d.draft,
      image_alt: d.alt,
    })
    .select("id")
    .single();
  if (error || !row) {
    await supabase.storage.from("post-images").remove(d.paths);
    return { ok: false, message: dbErrorMessage(error, "No se pudo publicar.") };
  }
  if (d.tags.length) {
    const { error: tagErr } = await supabase.rpc("set_post_tags", { p_post: row.id, p_tags: d.tags });
    if (tagErr) return { ok: true, id: row.id, message: dbErrorMessage(tagErr) };
  }
  return { ok: true, id: row.id };
}

/** Publica un borrador propio. */
export async function publishDraftAction(postId: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error, count } = await supabase.from("posts").update({ is_draft: false }, { count: "exact" }).eq("id", postId).eq("author_id", userId);
  if (error || !count) return { ok: false, message: dbErrorMessage(error, "No se pudo publicar.") };
  refresh();
  return { ok: true };
}

export async function goToPost(id: string) {
  redirect(`/p/${id}`);
}
