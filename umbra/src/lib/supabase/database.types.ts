
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"description": string,"is_archived": boolean,"name": string,"position": number,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string,"is_archived"?: boolean,"name": string,"position"?: number,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"is_archived"?: boolean,"name"?: string,"position"?: number,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"comment_reactions": {
                  Row: {
                    "comment_id": string,"created_at": string,"type": Database["public"]['Enums']["reaction_type"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_id": string,"created_at"?: string,"type": Database["public"]['Enums']["reaction_type"],"user_id": string
                  }
                  Update: {
                    "comment_id"?: string,"created_at"?: string,"type"?: Database["public"]['Enums']["reaction_type"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comment_reactions_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comment_reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"deleted_at": string | null,"deleted_by": string | null,"depth": number,"edited_at": string | null,"id": string,"parent_id": string | null,"post_id": string,"reaction_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"deleted_at"?: string | null,"deleted_by"?: string | null,"depth"?: number,"edited_at"?: string | null,"id"?: string,"parent_id"?: string | null,"post_id": string,"reaction_count"?: number
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"deleted_at"?: string | null,"deleted_by"?: string | null,"depth"?: number,"edited_at"?: string | null,"id"?: string,"parent_id"?: string | null,"post_id"?: string,"reaction_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_deleted_by_fkey"
      columns: ["deleted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"interests": {
                  Row: {
                    "created_at": string,"name": string,"position": number,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"name": string,"position"?: number,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"name"?: string,"position"?: number,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"post_follows": {
                  Row: {
                    "created_at": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_follows_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_follows_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"post_reactions": {
                  Row: {
                    "created_at": string,"post_id": string,"type": Database["public"]['Enums']["reaction_type"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"post_id": string,"type": Database["public"]['Enums']["reaction_type"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"post_id"?: string,"type"?: Database["public"]['Enums']["reaction_type"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_reactions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"post_tags": {
                  Row: {
                    "post_id": string,"tag_slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "post_id": string,"tag_slug": string
                  }
                  Update: {
                    "post_id"?: string,"tag_slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_tags_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_tags_tag_slug_fkey"
      columns: ["tag_slug"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["slug"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string,"body": string,"category_slug": string | null,"circle_id": string | null,"comment_count": number,"created_at": string,"deleted_at": string | null,"deleted_by": string | null,"edited_at": string | null,"id": string,"image_paths": (string)[],"is_locked": boolean,"is_pinned": boolean,"is_question": boolean,"kind": Database["public"]['Enums']["post_kind"],"last_activity_at": string,"reaction_count": number,"search": unknown,"sources": (string)[],"title": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"category_slug"?: string | null,"circle_id"?: string | null,"comment_count"?: number,"created_at"?: string,"deleted_at"?: string | null,"deleted_by"?: string | null,"edited_at"?: string | null,"id"?: string,"image_paths"?: (string)[],"is_locked"?: boolean,"is_pinned"?: boolean,"is_question"?: boolean,"kind"?: Database["public"]['Enums']["post_kind"],"last_activity_at"?: string,"reaction_count"?: number,"search"?: never,"sources"?: (string)[],"title"?: string | null
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"category_slug"?: string | null,"circle_id"?: string | null,"comment_count"?: number,"created_at"?: string,"deleted_at"?: string | null,"deleted_by"?: string | null,"edited_at"?: string | null,"id"?: string,"image_paths"?: (string)[],"is_locked"?: boolean,"is_pinned"?: boolean,"is_question"?: boolean,"kind"?: Database["public"]['Enums']["post_kind"],"last_activity_at"?: string,"reaction_count"?: number,"search"?: never,"sources"?: (string)[],"title"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_category_slug_fkey"
      columns: ["category_slug"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "posts_deleted_by_fkey"
      columns: ["deleted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_interests": {
                  Row: {
                    "created_at": string,"interest_slug": string,"is_favorite": boolean,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"interest_slug": string,"is_favorite"?: boolean,"profile_id": string
                  }
                  Update: {
                    "created_at"?: string,"interest_slug"?: string,"is_favorite"?: boolean,"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_interests_interest_slug_fkey"
      columns: ["interest_slug"]
isOneToOne: false
      referencedRelation: "interests"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "profile_interests_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "availability": Database["public"]['Enums']["chat_availability"],"avatar_url": string | null,"bio": string,"country": string | null,"created_at": string,"display_name": string | null,"id": string,"languages": (string)[],"looking_for": string,"onboarded_at": string | null,"personal_projects": string,"region": string | null,"role": Database["public"]['Enums']["user_role"],"status": Database["public"]['Enums']["account_status"],"updated_at": string,"username": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "availability"?: Database["public"]['Enums']["chat_availability"],"avatar_url"?: string | null,"bio"?: string,"country"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"languages"?: (string)[],"looking_for"?: string,"onboarded_at"?: string | null,"personal_projects"?: string,"region"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string,"username"?: string | null
                  }
                  Update: {
                    "availability"?: Database["public"]['Enums']["chat_availability"],"avatar_url"?: string | null,"bio"?: string,"country"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"languages"?: (string)[],"looking_for"?: string,"onboarded_at"?: string | null,"personal_projects"?: string,"region"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string,"username"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"details": string,"id": string,"reason": Database["public"]['Enums']["report_reason"],"reporter_id": string | null,"resolution_note": string,"resolved_at": string | null,"resolved_by": string | null,"status": Database["public"]['Enums']["report_status"],"target_id": string,"target_type": Database["public"]['Enums']["report_target"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"details"?: string,"id"?: string,"reason": Database["public"]['Enums']["report_reason"],"reporter_id"?: string | null,"resolution_note"?: string,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"target_id": string,"target_type": Database["public"]['Enums']["report_target"]
                  }
                  Update: {
                    "created_at"?: string,"details"?: string,"id"?: string,"reason"?: Database["public"]['Enums']["report_reason"],"reporter_id"?: string | null,"resolution_note"?: string,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"target_id"?: string,"target_type"?: Database["public"]['Enums']["report_target"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_resolved_by_fkey"
      columns: ["resolved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"saved_posts": {
                  Row: {
                    "created_at": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_posts_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saved_posts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"tags": {
                  Row: {
                    "created_at": string,"created_by": string | null,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tags_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_write":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"category_stats":
{ Args: Record<PropertyKey, never>; Returns: {
              "last_activity_at": string,"post_count": number,"slug": string
            }[]
                           },
"create_post":
{ Args: { "p_body": string,"p_category"?: string,"p_circle"?: string,"p_image_paths"?: (string)[],"p_is_question"?: boolean,"p_kind": Database["public"]['Enums']["post_kind"],"p_sources"?: (string)[],"p_tags"?: (string)[],"p_title": string }; Returns: string
                           },
"current_role_name":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["user_role"]
                           },
"delete_comment":
{ Args: { "p_id": string }; Returns: undefined
                           },
"delete_my_account":
{ Args: { "p_confirm_username": string }; Returns: undefined
                           },
"delete_post":
{ Args: { "p_id": string }; Returns: undefined
                           },
"feed_posts":
{ Args: { "p_author"?: string,"p_category"?: string,"p_circle"?: string,"p_kind"?: Database["public"]['Enums']["post_kind"],"p_limit"?: number,"p_offset"?: number,"p_saved_only"?: boolean,"p_scope"?: string,"p_sort"?: string,"p_tag"?: string }; Returns: Database["public"]['CompositeTypes']["post_list_item"][]
                          SetofOptions: {
        from: "*"
        to: "post_list_item"
        isOneToOne: false
        isSetofReturn: true
      } },
"immutable_unaccent":
{ Args: { "": string }; Returns: string
                           },
"is_active_member":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_blocked_with":
{ Args: { "p_other": string }; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"reaction_summary":
{ Args: { "p_post": string }; Returns: {
              "mine": boolean,"target": string,"target_id": string,"total": number,"type": Database["public"]['Enums']["reaction_type"]
            }[]
                           },
"search_posts":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_query": string }; Returns: Database["public"]['CompositeTypes']["post_list_item"][]
                          SetofOptions: {
        from: "*"
        to: "post_list_item"
        isOneToOne: false
        isSetofReturn: true
      } },
"set_my_interests":
{ Args: { "p_favorites"?: (string)[],"p_interests": (string)[] }; Returns: undefined
                           },
"set_post_tags":
{ Args: { "p_post": string,"p_tags": (string)[] }; Returns: undefined
                           },
"slugify":
{ Args: { "p": string }; Returns: string
                           },
"trending_tags":
{ Args: { "p_limit"?: number }; Returns: {
              "name": string,"slug": string,"uses": number
            }[]
                           },
"update_post":
{ Args: { "p_body": string,"p_id": string,"p_image_paths": (string)[],"p_is_question": boolean,"p_kind": Database["public"]['Enums']["post_kind"],"p_sources": (string)[],"p_tags": (string)[],"p_title": string }; Returns: undefined
                           }
          }
          Enums: {
            "account_status": "active"|"suspended"|"banned","chat_availability": "open"|"sometimes"|"closed","post_kind": "documented"|"hypothesis"|"opinion"|"experience","reaction_type": "valuable"|"curious"|"agree"|"needs_sources","report_reason": "spam"|"harassment"|"hate"|"illegal"|"personal_data"|"mislabeled"|"other","report_status": "open"|"resolved"|"dismissed","report_target": "post"|"comment"|"profile"|"message"|"circle"|"project","user_role": "admin"|"moderator"|"member"|"restricted"
          }
          CompositeTypes: {
            "post_list_item": {
                        "id": string | null,"title": string | null,"excerpt": string | null,"kind": Database["public"]['Enums']["post_kind"] | null,"is_question": boolean | null,"category_slug": string | null,"category_name": string | null,"circle_id": string | null,"author_id": string | null,"author_username": string | null,"author_name": string | null,"author_avatar": string | null,"tags": (string)[] | null,"comment_count": number | null,"reaction_count": number | null,"image_count": number | null,"is_pinned": boolean | null,"is_locked": boolean | null,"created_at": string | null,"last_activity_at": string | null
                      }
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "account_status": ["active", "suspended", "banned"],"chat_availability": ["open", "sometimes", "closed"],"post_kind": ["documented", "hypothesis", "opinion", "experience"],"reaction_type": ["valuable", "curious", "agree", "needs_sources"],"report_reason": ["spam", "harassment", "hate", "illegal", "personal_data", "mislabeled", "other"],"report_status": ["open", "resolved", "dismissed"],"report_target": ["post", "comment", "profile", "message", "circle", "project"],"user_role": ["admin", "moderator", "member", "restricted"]
          }
        }
} as const
