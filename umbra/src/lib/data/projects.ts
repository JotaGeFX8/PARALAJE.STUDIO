import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { GroupMessage } from "./circles";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROJECT_COLUMNS =
  "id, slug, title, summary, description, objectives, seeking, status, country, region, interests, cover_path, owner_id, participant_count, last_activity_at, created_at, updated_at";

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  objectives: string[];
  seeking: string;
  status: Enums<"project_status">;
  country: string | null;
  region: string | null;
  interests: string[];
  cover_path: string | null;
  owner_id: string;
  participant_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
};

export async function getProject(ref: string) {
  const supabase = await createClient();
  const q = supabase.from("projects").select(PROJECT_COLUMNS);
  const { data } = await (UUID.test(ref) ? q.eq("id", ref) : q.eq("slug", ref.toLowerCase())).maybeSingle();
  return data as ProjectRow | null;
}

export type ProjectFilters = { status?: Enums<"project_status"> | null; interest?: string | null; q?: string; mine?: string | null };

export async function listProjects(f: ProjectFilters = {}, sort: "recent" | "active" | "people" = "active", limit = 30) {
  const supabase = await createClient();
  let query = supabase.from("projects").select(PROJECT_COLUMNS);
  if (f.status) query = query.eq("status", f.status);
  if (f.interest) query = query.contains("interests", [f.interest]);
  const term = (f.q ?? "").replace(/[%_,()*]/g, " ").trim();
  if (term) query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%,region.ilike.%${term}%,description.ilike.%${term}%`);
  if (f.mine) {
    const { data: ids } = await supabase.from("project_members").select("project_id").eq("user_id", f.mine);
    query = query.in("id", (ids ?? []).map((r) => r.project_id));
  }
  query =
    sort === "recent"
      ? query.order("created_at", { ascending: false })
      : sort === "people"
        ? query.order("participant_count", { ascending: false }).order("last_activity_at", { ascending: false })
        : query.order("last_activity_at", { ascending: false });
  const { data } = await query.limit(limit);
  return (data ?? []) as ProjectRow[];
}

export async function projectParticipants(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_members")
    .select("role, joined_at, user_id, person:profiles!project_members_user_id_fkey(username, display_name, avatar_url)")
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true });
  return (data ?? []).sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
}

export async function projectStatusFor(projectId: string, userId: string) {
  const supabase = await createClient();
  const [{ data: member }, { data: request }] = await Promise.all([
    supabase.from("project_members").select("role").eq("project_id", projectId).eq("user_id", userId).maybeSingle(),
    supabase.from("project_requests").select("status").eq("project_id", projectId).eq("user_id", userId).maybeSingle(),
  ]);
  return { role: (member?.role ?? null) as Enums<"project_role"> | null, request: request?.status ?? null };
}

export async function projectRequests(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_requests")
    .select("id, message, created_at, person:profiles!project_requests_user_id_fkey(username, display_name, avatar_url)")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function projectMessages(projectId: string, limit = 150) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_messages")
    .select("id, sender_id, body, created_at, deleted_at, is_update, sender:profiles!project_messages_sender_id_fkey(username, display_name, avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as GroupMessage[]).reverse();
}
