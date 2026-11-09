/**
 * Tipos de la base de datos (escritos a mano a partir de supabase/migrations).
 * Cuando el proyecto esté enlazado se pueden regenerar con:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 */
export type UserRole = "admin" | "moderator" | "member" | "restricted";
export type AccountStatus = "active" | "suspended" | "banned";
export type ChatAvailability = "open" | "sometimes" | "closed";

export type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string;
  avatar_url: string | null;
  country: string | null;
  region: string | null;
  languages: string[];
  looking_for: string;
  personal_projects: string;
  availability: ChatAvailability;
  role: UserRole;
  status: AccountStatus;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileUpdate = Partial<
  Pick<
    ProfileRow,
    | "username"
    | "display_name"
    | "bio"
    | "avatar_url"
    | "country"
    | "region"
    | "languages"
    | "looking_for"
    | "personal_projects"
    | "availability"
    | "onboarded_at"
  >
>;

export type InterestRow = { slug: string; name: string; position: number; created_at: string };
export type CategoryRow = {
  slug: string;
  name: string;
  description: string;
  position: number;
  is_archived: boolean;
  created_at: string;
};
export type ProfileInterestRow = {
  profile_id: string;
  interest_slug: string;
  is_favorite: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: { id: string } & ProfileUpdate; Update: ProfileUpdate; Relationships: [] };
      interests: { Row: InterestRow; Insert: never; Update: never; Relationships: [] };
      categories: { Row: CategoryRow; Insert: never; Update: never; Relationships: [] };
      profile_interests: {
        Row: ProfileInterestRow;
        Insert: { profile_id: string; interest_slug: string; is_favorite?: boolean };
        Update: { is_favorite?: boolean };
        Relationships: [
          {
            foreignKeyName: "profile_interests_interest_slug_fkey";
            columns: ["interest_slug"];
            isOneToOne: false;
            referencedRelation: "interests";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "profile_interests_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      set_my_interests: { Args: { p_interests: string[]; p_favorites?: string[] }; Returns: undefined };
      delete_my_account: { Args: { p_confirm_username: string }; Returns: undefined };
    };
    Enums: { user_role: UserRole; account_status: AccountStatus; chat_availability: ChatAvailability };
    CompositeTypes: { [_ in never]: never };
  };
};
