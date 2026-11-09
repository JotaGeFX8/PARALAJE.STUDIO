import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CIRCLE_COLUMNS = "id, slug, name, description, visibility, image_path, owner_id, member_count, last_activity_at, created_at";

export type CircleRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: Enums<"circle_visibility">;
  image_path: string | null;
  owner_id: string;
  member_count: number;
  last_activity_at: string;
  created_at: string;
};

/** Busca por id o por slug. */
export async function getCircle(ref: string) {
  const supabase = await createClient();
  const q = supabase.from("circles").select(CIRCLE_COLUMNS);
  const { data } = await (UUID.test(ref) ? q.eq("id", ref) : q.eq("slug", ref.toLowerCase())).maybeSingle();
  return data as CircleRow | null;
}

/** Estado del usuario respecto a un círculo. */
export async function circleStatus(circleId: string, userId: string) {
  const supabase = await createClient();
  const [{ data: member }, { data: request }, { data: invite }] = await Promise.all([
    supabase.from("circle_members").select("role").eq("circle_id", circleId).eq("user_id", userId).maybeSingle(),
    supabase.from("circle_requests").select("id, status").eq("circle_id", circleId).eq("user_id", userId).maybeSingle(),
    supabase.from("circle_invites").select("id, status").eq("circle_id", circleId).eq("invitee_id", userId).maybeSingle(),
  ]);
  return {
    role: (member?.role ?? null) as Enums<"circle_role"> | null,
    requestPending: request?.status === "pending",
    inviteId: invite?.status === "pending" ? invite.id : null,
  };
}

export async function myCircles(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("circle_members")
    .select(`role, circle:circles(${CIRCLE_COLUMNS})`)
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  return (data ?? []).flatMap((r) => (r.circle ? [{ ...(r.circle as CircleRow), role: r.role }] : []));
}

export async function discoverCircles(userId: string, q = "") {
  const supabase = await createClient();
  let query = supabase.from("circles").select(CIRCLE_COLUMNS).neq("visibility", "invite");
  const term = q.replace(/[%_,()*]/g, " ").trim();
  if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  const { data } = await query.order("last_activity_at", { ascending: false }).limit(60);
  const mine = new Set((await myCircles(userId)).map((c) => c.id));
  return ((data ?? []) as CircleRow[]).map((c) => ({ ...c, joined: mine.has(c.id) }));
}

export async function myCircleInvites(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("circle_invites")
    .select(`id, created_at, circle:circles(${CIRCLE_COLUMNS}), inviter:profiles!circle_invites_inviter_id_fkey(username, display_name, avatar_url)`)
    .eq("invitee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function circleMembers(circleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("circle_members")
    .select("role, joined_at, user_id, person:profiles!circle_members_user_id_fkey(username, display_name, avatar_url)")
    .eq("circle_id", circleId)
    .order("joined_at", { ascending: true })
    .limit(500);
  const order = { owner: 0, admin: 1, member: 2 } as const;
  return (data ?? []).sort((a, b) => order[a.role] - order[b.role]);
}

export async function circleRequests(circleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("circle_requests")
    .select("id, message, created_at, person:profiles!circle_requests_user_id_fkey(username, display_name, avatar_url)")
    .eq("circle_id", circleId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export type GroupMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
  is_update?: boolean;
  sender: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
};

export async function circleMessages(circleId: string, limit = 150) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("circle_messages")
    .select("id, sender_id, body, created_at, deleted_at, sender:profiles!circle_messages_sender_id_fkey(username, display_name, avatar_url)")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as GroupMessage[]).reverse();
}

export async function activeCircles(limit = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("circles")
    .select(CIRCLE_COLUMNS)
    .neq("visibility", "invite")
    .order("last_activity_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as CircleRow[];
}
