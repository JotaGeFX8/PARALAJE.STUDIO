"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getActionContext, dbErrorMessage, SESSION_EXPIRED } from "@/lib/actions";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { commentSchema, postSchema, readPostForm, reportSchema } from "@/lib/validation/posts";
import type { ReactionType } from "@/lib/supabase/types";

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = /^image\/(webp|jpeg|png)$/;

type Supa = Awaited<ReturnType<typeof getActionContext>>["supabase"];

/** Sube las imágenes nuevas a la carpeta del usuario. Devuelve sus rutas. */
async function uploadImages(supabase: Supa, userId: string, files: File[]) {
  const paths: string[] = [];
  for (const file of files) {
    if (!IMAGE_TYPES.test(file.type) || file.size > MAX_IMAGE_BYTES) {
      throw new Error("Imágenes JPG, PNG o WebP de hasta 5 MB.");
    }
    const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
    const path = `${userId}/${randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("post-images")
      .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (error) throw new Error("No se pudo subir una imagen.");
    paths.push(path);
  }
  return paths;
}

function imageFiles(fd: FormData) {
  return fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
}

// ---------------------------------------------------------------- Publicaciones

type AttachmentInput = { path: string; name: string; mime: string; size: number };

/** Registra los adjuntos (ya subidos por el navegador a la carpeta propia). Si falla, borra los archivos. */
async function attachFiles(supabase: Supa, userId: string, postId: string, files: AttachmentInput[]) {
  if (!files.length) return null;
  const own = files.filter((f) => f.path.startsWith(`${userId}/`));
  const { error } = await supabase
    .from("post_attachments")
    .insert(own.map((f) => ({ post_id: postId, author_id: userId, path: f.path, name: f.name, mime: f.mime, size: f.size })));
  if (error) {
    await supabase.storage.from("post-files").remove(own.map((f) => f.path));
    return dbErrorMessage(error, "No se pudieron adjuntar los archivos.");
  }
  return null;
}

function pollCloses(days: string) {
  return days ? new Date(Date.now() + Number(days) * 86_400_000).toISOString() : undefined;
}

export async function createPostAction(_: FormState, fd: FormData): Promise<FormState> {
  const raw = readPostForm(fd);
  const parsed = postSchema.safeParse(raw);
  const values = { title: raw.title, body: raw.body };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Revisa los campos marcados.", values };

  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED, values };

  const d = parsed.data;
  if (d.type === "poll" && d.poll_options.length < 2) {
    return { errors: { poll_options: "Una encuesta necesita al menos dos opciones." }, values };
  }
  const files = imageFiles(fd);
  if (files.length > MAX_IMAGES) return { errors: { images: `Máximo ${MAX_IMAGES} imágenes.` }, values };

  let paths: string[] = [];
  try {
    paths = await uploadImages(supabase, userId, files);
  } catch (e) {
    return { errors: { images: (e as Error).message }, values };
  }

  const { data: id, error } = await supabase.rpc("create_post", {
    p_title: d.title ?? "",
    p_body: d.body,
    p_kind: d.kind,
    p_forum: d.circle ? undefined : (d.forum ?? undefined),
    p_category: d.circle ? undefined : (d.category ?? undefined),
    p_type: d.type,
    p_sources: d.sources,
    p_tags: d.tags,
    p_image_paths: paths,
    p_circle: d.circle ?? undefined,
    p_poll_options: d.type === "poll" ? d.poll_options : undefined,
    p_poll_multiple: d.poll_multiple,
    p_poll_closes: d.type === "poll" ? pollCloses(d.poll_days) : undefined,
  });

  if (error || !id) {
    if (paths.length) await supabase.storage.from("post-images").remove(paths);
    if (d.attachments.length) await supabase.storage.from("post-files").remove(d.attachments.map((a) => a.path));
    return { message: dbErrorMessage(error, "No se ha podido publicar."), values };
  }
  const attachError = await attachFiles(supabase, userId, id, d.attachments);
  if (fd.get("return_to") === "agora") {
    // Publicación rápida: se queda en el Ágora y el listado se actualiza.
    refresh();
    return { ok: true, message: "Publicado en el Ágora." };
  }
  if (attachError) redirect(`/p/${id}?aviso=adjuntos`);
  redirect(`/p/${id}`);
}

export async function updatePostAction(_: FormState, fd: FormData): Promise<FormState> {
  const postId = String(fd.get("post_id") ?? "");
  const raw = readPostForm(fd);
  const parsed = postSchema.safeParse(raw);
  const values = { title: raw.title, body: raw.body };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Revisa los campos marcados.", values };

  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED, values };

  const { data: current } = await supabase
    .from("posts")
    .select("image_paths, author_id, post_attachments(id, path)")
    .eq("id", postId)
    .maybeSingle();
  if (!current || current.author_id !== userId) return { message: "No puedes editar esta publicación." };

  const d = parsed.data;
  const keep = fd.getAll("keep_images").map(String).filter((p) => current.image_paths.includes(p));
  const files = imageFiles(fd);
  if (keep.length + files.length > MAX_IMAGES) return { errors: { images: `Máximo ${MAX_IMAGES} imágenes.` }, values };
  const keepFiles = fd.getAll("keep_attachments").map(String);
  const dropFiles = current.post_attachments.filter((a) => !keepFiles.includes(a.id));
  if (current.post_attachments.length - dropFiles.length + d.attachments.length > 3) {
    return { errors: { attachments: "Máximo 3 archivos por publicación." }, values };
  }

  let added: string[] = [];
  try {
    added = await uploadImages(supabase, userId, files);
  } catch (e) {
    return { errors: { images: (e as Error).message }, values };
  }

  const { error } = await supabase.rpc("update_post", {
    p_id: postId,
    p_title: d.title ?? "",
    p_body: d.body,
    p_kind: d.kind,
    p_type: d.type,
    p_category: d.category ?? "",
    p_sources: d.sources,
    p_tags: d.tags,
    p_image_paths: [...keep, ...added],
  });
  if (error) {
    if (added.length) await supabase.storage.from("post-images").remove(added);
    if (d.attachments.length) await supabase.storage.from("post-files").remove(d.attachments.map((a) => a.path));
    return { message: dbErrorMessage(error, "No se han podido guardar los cambios."), values };
  }
  const removed = current.image_paths.filter((p) => !keep.includes(p));
  if (removed.length) await supabase.storage.from("post-images").remove(removed);
  if (dropFiles.length) {
    await supabase.from("post_attachments").delete().in("id", dropFiles.map((a) => a.id));
    await supabase.storage.from("post-files").remove(dropFiles.map((a) => a.path));
  }
  const attachError = await attachFiles(supabase, userId, postId, d.attachments);
  redirect(attachError ? `/p/${postId}?aviso=adjuntos` : `/p/${postId}`);
}

/** Borra un archivo subido que al final no se adjuntó (el navegador avisa al quitarlo del editor). */
export async function discardUploadAction(path: string) {
  const { supabase, userId } = await getActionContext();
  if (!userId || !path.startsWith(`${userId}/`)) return { ok: false };
  const { data: used } = await supabase.from("post_attachments").select("id").eq("path", path).maybeSingle();
  if (used) return { ok: false };
  await supabase.storage.from("post-files").remove([path]);
  return { ok: true };
}

// ---------------------------------------------------------------- Encuestas

export async function votePollAction(postId: string, optionIds: number[]) {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const ids = optionIds.filter((n) => Number.isInteger(n) && n > 0).slice(0, 10);
  const { error } = await supabase.rpc("vote_poll", { p_post: postId, p_options: ids });
  if (error) return { ok: false, message: dbErrorMessage(error, "No se pudo registrar el voto.") };
  refresh();
  return { ok: true };
}

export async function closePollAction(postId: string) {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase.rpc("close_poll", { p_post: postId });
  if (error) return { ok: false, message: dbErrorMessage(error, "No se pudo cerrar la encuesta.") };
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- Etiquetas

export async function suggestTagsAction(q: string) {
  const query = String(q ?? "").trim().slice(0, 32);
  if (!query) return [];
  const { supabase, userId } = await getActionContext();
  if (!userId) return [];
  const { data } = await supabase.rpc("suggest_tags", { p_query: query, p_limit: 8 });
  return (data ?? []).map((t) => ({ slug: t.slug, name: t.name, uses: Number(t.uses), fromCatalog: t.source === "topic" }));
}

export async function deletePostAction(postId: string): Promise<{ ok: boolean; message?: string }> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { data: post } = await supabase
    .from("posts")
    .select("author_id, image_paths, forum_slug, category_slug, circle_id, post_attachments(path)")
    .eq("id", postId)
    .maybeSingle();
  const { error } = await supabase.rpc("delete_post", { p_id: postId });
  if (error) return { ok: false, message: dbErrorMessage(error) };
  if (post && post.author_id === userId && post.image_paths.length) {
    await supabase.storage.from("post-images").remove(post.image_paths);
  }
  if (post && post.author_id === userId && post.post_attachments.length) {
    await supabase.storage.from("post-files").remove(post.post_attachments.map((a) => a.path));
  }
  redirect(
    post?.circle_id
      ? `/circulos/${post.circle_id}`
      : `/comunidad/${post?.forum_slug ?? "agora"}${post?.category_slug ? `/${post.category_slug}` : ""}`,
  );
}

// ---------------------------------------------------------------- Guardar y seguir

export async function setSavedAction(postId: string, on: boolean) {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = on
    ? await supabase.from("saved_posts").upsert({ user_id: userId, post_id: postId }, { ignoreDuplicates: true })
    : await supabase.from("saved_posts").delete().eq("user_id", userId).eq("post_id", postId);
  return error ? { ok: false, message: dbErrorMessage(error) } : { ok: true };
}

export async function setFollowAction(postId: string, on: boolean) {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = on
    ? await supabase.from("post_follows").upsert({ user_id: userId, post_id: postId }, { ignoreDuplicates: true })
    : await supabase.from("post_follows").delete().eq("user_id", userId).eq("post_id", postId);
  return error ? { ok: false, message: dbErrorMessage(error) } : { ok: true };
}

// ---------------------------------------------------------------- Reacciones

const REACTION_TYPES: ReactionType[] = ["valuable", "curious", "agree", "needs_sources"];

export async function setReactionAction(target: "post" | "comment", id: string, type: ReactionType, on: boolean) {
  if (!REACTION_TYPES.includes(type)) return { ok: false };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  let error;
  if (target === "post") {
    ({ error } = on
      ? await supabase.from("post_reactions").upsert({ post_id: id, user_id: userId, type }, { ignoreDuplicates: true })
      : await supabase.from("post_reactions").delete().match({ post_id: id, user_id: userId, type }));
  } else {
    ({ error } = on
      ? await supabase.from("comment_reactions").upsert({ comment_id: id, user_id: userId, type }, { ignoreDuplicates: true })
      : await supabase.from("comment_reactions").delete().match({ comment_id: id, user_id: userId, type }));
  }
  return error ? { ok: false, message: dbErrorMessage(error) } : { ok: true };
}

// ---------------------------------------------------------------- Comentarios

export async function createCommentAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = commentSchema.safeParse({ body: fd.get("body") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { body: String(fd.get("body") ?? "") } };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED };
  const postId = String(fd.get("post_id") ?? "");
  const parentId = String(fd.get("parent_id") ?? "") || null;
  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, parent_id: parentId, author_id: userId, body: parsed.data.body });
  if (error) return { message: dbErrorMessage(error, "No se ha podido comentar."), values: { body: parsed.data.body } };
  refresh();
  return { ok: true };
}

export async function editCommentAction(commentId: string, body: string) {
  const parsed = commentSchema.safeParse({ body });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error, count } = await supabase
    .from("comments")
    .update({ body: parsed.data.body }, { count: "exact" })
    .eq("id", commentId)
    .eq("author_id", userId);
  if (error || !count) return { ok: false, message: dbErrorMessage(error, "No se ha podido editar.") };
  refresh();
  return { ok: true };
}

export async function deleteCommentAction(commentId: string) {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase.rpc("delete_comment", { p_id: commentId });
  if (error) return { ok: false, message: dbErrorMessage(error) };
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- Denuncias

export async function createReportAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = reportSchema.safeParse({
    target_type: fd.get("target_type"),
    target_id: fd.get("target_id"),
    reason: fd.get("reason"),
    details: String(fd.get("details") ?? ""),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED };
  const { error } = await supabase.from("reports").insert({ ...parsed.data, reporter_id: userId });
  if (error?.code === "23505") return { ok: true, message: "Ya habías denunciado esto. El equipo lo revisará." };
  if (error) return { message: dbErrorMessage(error, "No se ha podido enviar la denuncia.") };
  return { ok: true, message: "Gracias. Una persona del equipo de moderación lo revisará." };
}
