import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums, TopicRelation, UserGoal } from "@/lib/supabase/types";
import { toCards } from "./members";

export async function discoverMembers(limit = 12) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("discover_members", { p_limit: limit });
  if (error) console.error("discover_members", error.message);
  return toCards(data);
}

export type MemberFilters = {
  q?: string;
  areas?: string[];
  topics?: number[];
  relation?: TopicRelation | null;
  goals?: UserGoal[];
  languages?: string[];
  country?: string;
  region?: string;
  availability?: Enums<"chat_availability"> | null;
  withProjects?: boolean;
  inMyCircles?: boolean;
  page?: number;
};

export async function searchMembers(f: MemberFilters, pageSize = 20) {
  const supabase = await createClient();
  const page = f.page ?? 1;
  const { data, error } = await supabase.rpc("search_members", {
    p_query: f.q || undefined,
    p_areas: f.areas?.length ? f.areas : undefined,
    p_topics: f.topics?.length ? f.topics : undefined,
    p_relation: f.relation ?? undefined,
    p_goals: f.goals?.length ? f.goals : undefined,
    p_languages: f.languages?.length ? f.languages : undefined,
    p_country: f.country || undefined,
    p_region: f.region || undefined,
    p_availability: f.availability ?? undefined,
    p_with_projects: f.withProjects ?? false,
    p_in_my_circles: f.inMyCircles ?? false,
    p_limit: pageSize + 1,
    p_offset: (page - 1) * pageSize,
  });
  if (error) console.error("search_members", error.message);
  const cards = toCards(data);
  return { items: cards.slice(0, pageSize), hasMore: cards.length > pageSize };
}

export async function memberCard(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("member_card_for", { p_id: id });
  return toCards(data)[0] ?? null;
}

/** Países con miembros que muestran su ubicación (para el filtro). */
export async function memberCountries() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("member_countries");
  return (data ?? []).map((r) => r.country);
}

// Solo columnas públicas del perfil: la ubicación se rige por la privacidad de cada persona.
const PERSON = "id, username, display_name, avatar_url, availability";

/** Conexiones aceptadas y solicitudes (recibidas y enviadas). */
export async function myNetwork(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select(
      `id, status, message, created_at, responded_at, requester_id, addressee_id,
       requester:profiles!connections_requester_id_fkey(${PERSON}),
       addressee:profiles!connections_addressee_id_fkey(${PERSON})`,
    )
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = data ?? [];
  const other = (r: (typeof rows)[number]) => (r.requester_id === userId ? r.addressee : r.requester);
  return {
    connected: rows.filter((r) => r.status === "accepted").map((r) => ({ id: r.id, since: r.responded_at ?? r.created_at, person: other(r) })),
    received: rows
      .filter((r) => r.status === "pending" && r.addressee_id === userId)
      .map((r) => ({ id: r.id, message: r.message, at: r.created_at, person: r.requester })),
    sent: rows
      .filter((r) => r.requester_id === userId && r.status !== "accepted")
      .map((r) => ({ id: r.id, message: r.message, at: r.created_at, person: r.addressee })),
  };
}

export async function blockedMembers(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blocks")
    .select("blocked_id, created_at, blocked:profiles!blocks_blocked_id_fkey(username, display_name, avatar_url)")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function isBlockedByMe(userId: string, otherId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", userId).eq("blocked_id", otherId).maybeSingle();
  return Boolean(data);
}

// ---------------------------------------------------------------- Mensajes

export async function myConversations() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_conversations");
  if (error) console.error("my_conversations", error.message);
  return data ?? [];
}

export type ChatMessage = { id: string; sender_id: string; body: string; created_at: string; deleted_at: string | null };

export async function getConversation(id: string, userId: string) {
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("conversations")
    .select("id, user_low, user_high")
    .eq("id", id)
    .maybeSingle();
  if (!c) return null;
  const otherId = c.user_low === userId ? c.user_high : c.user_low;
  const [{ data: other }, { data: canWrite }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url").eq("id", otherId).maybeSingle(),
    supabase.rpc("can_message", { p_conversation: id }),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at, deleted_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  await supabase.rpc("mark_conversation_read", { p_conversation: id });
  return {
    id,
    other: other ?? { id: otherId, username: null, display_name: "Miembro", avatar_url: null },
    canWrite: Boolean(canWrite),
    messages: (messages ?? []).reverse() as ChatMessage[],
  };
}

// ---------------------------------------------------------------- Avisos

export async function unreadCounts() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_unread_counts");
  const r = data?.[0];
  return { messages: Number(r?.messages ?? 0), notifications: Number(r?.notifications ?? 0), requests: Number(r?.requests ?? 0) };
}

export async function myNotifications(limit = 60) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select(
      "id, type, body, read_at, created_at, post_id, comment_id, conversation_id, circle_id, project_id, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function notificationPrefs(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("notification_prefs").select("*").eq("user_id", userId).maybeSingle();
  return (
    data ?? {
      user_id: userId,
      comments: true,
      replies: true,
      mentions: true,
      connections: true,
      messages: true,
      circles: true,
      projects: true,
      follows: true,
      reactions: true,
      updated_at: "",
    }
  );
}
