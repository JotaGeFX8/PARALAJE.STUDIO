"use server";

import { refresh } from "next/cache";
import { getActionContext, dbErrorMessage, SESSION_EXPIRED } from "@/lib/actions";
import type { FormState } from "@/lib/form-state";
import type { Enums } from "@/lib/supabase/types";

type Result = { ok: boolean; message?: string };

async function call(fn: (s: Awaited<ReturnType<typeof getActionContext>>["supabase"]) => PromiseLike<{ error: { code: string; message: string } | null }>): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await fn(supabase);
  if (error) return { ok: false, message: dbErrorMessage(error) };
  refresh();
  return { ok: true };
}

const note = (n: unknown) => String(n ?? "").trim().slice(0, 1000);

export async function setRoleAction(userId: string, role: Enums<"user_role">) {
  return call((s) => s.rpc("admin_set_role", { p_user: userId, p_role: role }));
}

export async function setStatusAction(userId: string, status: Enums<"account_status">, reason: string) {
  return call((s) => s.rpc("admin_set_status", { p_user: userId, p_status: status, p_reason: note(reason) }));
}

export async function modDeletePostAction(postId: string, reason: string) {
  return call((s) => s.rpc("mod_delete_post", { p_post: postId, p_note: note(reason) }));
}

export async function modDeleteCommentAction(commentId: string, reason: string) {
  return call((s) => s.rpc("mod_delete_comment", { p_comment: commentId, p_note: note(reason) }));
}

export async function modDeleteMessageAction(messageId: string, reason: string) {
  return call((s) => s.rpc("mod_delete_message", { p_message: messageId, p_note: note(reason) }));
}

export async function modDeleteCircleAction(circleId: string, reason: string) {
  return call((s) => s.rpc("mod_delete_circle", { p_circle: circleId, p_note: note(reason) }));
}

export async function modDeleteProjectAction(projectId: string, reason: string) {
  return call((s) => s.rpc("mod_delete_project", { p_project: projectId, p_note: note(reason) }));
}

export async function setPostFlagsAction(postId: string, locked: boolean, pinned: boolean) {
  return call((s) => s.rpc("mod_set_post_flags", { p_post: postId, p_locked: locked, p_pinned: pinned }));
}

export async function reclassifyPostAction(postId: string, kind: Enums<"post_kind">, reason: string) {
  return call((s) => s.rpc("mod_reclassify_post", { p_post: postId, p_kind: kind, p_note: note(reason) }));
}

export async function resolveReportAction(reportId: string, status: "resolved" | "dismissed", reason: string) {
  return call((s) => s.rpc("mod_resolve_report", { p_report: reportId, p_status: status, p_note: note(reason) }));
}

export async function saveCategoryAction(_: FormState, fd: FormData): Promise<FormState> {
  const slug = String(fd.get("slug") ?? "").trim();
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) return { errors: { name: "Nombre de 2 a 80 caracteres." } };
  if (!slug) return { errors: { slug: "Indica un identificador." } };
  const r = await call((s) =>
    s.rpc("admin_save_category", {
      p_slug: slug,
      p_name: name,
      p_description: String(fd.get("description") ?? "").slice(0, 400),
      p_position: Number(fd.get("position") ?? 99) || 99,
      p_archived: fd.get("archived") === "on",
    }),
  );
  return r.ok ? { ok: true, message: "Territorio guardado." } : { message: r.message };
}

export async function saveSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await call((s) =>
    s.rpc("admin_update_settings", {
      p_registration_open: fd.get("registration_open") === "on",
      p_welcome: String(fd.get("welcome_message") ?? "").slice(0, 600),
    }),
  );
  return r.ok ? { ok: true, message: "Configuración guardada." } : { message: r.message };
}

// ------------------------------------------------------------ Catálogo de temas

const topicId = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 0;
};

export async function reviewTopicAction(topic: number, approve: boolean, area: string) {
  return call((s) => s.rpc("admin_review_topic", { p_topic: topicId(topic), p_approve: approve, p_area: String(area ?? "").slice(0, 40) || undefined }));
}

export async function mergeTopicAction(from: number, into: number) {
  return call((s) => s.rpc("admin_merge_topics", { p_from: topicId(from), p_into: topicId(into) }));
}

export async function addSynonymAction(topic: number, term: string) {
  const t = String(term ?? "").trim().slice(0, 60);
  if (t.length < 2) return { ok: false, message: "El sinónimo necesita 2 caracteres o más." };
  return call((s) => s.rpc("admin_add_synonym", { p_topic: topicId(topic), p_term: t }));
}
