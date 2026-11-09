"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { getActionContext, dbErrorMessage, SESSION_EXPIRED } from "@/lib/actions";
import { fieldErrors, type FormState } from "@/lib/form-state";
import type { GroupMessage } from "@/lib/data/circles";

type Result = { ok: boolean; message?: string };
type Supa = Awaited<ReturnType<typeof getActionContext>>["supabase"];

const COVER_TYPES = /^image\/(webp|jpeg|png)$/;

async function uploadCover(supabase: Supa, userId: string, fd: FormData): Promise<string | null> {
  const file = fd.get("cover");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!COVER_TYPES.test(file.type) || file.size > 5 * 1024 * 1024) throw new Error("Imagen JPG, PNG o WebP de hasta 5 MB.");
  const path = `${userId}/${randomUUID()}.webp`;
  const { error } = await supabase.storage.from("covers").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error("No se pudo subir la imagen.");
  return path;
}

// ============================================================== Círculos

const circleSchema = z.object({
  name: z.string().trim().min(3, "Mínimo 3 caracteres.").max(80, "Máximo 80 caracteres."),
  description: z.string().trim().max(2000, "Máximo 2.000 caracteres."),
  visibility: z.enum(["public", "private", "invite"], { error: "Elige la visibilidad." }),
});

export async function createCircleAction(_: FormState, fd: FormData): Promise<FormState> {
  const raw = { name: String(fd.get("name") ?? ""), description: String(fd.get("description") ?? ""), visibility: fd.get("visibility") };
  const parsed = circleSchema.safeParse(raw);
  const values = { name: raw.name, description: raw.description };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED, values };
  let cover: string | null = null;
  try {
    cover = await uploadCover(supabase, userId, fd);
  } catch (e) {
    return { errors: { cover: (e as Error).message }, values };
  }
  const { data: id, error } = await supabase.rpc("create_circle", {
    p_name: parsed.data.name,
    p_description: parsed.data.description,
    p_visibility: parsed.data.visibility,
    p_image_path: cover ?? undefined,
  });
  if (error || !id) {
    if (cover) await supabase.storage.from("covers").remove([cover]);
    return { message: dbErrorMessage(error, "No se pudo crear el círculo."), values };
  }
  redirect(`/circulos/${id}`);
}

export async function updateCircleAction(_: FormState, fd: FormData): Promise<FormState> {
  const circleId = String(fd.get("circle_id") ?? "");
  const raw = { name: String(fd.get("name") ?? ""), description: String(fd.get("description") ?? ""), visibility: fd.get("visibility") };
  const parsed = circleSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED };
  let cover: string | null = null;
  try {
    cover = await uploadCover(supabase, userId, fd);
  } catch (e) {
    return { errors: { cover: (e as Error).message } };
  }
  const { error, count } = await supabase
    .from("circles")
    .update({ ...parsed.data, ...(cover ? { image_path: cover } : {}) }, { count: "exact" })
    .eq("id", circleId);
  if (error || !count) return { message: dbErrorMessage(error, "No tienes permiso para editar este círculo.") };
  refresh();
  return { ok: true, message: "Cambios guardados." };
}

export async function deleteCircleAction(circleId: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error, count } = await supabase.from("circles").delete({ count: "exact" }).eq("id", circleId).eq("owner_id", userId);
  if (error || !count) return { ok: false, message: dbErrorMessage(error, "Solo quien creó el círculo puede borrarlo.") };
  redirect("/circulos");
}

export async function joinCircleAction(circleId: string, message = ""): Promise<Result & { state?: string }> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { data, error } = await supabase.rpc("join_circle", { p_circle: circleId, p_message: message.slice(0, 300) });
  if (error) return { ok: false, message: dbErrorMessage(error) };
  refresh();
  return { ok: true, state: data ?? undefined };
}

export async function leaveCircleAction(circleId: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error, count } = await supabase
    .from("circle_members")
    .delete({ count: "exact" })
    .eq("circle_id", circleId)
    .eq("user_id", userId);
  if (error || !count) return { ok: false, message: dbErrorMessage(error, "Quien creó el círculo no puede salir de él.") };
  refresh();
  return { ok: true };
}

export async function cancelCircleRequestAction(circleId: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  await supabase.from("circle_requests").delete().eq("circle_id", circleId).eq("user_id", userId).eq("status", "pending");
  refresh();
  return { ok: true };
}

export async function respondCircleRequestAction(requestId: string, accept: boolean): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase.rpc("respond_circle_request", { p_request: requestId, p_accept: accept });
  if (error) return { ok: false, message: dbErrorMessage(error) };
  return { ok: true };
}

export async function inviteToCircleAction(_: FormState, fd: FormData): Promise<FormState> {
  const circleId = String(fd.get("circle_id") ?? "");
  const username = String(fd.get("username") ?? "").trim();
  if (!username) return { errors: { username: "Escribe un nombre de usuario." } };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED };
  const { error } = await supabase.rpc("invite_to_circle", { p_circle: circleId, p_username: username });
  if (error) return { errors: { username: dbErrorMessage(error, "No se pudo invitar.") } };
  return { ok: true, message: `Invitación enviada a @${username.replace(/^@/, "")}.` };
}

export async function respondCircleInviteAction(inviteId: string, accept: boolean): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase.rpc("respond_circle_invite", { p_invite: inviteId, p_accept: accept });
  if (error) return { ok: false, message: dbErrorMessage(error) };
  refresh();
  return { ok: true };
}

export async function setCircleRoleAction(circleId: string, memberId: string, role: "admin" | "member"): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase.rpc("set_circle_role", { p_circle: circleId, p_user: memberId, p_role: role });
  if (error) return { ok: false, message: dbErrorMessage(error) };
  refresh();
  return { ok: true };
}

export async function removeCircleMemberAction(circleId: string, memberId: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error, count } = await supabase
    .from("circle_members")
    .delete({ count: "exact" })
    .eq("circle_id", circleId)
    .eq("user_id", memberId);
  if (error || !count) return { ok: false, message: dbErrorMessage(error, "No tienes permiso para retirar a este miembro.") };
  refresh();
  return { ok: true };
}

// ============================================================== Proyectos

const STATUS = ["idea", "planning", "active", "paused", "completed"] as const;

const projectSchema = z.object({
  title: z.string().trim().min(3, "Mínimo 3 caracteres.").max(100, "Máximo 100 caracteres."),
  summary: z.string().trim().max(280, "Máximo 280 caracteres."),
  description: z.string().trim().max(10000, "Máximo 10.000 caracteres."),
  objectives: z.array(z.string().trim().max(200, "Cada objetivo admite 200 caracteres.")).max(12, "Máximo 12 objetivos."),
  seeking: z.string().trim().max(600, "Máximo 600 caracteres."),
  status: z.enum(STATUS, { error: "Elige un estado." }),
  country: z.string().trim().max(60),
  region: z.string().trim().max(80),
  interests: z.array(z.string().regex(/^[a-z0-9-]{2,40}$/)).max(6, "Máximo 6 temáticas."),
});

function readProject(fd: FormData) {
  return {
    title: String(fd.get("title") ?? ""),
    summary: String(fd.get("summary") ?? ""),
    description: String(fd.get("description") ?? ""),
    objectives: String(fd.get("objectives") ?? "")
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean),
    seeking: String(fd.get("seeking") ?? ""),
    status: String(fd.get("status") ?? "idea"),
    country: String(fd.get("country") ?? ""),
    region: String(fd.get("region") ?? ""),
    interests: fd.getAll("interests").map(String),
  };
}

export async function saveProjectAction(_: FormState, fd: FormData): Promise<FormState> {
  const projectId = String(fd.get("project_id") ?? "") || null;
  const raw = readProject(fd);
  const values = { title: raw.title, summary: raw.summary, description: raw.description, seeking: raw.seeking };
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Revisa los campos marcados.", values };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED, values };
  let cover: string | null = null;
  try {
    cover = await uploadCover(supabase, userId, fd);
  } catch (e) {
    return { errors: { cover: (e as Error).message }, values };
  }
  const d = parsed.data;
  if (!projectId) {
    const { data: id, error } = await supabase.rpc("create_project", {
      p_title: d.title,
      p_summary: d.summary,
      p_description: d.description,
      p_objectives: d.objectives,
      p_seeking: d.seeking,
      p_status: d.status,
      p_country: d.country,
      p_region: d.region,
      p_interests: d.interests,
      p_cover_path: cover ?? undefined,
    });
    if (error || !id) {
      if (cover) await supabase.storage.from("covers").remove([cover]);
      return { message: dbErrorMessage(error, "No se pudo crear el proyecto."), values };
    }
    redirect(`/proyectos/${id}`);
  }
  const { error, count } = await supabase
    .from("projects")
    .update(
      {
        title: d.title,
        summary: d.summary,
        description: d.description,
        objectives: d.objectives,
        seeking: d.seeking,
        status: d.status,
        country: d.country || null,
        region: d.region || null,
        interests: d.interests,
        ...(cover ? { cover_path: cover } : {}),
      },
      { count: "exact" },
    )
    .eq("id", projectId);
  if (error || !count) return { message: dbErrorMessage(error, "No tienes permiso para editar este proyecto."), values };
  redirect(`/proyectos/${projectId}`);
}

export async function deleteProjectAction(projectId: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error, count } = await supabase.from("projects").delete({ count: "exact" }).eq("id", projectId).eq("owner_id", userId);
  if (error || !count) return { ok: false, message: dbErrorMessage(error, "Solo quien creó el proyecto puede borrarlo.") };
  redirect("/proyectos");
}

export async function requestProjectAction(projectId: string, message: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase
    .from("project_requests")
    .insert({ project_id: projectId, user_id: userId, message: message.trim().slice(0, 600) });
  if (error?.code === "23505") return { ok: true, message: "Ya habías solicitado colaborar." };
  if (error) return { ok: false, message: dbErrorMessage(error, "No se pudo enviar la solicitud.") };
  return { ok: true };
}

export async function respondProjectRequestAction(requestId: string, accept: boolean): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase.rpc("respond_project_request", { p_request: requestId, p_accept: accept });
  if (error) return { ok: false, message: dbErrorMessage(error) };
  return { ok: true };
}

export async function leaveProjectAction(projectId: string, memberId?: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error, count } = await supabase
    .from("project_members")
    .delete({ count: "exact" })
    .eq("project_id", projectId)
    .eq("user_id", memberId ?? userId);
  if (error || !count) return { ok: false, message: dbErrorMessage(error, "No se pudo completar.") };
  refresh();
  return { ok: true };
}

// ============================================================== Chat de grupo

const MSG_SELECT = (t: "circle" | "project") =>
  `id, sender_id, body, created_at, deleted_at${t === "project" ? ", is_update" : ""}, sender:profiles!${t}_messages_sender_id_fkey(username, display_name, avatar_url)`;

export async function sendGroupMessageAction(
  kind: "circle" | "project",
  groupId: string,
  body: string,
  isUpdate = false,
): Promise<Result & { row?: GroupMessage }> {
  const text = body.trim();
  if (!text) return { ok: false, message: "Escribe algo." };
  if (text.length > (kind === "circle" ? 2000 : 4000)) return { ok: false, message: "Mensaje demasiado largo." };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { data, error } =
    kind === "circle"
      ? await supabase
          .from("circle_messages")
          .insert({ circle_id: groupId, sender_id: userId, body: text })
          .select(MSG_SELECT("circle"))
          .single()
      : await supabase
          .from("project_messages")
          .insert({ project_id: groupId, sender_id: userId, body: text, is_update: isUpdate })
          .select(MSG_SELECT("project"))
          .single();
  if (error) return { ok: false, message: dbErrorMessage(error, "No se pudo enviar.") };
  return { ok: true, row: data as unknown as GroupMessage };
}

export async function fetchGroupMessagesAction(kind: "circle" | "project", groupId: string, after: string): Promise<GroupMessage[]> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return [];
  const { data } =
    kind === "circle"
      ? await supabase
          .from("circle_messages")
          .select(MSG_SELECT("circle"))
          .eq("circle_id", groupId)
          .gt("created_at", after)
          .order("created_at", { ascending: true })
          .limit(100)
      : await supabase
          .from("project_messages")
          .select(MSG_SELECT("project"))
          .eq("project_id", groupId)
          .gt("created_at", after)
          .order("created_at", { ascending: true })
          .limit(100);
  return (data ?? []) as unknown as GroupMessage[];
}

export async function deleteGroupMessageAction(kind: "circle" | "project", id: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } =
    kind === "circle"
      ? await supabase.rpc("delete_circle_message", { p_id: id })
      : await supabase.rpc("delete_project_message", { p_id: id });
  return error ? { ok: false, message: dbErrorMessage(error) } : { ok: true };
}
