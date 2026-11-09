"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { getActionContext, dbErrorMessage, SESSION_EXPIRED } from "@/lib/actions";
import type { FormState } from "@/lib/form-state";

type Result = { ok: boolean; message?: string };
const uuid = z.uuid();

async function pairRow(supabase: Awaited<ReturnType<typeof getActionContext>>["supabase"], me: string, other: string) {
  const [low, high] = me < other ? [me, other] : [other, me];
  const { data } = await supabase
    .from("connections")
    .select("id, status, requester_id, addressee_id")
    .eq("pair_low", low)
    .eq("pair_high", high)
    .maybeSingle();
  return data;
}

// ---------------------------------------------------------------- Conexiones

export async function sendConnectionAction(otherId: string, message: string): Promise<Result> {
  if (!uuid.safeParse(otherId).success) return { ok: false };
  const note = message.trim().slice(0, 300);
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  if (otherId === userId) return { ok: false };
  const { error } = await supabase
    .from("connections")
    .insert({ requester_id: userId, addressee_id: otherId, message: note });
  if (error?.code === "23505") return { ok: true, message: "Ya existe una solicitud entre vosotros." };
  if (error) return { ok: false, message: dbErrorMessage(error, "No se pudo enviar la solicitud.") };
  return { ok: true };
}

export async function respondConnectionAction(otherId: string, accept: boolean): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const row = await pairRow(supabase, userId, otherId);
  if (!row || row.addressee_id !== userId || row.status !== "pending") return { ok: false, message: "La solicitud ya no está disponible." };
  const { error } = await supabase
    .from("connections")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", row.id);
  if (error) return { ok: false, message: dbErrorMessage(error) };
  return { ok: true };
}

/** Cancela una solicitud enviada o deshace una conexión. */
export async function removeConnectionAction(otherId: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const row = await pairRow(supabase, userId, otherId);
  if (!row) return { ok: true };
  const { error } = await supabase.from("connections").delete().eq("id", row.id);
  if (error) return { ok: false, message: dbErrorMessage(error) };
  return { ok: true };
}

export async function skipMemberAction(otherId: string): Promise<Result> {
  if (!uuid.safeParse(otherId).success) return { ok: false };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase
    .from("member_skips")
    .upsert({ user_id: userId, skipped_id: otherId, created_at: new Date().toISOString() });
  return error ? { ok: false, message: dbErrorMessage(error) } : { ok: true };
}

// ---------------------------------------------------------------- Bloqueos

export async function blockMemberAction(otherId: string): Promise<Result> {
  if (!uuid.safeParse(otherId).success) return { ok: false };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase.from("blocks").upsert({ blocker_id: userId, blocked_id: otherId }, { ignoreDuplicates: true });
  if (error) return { ok: false, message: dbErrorMessage(error) };
  refresh();
  return { ok: true };
}

export async function unblockMemberAction(otherId: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase.from("blocks").delete().eq("blocker_id", userId).eq("blocked_id", otherId);
  if (error) return { ok: false, message: dbErrorMessage(error) };
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- Mensajes

export async function startConversationAction(otherId: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { data, error } = await supabase.rpc("start_conversation", { p_other: otherId });
  if (error || !data) return { ok: false, message: dbErrorMessage(error, "No se pudo abrir la conversación.") };
  redirect(`/mensajes/${data}`);
}

export type SentMessage = { id: string; sender_id: string; body: string; created_at: string; deleted_at: string | null };

export async function sendMessageAction(conversationId: string, body: string): Promise<Result & { message_row?: SentMessage }> {
  const text = body.trim();
  if (!text) return { ok: false, message: "Escribe un mensaje." };
  if (text.length > 4000) return { ok: false, message: "Máximo 4.000 caracteres." };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: userId, body: text })
    .select("id, sender_id, body, created_at, deleted_at")
    .single();
  if (error) return { ok: false, message: dbErrorMessage(error, "No se pudo enviar el mensaje.") };
  return { ok: true, message_row: data };
}

/** Mensajes nuevos desde una fecha (sondeo o aviso en tiempo real). Marca como leído. */
export async function fetchMessagesAction(conversationId: string, after: string): Promise<SentMessage[]> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return [];
  const { data } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at, deleted_at")
    .eq("conversation_id", conversationId)
    .gt("created_at", after)
    .order("created_at", { ascending: true })
    .limit(100);
  if (data?.length) await supabase.rpc("mark_conversation_read", { p_conversation: conversationId });
  return data ?? [];
}

export async function deleteMessageAction(id: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase.rpc("delete_message", { p_id: id });
  return error ? { ok: false, message: dbErrorMessage(error) } : { ok: true };
}

// ---------------------------------------------------------------- Avisos

export async function getUnreadCountsAction() {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { messages: 0, notifications: 0, requests: 0 };
  const { data } = await supabase.rpc("my_unread_counts");
  const r = data?.[0];
  return { messages: Number(r?.messages ?? 0), notifications: Number(r?.notifications ?? 0), requests: Number(r?.requests ?? 0) };
}

export async function markAllNotificationsReadAction(): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) return { ok: false, message: dbErrorMessage(error) };
  refresh();
  return { ok: true };
}

const PREF_KEYS = ["comments", "replies", "mentions", "connections", "messages", "circles", "projects"] as const;

export async function saveNotificationPrefsAction(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED };
  const row = Object.fromEntries(PREF_KEYS.map((k) => [k, fd.get(k) === "on"])) as Record<(typeof PREF_KEYS)[number], boolean>;
  const { error } = await supabase
    .from("notification_prefs")
    .upsert({ user_id: userId, ...row, updated_at: new Date().toISOString() });
  if (error) return { message: dbErrorMessage(error, "No se pudieron guardar las preferencias.") };
  return { ok: true, message: "Preferencias guardadas." };
}
