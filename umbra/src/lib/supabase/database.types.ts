
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
                },"circle_invites": {
                  Row: {
                    "circle_id": string,"created_at": string,"id": string,"invitee_id": string,"inviter_id": string | null,"responded_at": string | null,"status": Database["public"]['Enums']["request_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id": string,"created_at"?: string,"id"?: string,"invitee_id": string,"inviter_id"?: string | null,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Update: {
                    "circle_id"?: string,"created_at"?: string,"id"?: string,"invitee_id"?: string,"inviter_id"?: string | null,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "circle_invites_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "circle_invites_invitee_id_fkey"
      columns: ["invitee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "circle_invites_inviter_id_fkey"
      columns: ["inviter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"circle_members": {
                  Row: {
                    "circle_id": string,"joined_at": string,"role": Database["public"]['Enums']["circle_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id": string,"joined_at"?: string,"role"?: Database["public"]['Enums']["circle_role"],"user_id": string
                  }
                  Update: {
                    "circle_id"?: string,"joined_at"?: string,"role"?: Database["public"]['Enums']["circle_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "circle_members_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "circle_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"circle_messages": {
                  Row: {
                    "body": string,"circle_id": string,"created_at": string,"deleted_at": string | null,"id": string,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"circle_id": string,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"sender_id": string
                  }
                  Update: {
                    "body"?: string,"circle_id"?: string,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "circle_messages_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "circle_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"circle_requests": {
                  Row: {
                    "circle_id": string,"created_at": string,"id": string,"message": string,"responded_at": string | null,"status": Database["public"]['Enums']["request_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id": string,"created_at"?: string,"id"?: string,"message"?: string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"user_id": string
                  }
                  Update: {
                    "circle_id"?: string,"created_at"?: string,"id"?: string,"message"?: string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "circle_requests_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "circle_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"circles": {
                  Row: {
                    "created_at": string,"description": string,"id": string,"image_path": string | null,"last_activity_at": string,"member_count": number,"name": string,"owner_id": string,"slug": string,"visibility": Database["public"]['Enums']["circle_visibility"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string,"id"?: string,"image_path"?: string | null,"last_activity_at"?: string,"member_count"?: number,"name": string,"owner_id": string,"slug": string,"visibility"?: Database["public"]['Enums']["circle_visibility"]
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"id"?: string,"image_path"?: string | null,"last_activity_at"?: string,"member_count"?: number,"name"?: string,"owner_id"?: string,"slug"?: string,"visibility"?: Database["public"]['Enums']["circle_visibility"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "circles_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
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
                },"connections": {
                  Row: {
                    "addressee_id": string,"created_at": string,"id": string,"message": string,"pair_high": string | null,"pair_low": string | null,"requester_id": string,"responded_at": string | null,"status": Database["public"]['Enums']["connection_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "addressee_id": string,"created_at"?: string,"id"?: string,"message"?: string,"pair_high"?: never,"pair_low"?: never,"requester_id": string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["connection_status"]
                  }
                  Update: {
                    "addressee_id"?: string,"created_at"?: string,"id"?: string,"message"?: string,"pair_high"?: never,"pair_low"?: never,"requester_id"?: string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["connection_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "connections_addressee_id_fkey"
      columns: ["addressee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "connections_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "created_at": string,"high_read_at": string,"id": string,"last_message_at": string,"low_read_at": string,"user_high": string,"user_low": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"high_read_at"?: string,"id"?: string,"last_message_at"?: string,"low_read_at"?: string,"user_high": string,"user_low": string
                  }
                  Update: {
                    "created_at"?: string,"high_read_at"?: string,"id"?: string,"last_message_at"?: string,"low_read_at"?: string,"user_high"?: string,"user_low"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_user_high_fkey"
      columns: ["user_high"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_user_low_fkey"
      columns: ["user_low"]
isOneToOne: false
      referencedRelation: "profiles"
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
                },"member_skips": {
                  Row: {
                    "created_at": string,"skipped_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"skipped_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"skipped_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_skips_skipped_id_fkey"
      columns: ["skipped_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_skips_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"conversation_id": string,"created_at": string,"deleted_at": string | null,"id": string,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"conversation_id": string,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"sender_id": string
                  }
                  Update: {
                    "body"?: string,"conversation_id"?: string,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"moderation_actions": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"id": string,"note": string,"target_id": string,"target_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"id"?: string,"note"?: string,"target_id": string,"target_type": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"id"?: string,"note"?: string,"target_id"?: string,"target_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "moderation_actions_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notification_prefs": {
                  Row: {
                    "circles": boolean,"comments": boolean,"connections": boolean,"mentions": boolean,"messages": boolean,"projects": boolean,"replies": boolean,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circles"?: boolean,"comments"?: boolean,"connections"?: boolean,"mentions"?: boolean,"messages"?: boolean,"projects"?: boolean,"replies"?: boolean,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "circles"?: boolean,"comments"?: boolean,"connections"?: boolean,"mentions"?: boolean,"messages"?: boolean,"projects"?: boolean,"replies"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notification_prefs_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "actor_id": string | null,"body": string,"circle_id": string | null,"comment_id": string | null,"conversation_id": string | null,"created_at": string,"id": string,"post_id": string | null,"project_id": string | null,"read_at": string | null,"type": Database["public"]['Enums']["notification_type"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"body"?: string,"circle_id"?: string | null,"comment_id"?: string | null,"conversation_id"?: string | null,"created_at"?: string,"id"?: string,"post_id"?: string | null,"project_id"?: string | null,"read_at"?: string | null,"type": Database["public"]['Enums']["notification_type"],"user_id": string
                  }
                  Update: {
                    "actor_id"?: string | null,"body"?: string,"circle_id"?: string | null,"comment_id"?: string | null,"conversation_id"?: string | null,"created_at"?: string,"id"?: string,"post_id"?: string | null,"project_id"?: string | null,"read_at"?: string | null,"type"?: Database["public"]['Enums']["notification_type"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_circle_fk"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_project_fk"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
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
      foreignKeyName: "posts_circle_fk"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
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
                },"project_members": {
                  Row: {
                    "joined_at": string,"project_id": string,"role": Database["public"]['Enums']["project_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "joined_at"?: string,"project_id": string,"role"?: Database["public"]['Enums']["project_role"],"user_id": string
                  }
                  Update: {
                    "joined_at"?: string,"project_id"?: string,"role"?: Database["public"]['Enums']["project_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_members_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"project_messages": {
                  Row: {
                    "body": string,"created_at": string,"deleted_at": string | null,"id": string,"is_update": boolean,"project_id": string,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"is_update"?: boolean,"project_id": string,"sender_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"is_update"?: boolean,"project_id"?: string,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_messages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"project_requests": {
                  Row: {
                    "created_at": string,"id": string,"message": string,"project_id": string,"responded_at": string | null,"status": Database["public"]['Enums']["request_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"message"?: string,"project_id": string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"message"?: string,"project_id"?: string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_requests_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "country": string | null,"cover_path": string | null,"created_at": string,"description": string,"id": string,"interests": (string)[],"last_activity_at": string,"objectives": (string)[],"owner_id": string,"participant_count": number,"region": string | null,"seeking": string,"slug": string,"status": Database["public"]['Enums']["project_status"],"summary": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "country"?: string | null,"cover_path"?: string | null,"created_at"?: string,"description"?: string,"id"?: string,"interests"?: (string)[],"last_activity_at"?: string,"objectives"?: (string)[],"owner_id": string,"participant_count"?: number,"region"?: string | null,"seeking"?: string,"slug": string,"status"?: Database["public"]['Enums']["project_status"],"summary"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "country"?: string | null,"cover_path"?: string | null,"created_at"?: string,"description"?: string,"id"?: string,"interests"?: (string)[],"last_activity_at"?: string,"objectives"?: (string)[],"owner_id"?: string,"participant_count"?: number,"region"?: string | null,"seeking"?: string,"slug"?: string,"status"?: Database["public"]['Enums']["project_status"],"summary"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
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
                },"site_settings": {
                  Row: {
                    "id": boolean,"registration_open": boolean,"updated_at": string,"updated_by": string | null,"welcome_message": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: boolean,"registration_open"?: boolean,"updated_at"?: string,"updated_by"?: string | null,"welcome_message"?: string
                  }
                  Update: {
                    "id"?: boolean,"registration_open"?: boolean,"updated_at"?: string,"updated_by"?: string | null,"welcome_message"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_settings_updated_by_fkey"
      columns: ["updated_by"]
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
            "admin_list_members":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_query"?: string,"p_role"?: Database["public"]['Enums']["user_role"],"p_status"?: Database["public"]['Enums']["account_status"] }; Returns: {
              "avatar_url": string,"created_at": string,"display_name": string,"email": string,"id": string,"onboarded_at": string,"posts": number,"reports_against": number,"role": Database["public"]['Enums']["user_role"],"status": Database["public"]['Enums']["account_status"],"username": string
            }[]
                           },
"admin_save_category":
{ Args: { "p_archived": boolean,"p_description": string,"p_name": string,"p_position": number,"p_slug": string }; Returns: undefined
                           },
"admin_set_role":
{ Args: { "p_role": Database["public"]['Enums']["user_role"],"p_user": string }; Returns: undefined
                           },
"admin_set_status":
{ Args: { "p_reason"?: string,"p_status": Database["public"]['Enums']["account_status"],"p_user": string }; Returns: undefined
                           },
"admin_stats":
{ Args: Record<PropertyKey, never>; Returns: {
              "circles": number,"comments": number,"members": number,"members_week": number,"open_reports": number,"posts": number,"posts_week": number,"projects": number,"suspended": number
            }[]
                           },
"admin_update_settings":
{ Args: { "p_registration_open": boolean,"p_welcome": string }; Returns: undefined
                           },
"can_message":
{ Args: { "p_conversation": string }; Returns: boolean
                           },
"can_read_circle":
{ Args: { "p_circle": string }; Returns: boolean
                           },
"can_see_circle":
{ Args: { "p_circle": string }; Returns: boolean
                           },
"can_write":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"category_stats":
{ Args: Record<PropertyKey, never>; Returns: {
              "last_activity_at": string,"post_count": number,"slug": string
            }[]
                           },
"circle_role_of":
{ Args: { "p_circle": string }; Returns: Database["public"]['Enums']["circle_role"]
                           },
"community_activity":
{ Args: { "p_limit"?: number }; Returns: {
              "actor_avatar": string,"actor_name": string,"actor_username": string,"at": string,"kind": string,"ref": string,"title": string
            }[]
                           },
"create_circle":
{ Args: { "p_description": string,"p_image_path"?: string,"p_name": string,"p_visibility": Database["public"]['Enums']["circle_visibility"] }; Returns: string
                           },
"create_post":
{ Args: { "p_body": string,"p_category"?: string,"p_circle"?: string,"p_image_paths"?: (string)[],"p_is_question"?: boolean,"p_kind": Database["public"]['Enums']["post_kind"],"p_sources"?: (string)[],"p_tags"?: (string)[],"p_title": string }; Returns: string
                           },
"create_project":
{ Args: { "p_country": string,"p_cover_path"?: string,"p_description": string,"p_interests": (string)[],"p_objectives": (string)[],"p_region": string,"p_seeking": string,"p_status": Database["public"]['Enums']["project_status"],"p_summary": string,"p_title": string }; Returns: string
                           },
"current_role_name":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["user_role"]
                           },
"delete_circle_message":
{ Args: { "p_id": string }; Returns: undefined
                           },
"delete_comment":
{ Args: { "p_id": string }; Returns: undefined
                           },
"delete_message":
{ Args: { "p_id": string }; Returns: undefined
                           },
"delete_my_account":
{ Args: { "p_confirm_username": string }; Returns: undefined
                           },
"delete_post":
{ Args: { "p_id": string }; Returns: undefined
                           },
"delete_project_message":
{ Args: { "p_id": string }; Returns: undefined
                           },
"discover_members":
{ Args: { "p_limit"?: number }; Returns: Database["public"]['CompositeTypes']["member_card"][]
                          SetofOptions: {
        from: "*"
        to: "member_card"
        isOneToOne: false
        isSetofReturn: true
      } },
"feed_posts":
{ Args: { "p_author"?: string,"p_category"?: string,"p_circle"?: string,"p_kind"?: Database["public"]['Enums']["post_kind"],"p_limit"?: number,"p_offset"?: number,"p_questions_only"?: boolean,"p_saved_only"?: boolean,"p_scope"?: string,"p_sort"?: string,"p_tag"?: string }; Returns: Database["public"]['CompositeTypes']["post_list_item"][]
                          SetofOptions: {
        from: "*"
        to: "post_list_item"
        isOneToOne: false
        isSetofReturn: true
      } },
"immutable_unaccent":
{ Args: { "": string }; Returns: string
                           },
"invite_to_circle":
{ Args: { "p_circle": string,"p_username": string }; Returns: undefined
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
"is_circle_admin":
{ Args: { "p_circle": string }; Returns: boolean
                           },
"is_circle_member":
{ Args: { "p_circle": string }; Returns: boolean
                           },
"is_connected_with":
{ Args: { "p_other": string }; Returns: boolean
                           },
"is_conversation_member":
{ Args: { "p_conversation": string }; Returns: boolean
                           },
"is_project_owner":
{ Args: { "p_project": string }; Returns: boolean
                           },
"is_project_participant":
{ Args: { "p_project": string }; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"join_circle":
{ Args: { "p_circle": string,"p_message"?: string }; Returns: string
                           },
"log_moderation":
{ Args: { "p_action": string,"p_id": string,"p_note"?: string,"p_type": string }; Returns: undefined
                           },
"mark_conversation_read":
{ Args: { "p_conversation": string }; Returns: undefined
                           },
"member_card_for":
{ Args: { "p_id": string }; Returns: Database["public"]['CompositeTypes']["member_card"]
                          SetofOptions: {
        from: "*"
        to: "member_card"
        isOneToOne: true
        isSetofReturn: false
      } },
"member_countries":
{ Args: Record<PropertyKey, never>; Returns: {
              "country": string,"members": number
            }[]
                           },
"mod_delete_circle":
{ Args: { "p_circle": string,"p_note"?: string }; Returns: undefined
                           },
"mod_delete_comment":
{ Args: { "p_comment": string,"p_note"?: string }; Returns: undefined
                           },
"mod_delete_message":
{ Args: { "p_message": string,"p_note"?: string }; Returns: undefined
                           },
"mod_delete_post":
{ Args: { "p_note"?: string,"p_post": string }; Returns: undefined
                           },
"mod_delete_project":
{ Args: { "p_note"?: string,"p_project": string }; Returns: undefined
                           },
"mod_reclassify_post":
{ Args: { "p_kind": Database["public"]['Enums']["post_kind"],"p_note"?: string,"p_post": string }; Returns: undefined
                           },
"mod_resolve_report":
{ Args: { "p_note"?: string,"p_report": string,"p_status": Database["public"]['Enums']["report_status"] }; Returns: undefined
                           },
"mod_set_post_flags":
{ Args: { "p_locked": boolean,"p_pinned": boolean,"p_post": string }; Returns: undefined
                           },
"my_conversations":
{ Args: Record<PropertyKey, never>; Returns: {
              "can_write": boolean,"id": string,"last_body": string,"last_message_at": string,"last_sender": string,"other_avatar": string,"other_id": string,"other_name": string,"other_username": string,"unread": number
            }[]
                           },
"my_unread_counts":
{ Args: Record<PropertyKey, never>; Returns: {
              "messages": number,"notifications": number,"requests": number
            }[]
                           },
"notify":
{ Args: { "p_actor": string,"p_body"?: string,"p_circle"?: string,"p_comment"?: string,"p_conversation"?: string,"p_post"?: string,"p_project"?: string,"p_type": Database["public"]['Enums']["notification_type"],"p_user": string }; Returns: undefined
                           },
"notify_mentions":
{ Args: { "p_actor": string,"p_body": string,"p_comment": string,"p_post": string,"p_text": string }; Returns: undefined
                           },
"post_excerpt":
{ Args: { "p_body": string }; Returns: string
                           },
"rate_check":
{ Args: { "p_count": number,"p_max": number,"p_message": string }; Returns: undefined
                           },
"reaction_summary":
{ Args: { "p_post": string }; Returns: {
              "mine": boolean,"target": string,"target_id": string,"total": number,"type": Database["public"]['Enums']["reaction_type"]
            }[]
                           },
"report_target_preview":
{ Args: { "p_report": string }; Returns: {
              "author_id": string,"author_username": string,"body": string,"link": string,"title": string
            }[]
                           },
"require_admin":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"require_staff":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"respond_circle_invite":
{ Args: { "p_accept": boolean,"p_invite": string }; Returns: undefined
                           },
"respond_circle_request":
{ Args: { "p_accept": boolean,"p_request": string }; Returns: undefined
                           },
"respond_project_request":
{ Args: { "p_accept": boolean,"p_request": string }; Returns: undefined
                           },
"search_members":
{ Args: { "p_availability"?: Database["public"]['Enums']["chat_availability"],"p_country"?: string,"p_interests"?: (string)[],"p_limit"?: number,"p_offset"?: number,"p_query"?: string,"p_region"?: string,"p_with_projects"?: boolean }; Returns: Database["public"]['CompositeTypes']["member_card"][]
                          SetofOptions: {
        from: "*"
        to: "member_card"
        isOneToOne: false
        isSetofReturn: true
      } },
"search_posts":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_query": string }; Returns: Database["public"]['CompositeTypes']["post_list_item"][]
                          SetofOptions: {
        from: "*"
        to: "post_list_item"
        isOneToOne: false
        isSetofReturn: true
      } },
"set_circle_role":
{ Args: { "p_circle": string,"p_role": Database["public"]['Enums']["circle_role"],"p_user": string }; Returns: undefined
                           },
"set_my_interests":
{ Args: { "p_favorites"?: (string)[],"p_interests": (string)[] }; Returns: undefined
                           },
"set_post_tags":
{ Args: { "p_post": string,"p_tags": (string)[] }; Returns: undefined
                           },
"slugify":
{ Args: { "p": string }; Returns: string
                           },
"start_conversation":
{ Args: { "p_other": string }; Returns: string
                           },
"trending_tags":
{ Args: { "p_limit"?: number }; Returns: {
              "name": string,"slug": string,"uses": number
            }[]
                           },
"unique_slug":
{ Args: { "p_base": string,"p_table": string }; Returns: string
                           },
"update_post":
{ Args: { "p_body": string,"p_id": string,"p_image_paths": (string)[],"p_is_question": boolean,"p_kind": Database["public"]['Enums']["post_kind"],"p_sources": (string)[],"p_tags": (string)[],"p_title": string }; Returns: undefined
                           },
"user_can_read_post":
{ Args: { "p_post": string,"p_user": string }; Returns: boolean
                           }
          }
          Enums: {
            "account_status": "active"|"suspended"|"banned","chat_availability": "open"|"sometimes"|"closed","circle_role": "owner"|"admin"|"member","circle_visibility": "public"|"private"|"invite","connection_status": "pending"|"accepted"|"declined","notification_type": "comment"|"reply"|"mention"|"connection_request"|"connection_accepted"|"message"|"circle_invite"|"circle_request"|"circle_approved"|"project_request"|"project_approved"|"project_update"|"moderation","post_kind": "documented"|"hypothesis"|"opinion"|"experience","project_role": "owner"|"collaborator","project_status": "idea"|"planning"|"active"|"paused"|"completed","reaction_type": "valuable"|"curious"|"agree"|"needs_sources","report_reason": "spam"|"harassment"|"hate"|"illegal"|"personal_data"|"mislabeled"|"other","report_status": "open"|"resolved"|"dismissed","report_target": "post"|"comment"|"profile"|"message"|"circle"|"project","request_status": "pending"|"accepted"|"declined","user_role": "admin"|"moderator"|"member"|"restricted"
          }
          CompositeTypes: {
            "member_card": {
                        "id": string | null,"username": string | null,"display_name": string | null,"avatar_url": string | null,"bio": string | null,"looking_for": string | null,"country": string | null,"region": string | null,"availability": Database["public"]['Enums']["chat_availability"] | null,"personal_projects": string | null,"shared_count": number | null,"shared_interests": (string)[] | null,"interests": (string)[] | null,"connection": string | null
                      },"post_list_item": {
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
            "account_status": ["active", "suspended", "banned"],"chat_availability": ["open", "sometimes", "closed"],"circle_role": ["owner", "admin", "member"],"circle_visibility": ["public", "private", "invite"],"connection_status": ["pending", "accepted", "declined"],"notification_type": ["comment", "reply", "mention", "connection_request", "connection_accepted", "message", "circle_invite", "circle_request", "circle_approved", "project_request", "project_approved", "project_update", "moderation"],"post_kind": ["documented", "hypothesis", "opinion", "experience"],"project_role": ["owner", "collaborator"],"project_status": ["idea", "planning", "active", "paused", "completed"],"reaction_type": ["valuable", "curious", "agree", "needs_sources"],"report_reason": ["spam", "harassment", "hate", "illegal", "personal_data", "mislabeled", "other"],"report_status": ["open", "resolved", "dismissed"],"report_target": ["post", "comment", "profile", "message", "circle", "project"],"request_status": ["pending", "accepted", "declined"],"user_role": ["admin", "moderator", "member", "restricted"]
          }
        }
} as const
