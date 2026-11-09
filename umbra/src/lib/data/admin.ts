import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

export async function adminStats() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_stats");
  const r = data?.[0];
  return {
    members: Number(r?.members ?? 0),
    membersWeek: Number(r?.members_week ?? 0),
    posts: Number(r?.posts ?? 0),
    postsWeek: Number(r?.posts_week ?? 0),
    comments: Number(r?.comments ?? 0),
    openReports: Number(r?.open_reports ?? 0),
    circles: Number(r?.circles ?? 0),
    projects: Number(r?.projects ?? 0),
    suspended: Number(r?.suspended ?? 0),
  };
}

export async function listReports(status: Enums<"report_status"> = "open", limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select(
      "id, target_type, target_id, reason, details, status, resolution_note, created_at, resolved_at, reporter:profiles!reports_reporter_id_fkey(username, display_name), resolver:profiles!reports_resolved_by_fkey(username, display_name)",
    )
    .eq("status", status)
    .order("created_at", { ascending: status === "open" })
    .limit(limit);
  const rows = data ?? [];
  const previews = await Promise.all(
    rows.map(async (r) => {
      const { data: p } = await supabase.rpc("report_target_preview", { p_report: r.id });
      return p?.[0] ?? null;
    }),
  );
  return rows.map((r, i) => ({ ...r, preview: previews[i] }));
}

export async function listMembers(q: string, role: Enums<"user_role"> | null, status: Enums<"account_status"> | null) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_members", {
    p_query: q || undefined,
    p_role: role ?? undefined,
    p_status: status ?? undefined,
    p_limit: 100,
  });
  if (error) console.error("admin_list_members", error.message);
  return data ?? [];
}

export async function recentPosts(limit = 40) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, body, kind, is_locked, is_pinned, created_at, category_slug, circle_id, comment_count, author:profiles!posts_author_id_fkey(username, display_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function recentComments(limit = 30) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("id, body, created_at, post_id, author:profiles!comments_author_id_fkey(username, display_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function allForums() {
  const supabase = await createClient();
  const [{ data: forums }, { data: cats }] = await Promise.all([
    supabase.from("forums").select("slug, name, description, rules, position, is_archived").order("position"),
    supabase.from("categories").select("slug, name, description, position, is_archived, forum_slug").order("position"),
  ]);
  return (forums ?? []).map((f) => ({ ...f, categories: (cats ?? []).filter((c) => c.forum_slug === f.slug) }));
}

export async function adminTags(q: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_tag_list", { p_query: q || undefined, p_limit: 150 });
  if (error) console.error("admin_tag_list", error.message);
  return data ?? [];
}

export async function allCircles() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("circles")
    .select("id, slug, name, visibility, member_count, created_at, owner:profiles!circles_owner_id_fkey(username, display_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function allProjects() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, slug, title, status, participant_count, created_at, owner:profiles!projects_owner_id_fkey(username, display_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function moderationLog(limit = 30) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("moderation_actions")
    .select("id, action, target_type, target_id, note, created_at, actor:profiles!moderation_actions_actor_id_fkey(username, display_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function siteSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("registration_open, welcome_message, updated_at").maybeSingle();
  return data ?? { registration_open: true, welcome_message: "", updated_at: null };
}
