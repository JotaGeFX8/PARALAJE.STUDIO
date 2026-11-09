import "server-only";
import { createClient } from "@/lib/supabase/server";
import { coverUrl } from "@/lib/media";
import type { ChatAvailability, Database, UserGoal } from "@/lib/supabase/types";
import { profileTopicsAndGoals, type ProfileTopic } from "./catalog";

/**
 * Tarjeta de miembro tal como la devuelve la base de datos (member_card_for):
 * cada apartado ya llega filtrado según la privacidad que eligió esa persona.
 */
export type MemberCard = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  looking_for: string;
  country: string | null;
  region: string | null;
  availability: ChatAvailability;
  languages: string[];
  shared_count: number;
  shared_topics: string[];
  topics: string[];
  reasons: string[];
  connection: "none" | "sent" | "received" | "connected";
};

type RawCard = Database["public"]["CompositeTypes"]["member_card"];

export function toCards(rows: RawCard[] | RawCard | null | undefined): MemberCard[] {
  const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
  return list
    .filter((r) => r.id && r.username)
    .map((r) => ({
      id: r.id!,
      username: r.username!,
      display_name: r.display_name ?? r.username!,
      avatar_url: r.avatar_url,
      bio: r.bio ?? "",
      looking_for: r.looking_for ?? "",
      country: r.country,
      region: r.region,
      availability: r.availability ?? "sometimes",
      languages: r.languages ?? [],
      shared_count: r.shared_count ?? 0,
      shared_topics: r.shared_topics ?? [],
      topics: r.topics ?? [],
      reasons: r.reasons ?? [],
      connection: (r.connection ?? "none") as MemberCard["connection"],
    }));
}

/** Miembros que han completado su perfil, más recientes primero. */
export async function getNewMembers(limit = 8): Promise<MemberCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("new_members", { p_limit: limit });
  if (error) console.error("new_members", error.message);
  return toCards(data);
}

/** Miembros con más temas en común con quien consulta. */
export async function getAffinityMembers(limit = 6): Promise<MemberCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("affinity_members", { p_limit: limit });
  if (error) console.error("affinity_members", error.message);
  return toCards(data);
}

/** Búsqueda simple por nombre, usuario o presentación (respeta la privacidad). */
export async function searchMembersByName(q: string, limit = 20): Promise<MemberCard[]> {
  const term = q.trim().slice(0, 80);
  if (!term) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_members", { p_query: term, p_limit: limit });
  if (error) console.error("search_members", error.message);
  return toCards(data);
}

export type MemberProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  languages: string[];
  availability: ChatAvailability;
  created_at: string;
  country: string | null;
  region: string | null;
  bio: string;
  exploring: string;
  can_offer: string;
  looking_for: string;
  personal_projects: string;
  skills: string[];
  visible: { about: boolean; interests: boolean; activity: boolean; network: boolean };
  connection: MemberCard["connection"];
  connections_count: number | null;
  topics: ProfileTopic[];
  goals: UserGoal[];
};

/** Perfil completo por nombre de usuario; cada apartado filtrado por su privacidad en la base de datos. */
export async function getMemberByUsername(username: string): Promise<MemberProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("profile_view", { p_username: username });
  if (error) console.error("profile_view", error.message);
  const p = data?.[0];
  if (!p) return null;
  const { topics, goals } = await profileTopicsAndGoals(p.id);
  return {
    id: p.id,
    username: p.username,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    cover_url: coverUrl(p.cover_path),
    languages: p.languages ?? [],
    availability: p.availability,
    created_at: p.created_at,
    country: p.country,
    region: p.region,
    bio: p.bio ?? "",
    exploring: p.exploring ?? "",
    can_offer: p.can_offer ?? "",
    looking_for: p.looking_for ?? "",
    personal_projects: p.personal_projects ?? "",
    skills: p.skills ?? [],
    visible: { about: p.about_visible, interests: p.interests_visible, activity: p.activity_visible, network: p.network_visible },
    connection: (p.connection ?? "none") as MemberCard["connection"],
    connections_count: p.connections_count ?? null,
    topics,
    goals,
  };
}
