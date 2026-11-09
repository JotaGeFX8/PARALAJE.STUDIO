/**
 * Alias de tipos sobre los generados desde la base de datos.
 * Regenerar database.types.ts tras cada migración:
 *   npx supabase@3.0.0 gen types typescript --local --schema public > src/lib/supabase/database.types.ts
 * (o con --project-id <REF> contra el proyecto en la nube).
 */
import type { Database } from "./database.types";

export type { Database };

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

export type ProfileRow = Tables<"profiles">;
export type UserRole = Enums<"user_role">;
export type AccountStatus = Enums<"account_status">;
export type ChatAvailability = Enums<"chat_availability">;
export type PostKindDb = Enums<"post_kind">;
export type PostTypeDb = Enums<"post_type">;
export type ReactionType = Enums<"reaction_type">;
export type ReportTarget = Enums<"report_target">;
export type TopicRelation = Enums<"topic_relation">;
export type UserGoal = Enums<"user_goal">;
export type Visibility = Enums<"visibility">;

/** Elemento de listado de publicaciones (las columnas de tipos compuestos llegan como opcionales). */
type RawPostItem = PublicSchema["CompositeTypes"]["post_list_item"];
export type PostItem = { [K in keyof RawPostItem]-?: NonNullable<RawPostItem[K]> } & {
  title: string | null;
  category_slug: string | null;
  category_name: string | null;
  forum_slug: string | null;
  forum_name: string | null;
  circle_id: string | null;
  author_avatar: string | null;
};

export function toPostItems(rows: RawPostItem[] | null | undefined): PostItem[] {
  return (rows ?? []).filter((r) => r.id).map((r) => r as PostItem);
}
