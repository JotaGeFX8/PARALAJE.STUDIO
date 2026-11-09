import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TopicRelation, UserGoal, Visibility } from "@/lib/supabase/types";

/** Catálogo de intereses: 22 áreas → temas (con sinónimos para el buscador). */
export type CatalogArea = { slug: string; name: string; description: string };
export type CatalogTopic = {
  id: number;
  slug: string;
  name: string;
  area: string;
  /** Otras áreas a las que también pertenece (p. ej. UAP en Cosmos y en Anomalías). */
  also: string[];
  synonyms: string[];
  /** Propuesto por quien consulta y pendiente de revisión. */
  pending: boolean;
};
export type Catalog = { areas: CatalogArea[]; topics: CatalogTopic[] };

export async function getCatalog(): Promise<Catalog> {
  const supabase = await createClient();
  const [{ data: areas }, { data: topics }, { data: synonyms }, { data: extra }] = await Promise.all([
    supabase.from("interest_areas").select("slug, name, description").order("position"),
    // RLS devuelve los aprobados y las propuestas propias pendientes.
    supabase.from("topics").select("id, slug, name, area_slug, status").is("merged_into", null).neq("status", "rejected").order("name"),
    supabase.from("topic_synonyms").select("topic_id, term"),
    supabase.from("topic_areas").select("topic_id, area_slug"),
  ]);
  const syn = new Map<number, string[]>();
  for (const s of synonyms ?? []) syn.set(s.topic_id, [...(syn.get(s.topic_id) ?? []), s.term]);
  const also = new Map<number, string[]>();
  for (const a of extra ?? []) also.set(a.topic_id, [...(also.get(a.topic_id) ?? []), a.area_slug]);
  return {
    areas: areas ?? [],
    topics: (topics ?? []).map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      area: t.area_slug,
      also: (also.get(t.id) ?? []).filter((a) => a !== t.area_slug),
      synonyms: syn.get(t.id) ?? [],
      pending: t.status === "pending",
    })),
  };
}

export async function getAreas(): Promise<CatalogArea[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("interest_areas").select("slug, name, description").order("position");
  return data ?? [];
}

export type MyTopic = { topic_id: number; relation: TopicRelation; is_primary: boolean };

/** Lo que guarda el propio miembro (temas, objetivos, privacidad y ajustes). */
export async function getMyCatalogState(userId: string) {
  const supabase = await createClient();
  const [{ data: topics }, { data: goals }, { data: privacy }, { data: settings }] = await Promise.all([
    supabase.from("profile_topics").select("topic_id, relation, is_primary").eq("profile_id", userId),
    supabase.from("profile_goals").select("goal").eq("profile_id", userId),
    supabase.from("profile_privacy").select("location, about, interests, activity, network").eq("profile_id", userId).maybeSingle(),
    supabase.from("user_settings").select("who_can_message, read_receipts").eq("profile_id", userId).maybeSingle(),
  ]);
  return {
    topics: (topics ?? []) as MyTopic[],
    goals: (goals ?? []).map((g) => g.goal) as UserGoal[],
    privacy: (privacy ?? {
      location: "public",
      about: "public",
      interests: "public",
      activity: "public",
      network: "public",
    }) as Record<"location" | "about" | "interests" | "activity" | "network", Visibility>,
    settings: {
      who_can_message: (settings?.who_can_message ?? "everyone") as "everyone" | "connections",
      read_receipts: settings?.read_receipts ?? true,
    },
  };
}

export type ProfileTopic = {
  topic_id: number;
  slug: string;
  name: string;
  area_slug: string;
  area_name: string;
  relation: TopicRelation;
  is_primary: boolean;
};

/** Temas y objetivos de cualquier perfil (vacío si su apartado de intereses no es visible). */
export async function profileTopicsAndGoals(profileId: string) {
  const supabase = await createClient();
  const [{ data: topics }, { data: goals }] = await Promise.all([
    supabase.rpc("profile_topics_for", { p_profile: profileId }),
    supabase.rpc("profile_goals_for", { p_profile: profileId }),
  ]);
  return { topics: (topics ?? []) as ProfileTopic[], goals: (goals ?? []) as UserGoal[] };
}

/** Temas pendientes de revisión (panel del equipo). */
export async function pendingTopics() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, name, area_slug, created_at, proposer:profiles!topics_proposed_by_fkey(username, display_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(200);
  return data ?? [];
}
