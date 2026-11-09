import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/types";

export type MemberCard = Pick<
  ProfileRow,
  "id" | "username" | "display_name" | "avatar_url" | "country" | "region" | "availability" | "bio"
> & { interests: { slug: string; name: string; is_favorite: boolean }[]; shared?: number };

const CARD_COLUMNS =
  "id, username, display_name, avatar_url, country, region, availability, bio, profile_interests(is_favorite, interests(slug, name))";

type RawCard = Omit<MemberCard, "interests"> & {
  profile_interests: { is_favorite: boolean; interests: { slug: string; name: string } | null }[];
};

function toCard(r: RawCard): MemberCard {
  const { profile_interests, ...rest } = r;
  return {
    ...rest,
    interests: profile_interests
      .filter((pi) => pi.interests)
      .map((pi) => ({ ...pi.interests!, is_favorite: pi.is_favorite }))
      .sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite)),
  };
}

/** Miembros que han completado su perfil, más recientes primero. */
export async function getNewMembers(excludeId: string, limit = 8): Promise<MemberCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(CARD_COLUMNS)
    .not("onboarded_at", "is", null)
    .neq("id", excludeId)
    .order("onboarded_at", { ascending: false })
    .limit(limit)
    .returns<RawCard[]>();
  return (data ?? []).map(toCard);
}

/** Miembros con más intereses en común con el usuario. */
export async function getAffinityMembers(userId: string, limit = 6): Promise<MemberCard[]> {
  const supabase = await createClient();
  const { data: mine } = await supabase.from("profile_interests").select("interest_slug").eq("profile_id", userId);
  const slugs = (mine ?? []).map((m) => m.interest_slug);
  if (!slugs.length) return [];

  const { data: overlaps } = await supabase
    .from("profile_interests")
    .select("profile_id")
    .in("interest_slug", slugs)
    .neq("profile_id", userId)
    .limit(2000);

  const counts = new Map<string, number>();
  for (const o of overlaps ?? []) counts.set(o.profile_id, (counts.get(o.profile_id) ?? 0) + 1);
  // Candidatos holgados; el desempate por antigüedad se hace tras leer perfiles.
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit * 4);
  if (!top.length) return [];

  const { data } = await supabase
    .from("profiles")
    .select(`${CARD_COLUMNS}, onboarded_at`)
    .in("id", top.map(([id]) => id))
    .not("onboarded_at", "is", null)
    .returns<(RawCard & { onboarded_at: string })[]>();

  // Más intereses en común primero; a igualdad, quien llegó más recientemente.
  return (data ?? [])
    .sort(
      (a, b) =>
        (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || b.onboarded_at.localeCompare(a.onboarded_at),
    )
    .slice(0, limit)
    .map((r) => ({ ...toCard(r), shared: counts.get(r.id) ?? 0 }));
}

/** Perfil completo por nombre de usuario (solo miembros; RLS lo garantiza). */
export async function getMemberByUsername(username: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, country, region, availability, bio, looking_for, personal_projects, languages, created_at, onboarded_at, profile_interests(is_favorite, interests(slug, name))",
    )
    .eq("username", username)
    .not("onboarded_at", "is", null)
    .maybeSingle()
    .returns<
      (RawCard & Pick<ProfileRow, "looking_for" | "personal_projects" | "languages" | "created_at">) | null
    >();
  if (!data) return null;
  return { ...toCard(data), looking_for: data.looking_for, personal_projects: data.personal_projects, languages: data.languages, created_at: data.created_at };
}

/** Búsqueda simple de miembros por nombre o usuario. */
export async function searchMembersByName(q: string, excludeId: string, limit = 20): Promise<MemberCard[]> {
  const supabase = await createClient();
  const term = q.replace(/[%_,()*]/g, " ").trim();
  if (!term) return [];
  const { data } = await supabase
    .from("profiles")
    .select(CARD_COLUMNS)
    .not("onboarded_at", "is", null)
    .neq("id", excludeId)
    .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
    .limit(limit)
    .returns<RawCard[]>();
  return (data ?? []).map(toCard);
}
