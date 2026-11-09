
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
                    "created_at": string,"description": string,"forum_slug": string,"is_archived": boolean,"name": string,"position": number,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string,"forum_slug": string,"is_archived"?: boolean,"name": string,"position"?: number,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"forum_slug"?: string,"is_archived"?: boolean,"name"?: string,"position"?: number,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_forum_slug_fkey"
      columns: ["forum_slug"]
isOneToOne: false
      referencedRelation: "forums"
      referencedColumns: ["slug"]
    }
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
                },"forums": {
                  Row: {
                    "created_at": string,"description": string,"is_archived": boolean,"name": string,"position": number,"rules": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string,"is_archived"?: boolean,"name": string,"position"?: number,"rules"?: string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"is_archived"?: boolean,"name"?: string,"position"?: number,"rules"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"interest_areas": {
                  Row: {
                    "description": string,"name": string,"position": number,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string,"name": string,"position"?: number,"slug": string
                  }
                  Update: {
                    "description"?: string,"name"?: string,"position"?: number,"slug"?: string
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
                },"poll_options": {
                  Row: {
                    "id": number,"label": string,"position": number,"post_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"label": string,"position": number,"post_id": string
                  }
                  Update: {
                    "id"?: never,"label"?: string,"position"?: number,"post_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "poll_options_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "polls"
      referencedColumns: ["post_id"]
    }
                  ]
                },"poll_votes": {
                  Row: {
                    "created_at": string,"option_id": number,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"option_id": number,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"option_id"?: number,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "poll_votes_option_id_fkey"
      columns: ["option_id"]
isOneToOne: false
      referencedRelation: "poll_options"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "poll_votes_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "polls"
      referencedColumns: ["post_id"]
    },{
      foreignKeyName: "poll_votes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"polls": {
                  Row: {
                    "closes_at": string | null,"created_at": string,"multiple": boolean,"post_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "closes_at"?: string | null,"created_at"?: string,"multiple"?: boolean,"post_id": string
                  }
                  Update: {
                    "closes_at"?: string | null,"created_at"?: string,"multiple"?: boolean,"post_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "polls_post_id_fkey"
      columns: ["post_id"]
isOneToOne: true
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"post_attachments": {
                  Row: {
                    "author_id": string,"created_at": string,"id": string,"mime": string,"name": string,"path": string,"post_id": string,"size": number
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"created_at"?: string,"id"?: string,"mime": string,"name": string,"path": string,"post_id": string,"size": number
                  }
                  Update: {
                    "author_id"?: string,"created_at"?: string,"id"?: string,"mime"?: string,"name"?: string,"path"?: string,"post_id"?: string,"size"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_attachments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_attachments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
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
                    "author_id": string,"body": string,"category_slug": string | null,"circle_id": string | null,"comment_count": number,"created_at": string,"deleted_at": string | null,"deleted_by": string | null,"edited_at": string | null,"forum_slug": string | null,"id": string,"image_paths": (string)[],"is_locked": boolean,"is_pinned": boolean,"is_question": boolean,"kind": Database["public"]['Enums']["post_kind"],"last_activity_at": string,"post_type": Database["public"]['Enums']["post_type"],"reaction_count": number,"search": unknown,"sources": (string)[],"title": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"category_slug"?: string | null,"circle_id"?: string | null,"comment_count"?: number,"created_at"?: string,"deleted_at"?: string | null,"deleted_by"?: string | null,"edited_at"?: string | null,"forum_slug"?: string | null,"id"?: string,"image_paths"?: (string)[],"is_locked"?: boolean,"is_pinned"?: boolean,"is_question"?: boolean,"kind"?: Database["public"]['Enums']["post_kind"],"last_activity_at"?: string,"post_type"?: Database["public"]['Enums']["post_type"],"reaction_count"?: number,"search"?: never,"sources"?: (string)[],"title"?: string | null
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"category_slug"?: string | null,"circle_id"?: string | null,"comment_count"?: number,"created_at"?: string,"deleted_at"?: string | null,"deleted_by"?: string | null,"edited_at"?: string | null,"forum_slug"?: string | null,"id"?: string,"image_paths"?: (string)[],"is_locked"?: boolean,"is_pinned"?: boolean,"is_question"?: boolean,"kind"?: Database["public"]['Enums']["post_kind"],"last_activity_at"?: string,"post_type"?: Database["public"]['Enums']["post_type"],"reaction_count"?: number,"search"?: never,"sources"?: (string)[],"title"?: string | null
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
    },{
      foreignKeyName: "posts_forum_slug_fkey"
      columns: ["forum_slug"]
isOneToOne: false
      referencedRelation: "forums"
      referencedColumns: ["slug"]
    }
                  ]
                },"profile_goals": {
                  Row: {
                    "goal": Database["public"]['Enums']["user_goal"],"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "goal": Database["public"]['Enums']["user_goal"],"profile_id": string
                  }
                  Update: {
                    "goal"?: Database["public"]['Enums']["user_goal"],"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_goals_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_privacy": {
                  Row: {
                    "about": Database["public"]['Enums']["visibility"],"activity": Database["public"]['Enums']["visibility"],"interests": Database["public"]['Enums']["visibility"],"location": Database["public"]['Enums']["visibility"],"network": Database["public"]['Enums']["visibility"],"profile_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "about"?: Database["public"]['Enums']["visibility"],"activity"?: Database["public"]['Enums']["visibility"],"interests"?: Database["public"]['Enums']["visibility"],"location"?: Database["public"]['Enums']["visibility"],"network"?: Database["public"]['Enums']["visibility"],"profile_id": string,"updated_at"?: string
                  }
                  Update: {
                    "about"?: Database["public"]['Enums']["visibility"],"activity"?: Database["public"]['Enums']["visibility"],"interests"?: Database["public"]['Enums']["visibility"],"location"?: Database["public"]['Enums']["visibility"],"network"?: Database["public"]['Enums']["visibility"],"profile_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_privacy_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_topics": {
                  Row: {
                    "created_at": string,"is_primary": boolean,"profile_id": string,"relation": Database["public"]['Enums']["topic_relation"],"topic_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"is_primary"?: boolean,"profile_id": string,"relation"?: Database["public"]['Enums']["topic_relation"],"topic_id": number
                  }
                  Update: {
                    "created_at"?: string,"is_primary"?: boolean,"profile_id"?: string,"relation"?: Database["public"]['Enums']["topic_relation"],"topic_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_topics_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_topics_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "availability": Database["public"]['Enums']["chat_availability"],"avatar_url": string | null,"bio": string,"can_offer": string,"country": string | null,"cover_path": string | null,"created_at": string,"display_name": string | null,"exploring": string,"id": string,"languages": (string)[],"last_seen_at": string | null,"looking_for": string,"onboarded_at": string | null,"personal_projects": string,"region": string | null,"role": Database["public"]['Enums']["user_role"],"skills": (string)[],"status": Database["public"]['Enums']["account_status"],"updated_at": string,"username": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "availability"?: Database["public"]['Enums']["chat_availability"],"avatar_url"?: string | null,"bio"?: string,"can_offer"?: string,"country"?: string | null,"cover_path"?: string | null,"created_at"?: string,"display_name"?: string | null,"exploring"?: string,"id": string,"languages"?: (string)[],"last_seen_at"?: string | null,"looking_for"?: string,"onboarded_at"?: string | null,"personal_projects"?: string,"region"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"skills"?: (string)[],"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string,"username"?: string | null
                  }
                  Update: {
                    "availability"?: Database["public"]['Enums']["chat_availability"],"avatar_url"?: string | null,"bio"?: string,"can_offer"?: string,"country"?: string | null,"cover_path"?: string | null,"created_at"?: string,"display_name"?: string | null,"exploring"?: string,"id"?: string,"languages"?: (string)[],"last_seen_at"?: string | null,"looking_for"?: string,"onboarded_at"?: string | null,"personal_projects"?: string,"region"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"skills"?: (string)[],"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string,"username"?: string | null
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
                },"project_topics": {
                  Row: {
                    "kind": Database["public"]['Enums']["project_topic_kind"],"project_id": string,"topic_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "kind"?: Database["public"]['Enums']["project_topic_kind"],"project_id": string,"topic_id": number
                  }
                  Update: {
                    "kind"?: Database["public"]['Enums']["project_topic_kind"],"project_id"?: string,"topic_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_topics_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_topics_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "area_slug": string | null,"country": string | null,"cover_path": string | null,"created_at": string,"description": string,"id": string,"last_activity_at": string,"objectives": (string)[],"owner_id": string,"participant_count": number,"region": string | null,"seeking": string,"slug": string,"status": Database["public"]['Enums']["project_status"],"summary": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "area_slug"?: string | null,"country"?: string | null,"cover_path"?: string | null,"created_at"?: string,"description"?: string,"id"?: string,"last_activity_at"?: string,"objectives"?: (string)[],"owner_id": string,"participant_count"?: number,"region"?: string | null,"seeking"?: string,"slug": string,"status"?: Database["public"]['Enums']["project_status"],"summary"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "area_slug"?: string | null,"country"?: string | null,"cover_path"?: string | null,"created_at"?: string,"description"?: string,"id"?: string,"last_activity_at"?: string,"objectives"?: (string)[],"owner_id"?: string,"participant_count"?: number,"region"?: string | null,"seeking"?: string,"slug"?: string,"status"?: Database["public"]['Enums']["project_status"],"summary"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_area_slug_fkey"
      columns: ["area_slug"]
isOneToOne: false
      referencedRelation: "interest_areas"
      referencedColumns: ["slug"]
    },{
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
                    "created_at": string,"created_by": string | null,"merged_into": string | null,"name": string,"slug": string,"status": string,"topic_id": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"merged_into"?: string | null,"name": string,"slug": string,"status"?: string,"topic_id"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"merged_into"?: string | null,"name"?: string,"slug"?: string,"status"?: string,"topic_id"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "tags_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tags_merged_into_fkey"
      columns: ["merged_into"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "tags_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"topic_areas": {
                  Row: {
                    "area_slug": string,"topic_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "area_slug": string,"topic_id": number
                  }
                  Update: {
                    "area_slug"?: string,"topic_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "topic_areas_area_slug_fkey"
      columns: ["area_slug"]
isOneToOne: false
      referencedRelation: "interest_areas"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "topic_areas_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"topic_synonyms": {
                  Row: {
                    "term": string,"topic_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "term": string,"topic_id": number
                  }
                  Update: {
                    "term"?: string,"topic_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "topic_synonyms_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"topics": {
                  Row: {
                    "area_slug": string,"created_at": string,"id": number,"merged_into": number | null,"name": string,"proposed_by": string | null,"slug": string,"status": Database["public"]['Enums']["topic_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "area_slug": string,"created_at"?: string,"id"?: never,"merged_into"?: number | null,"name": string,"proposed_by"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["topic_status"]
                  }
                  Update: {
                    "area_slug"?: string,"created_at"?: string,"id"?: never,"merged_into"?: number | null,"name"?: string,"proposed_by"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["topic_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "topics_area_slug_fkey"
      columns: ["area_slug"]
isOneToOne: false
      referencedRelation: "interest_areas"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "topics_merged_into_fkey"
      columns: ["merged_into"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "topics_proposed_by_fkey"
      columns: ["proposed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_settings": {
                  Row: {
                    "profile_id": string,"read_receipts": boolean,"updated_at": string,"who_can_message": string
                  }
                  ComputedFields: never
                  Insert: {
                    "profile_id": string,"read_receipts"?: boolean,"updated_at"?: string,"who_can_message"?: string
                  }
                  Update: {
                    "profile_id"?: string,"read_receipts"?: boolean,"updated_at"?: string,"who_can_message"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_settings_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
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
            "admin_add_synonym":
{ Args: { "p_term": string,"p_topic": number }; Returns: undefined
                           },
"admin_list_members":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_query"?: string,"p_role"?: Database["public"]['Enums']["user_role"],"p_status"?: Database["public"]['Enums']["account_status"] }; Returns: {
              "avatar_url": string,"created_at": string,"display_name": string,"email": string,"id": string,"onboarded_at": string,"posts": number,"reports_against": number,"role": Database["public"]['Enums']["user_role"],"status": Database["public"]['Enums']["account_status"],"username": string
            }[]
                           },
"admin_merge_tags":
{ Args: { "p_from": string,"p_into": string }; Returns: undefined
                           },
"admin_merge_topics":
{ Args: { "p_from": number,"p_into": number }; Returns: undefined
                           },
"admin_review_topic":
{ Args: { "p_approve": boolean,"p_area"?: string,"p_topic": number }; Returns: undefined
                           },
"admin_save_category":
{ Args: { "p_archived": boolean,"p_description": string,"p_forum": string,"p_name": string,"p_position": number,"p_slug": string }; Returns: undefined
                           },
"admin_save_forum":
{ Args: { "p_archived": boolean,"p_description": string,"p_name": string,"p_position": number,"p_rules": string,"p_slug": string }; Returns: undefined
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
"admin_tag_list":
{ Args: { "p_limit"?: number,"p_query"?: string }; Returns: {
              "created_at": string,"merged_into": string,"name": string,"slug": string,"status": string,"topic_id": number,"topic_name": string,"uses": number
            }[]
                           },
"admin_update_settings":
{ Args: { "p_registration_open": boolean,"p_welcome": string }; Returns: undefined
                           },
"admin_update_tag":
{ Args: { "p_name": string,"p_slug": string,"p_status": string,"p_topic"?: number }; Returns: undefined
                           },
"affinity_members":
{ Args: { "p_limit"?: number }; Returns: Database["public"]['CompositeTypes']["member_card"][]
                          SetofOptions: {
        from: "*"
        to: "member_card"
        isOneToOne: false
        isSetofReturn: true
      } },
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
"close_poll":
{ Args: { "p_post": string }; Returns: undefined
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
{ Args: { "p_body": string,"p_category"?: string,"p_circle"?: string,"p_forum"?: string,"p_image_paths"?: (string)[],"p_kind": Database["public"]['Enums']["post_kind"],"p_poll_closes"?: string,"p_poll_multiple"?: boolean,"p_poll_options"?: (string)[],"p_sources"?: (string)[],"p_tags"?: (string)[],"p_title": string,"p_type"?: Database["public"]['Enums']["post_type"] }; Returns: string
                           },
"create_project":
{ Args: { "p_area"?: string,"p_country": string,"p_cover_path"?: string,"p_description": string,"p_objectives": (string)[],"p_region": string,"p_seeking": string,"p_skills"?: (number)[],"p_status": Database["public"]['Enums']["project_status"],"p_summary": string,"p_title": string,"p_topics"?: (number)[] }; Returns: string
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
{ Args: { "p_author"?: string,"p_category"?: string,"p_circle"?: string,"p_forum"?: string,"p_kind"?: Database["public"]['Enums']["post_kind"],"p_limit"?: number,"p_offset"?: number,"p_saved_only"?: boolean,"p_scope"?: string,"p_sort"?: string,"p_tag"?: string,"p_type"?: Database["public"]['Enums']["post_type"],"p_unanswered"?: boolean }; Returns: Database["public"]['CompositeTypes']["post_list_item"][]
                          SetofOptions: {
        from: "*"
        to: "post_list_item"
        isOneToOne: false
        isSetofReturn: true
      } },
"forum_stats":
{ Args: Record<PropertyKey, never>; Returns: {
              "category_slug": string,"forum_slug": string,"last_activity_at": string,"post_count": number,"unanswered": number
            }[]
                           },
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
"my_profile":
{ Args: Record<PropertyKey, never>; Returns: {
              "availability": Database["public"]['Enums']["chat_availability"],
"avatar_url": string | null,
"bio": string,
"can_offer": string,
"country": string | null,
"cover_path": string | null,
"created_at": string,
"display_name": string | null,
"exploring": string,
"id": string,
"languages": (string)[],
"last_seen_at": string | null,
"looking_for": string,
"onboarded_at": string | null,
"personal_projects": string,
"region": string | null,
"role": Database["public"]['Enums']["user_role"],
"skills": (string)[],
"status": Database["public"]['Enums']["account_status"],
"updated_at": string,
"username": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: false
        isSetofReturn: true
      } },
"my_unread_counts":
{ Args: Record<PropertyKey, never>; Returns: {
              "messages": number,"notifications": number,"requests": number
            }[]
                           },
"new_members":
{ Args: { "p_limit"?: number }; Returns: Database["public"]['CompositeTypes']["member_card"][]
                          SetofOptions: {
        from: "*"
        to: "member_card"
        isOneToOne: false
        isSetofReturn: true
      } },
"notify":
{ Args: { "p_actor": string,"p_body"?: string,"p_circle"?: string,"p_comment"?: string,"p_conversation"?: string,"p_post"?: string,"p_project"?: string,"p_type": Database["public"]['Enums']["notification_type"],"p_user": string }; Returns: undefined
                           },
"notify_mentions":
{ Args: { "p_actor": string,"p_body": string,"p_comment": string,"p_post": string,"p_text": string }; Returns: undefined
                           },
"poll_results":
{ Args: { "p_post": string }; Returns: {
              "closed": boolean,"closes_at": string,"label": string,"mine": boolean,"multiple": boolean,"option_id": number,"pos": number,"voters": number,"votes": number
            }[]
                           },
"post_excerpt":
{ Args: { "p_body": string }; Returns: string
                           },
"profile_goals_for":
{ Args: { "p_profile": string }; Returns: Database["public"]['Enums']["user_goal"][]
                           },
"profile_section_visible":
{ Args: { "p_owner": string,"p_section": string }; Returns: boolean
                           },
"profile_topics_for":
{ Args: { "p_profile": string }; Returns: {
              "area_name": string,"area_slug": string,"is_primary": boolean,"name": string,"relation": Database["public"]['Enums']["topic_relation"],"slug": string,"topic_id": number
            }[]
                           },
"profile_view":
{ Args: { "p_username": string }; Returns: {
              "about_visible": boolean,"activity_visible": boolean,"availability": Database["public"]['Enums']["chat_availability"],"avatar_url": string,"bio": string,"can_offer": string,"connection": string,"connections_count": number,"country": string,"cover_path": string,"created_at": string,"display_name": string,"exploring": string,"id": string,"interests_visible": boolean,"languages": (string)[],"looking_for": string,"network_visible": boolean,"personal_projects": string,"region": string,"skills": (string)[],"username": string
            }[]
                           },
"propose_topic":
{ Args: { "p_area": string,"p_name": string }; Returns: number
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
{ Args: { "p_areas"?: (string)[],"p_availability"?: Database["public"]['Enums']["chat_availability"],"p_country"?: string,"p_goals"?: (Database["public"]['Enums']["user_goal"])[],"p_in_my_circles"?: boolean,"p_languages"?: (string)[],"p_limit"?: number,"p_offset"?: number,"p_query"?: string,"p_region"?: string,"p_relation"?: Database["public"]['Enums']["topic_relation"],"p_topics"?: (number)[],"p_with_projects"?: boolean }; Returns: Database["public"]['CompositeTypes']["member_card"][]
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
"search_topics":
{ Args: { "p_limit"?: number,"p_query": string }; Returns: {
              "area_name": string,"area_slug": string,"id": number,"name": string,"slug": string,"status": Database["public"]['Enums']["topic_status"],"via": string
            }[]
                           },
"set_circle_role":
{ Args: { "p_circle": string,"p_role": Database["public"]['Enums']["circle_role"],"p_user": string }; Returns: undefined
                           },
"set_my_goals":
{ Args: { "p_goals": (Database["public"]['Enums']["user_goal"])[] }; Returns: undefined
                           },
"set_my_topics":
{ Args: { "p_items": Json }; Returns: undefined
                           },
"set_post_poll":
{ Args: { "p_closes": string,"p_multiple": boolean,"p_options": (string)[],"p_post": string }; Returns: undefined
                           },
"set_post_tags":
{ Args: { "p_post": string,"p_tags": (string)[] }; Returns: undefined
                           },
"set_project_topics":
{ Args: { "p_project": string,"p_skills": (number)[],"p_topics": (number)[] }; Returns: undefined
                           },
"slugify":
{ Args: { "p": string }; Returns: string
                           },
"start_conversation":
{ Args: { "p_other": string }; Returns: string
                           },
"suggest_tags":
{ Args: { "p_limit"?: number,"p_query": string }; Returns: {
              "name": string,"slug": string,"source": string,"uses": number
            }[]
                           },
"touch_last_seen":
{ Args: Record<PropertyKey, never>; Returns: undefined
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
{ Args: { "p_body": string,"p_category": string,"p_id": string,"p_image_paths": (string)[],"p_kind": Database["public"]['Enums']["post_kind"],"p_sources": (string)[],"p_tags": (string)[],"p_title": string,"p_type": Database["public"]['Enums']["post_type"] }; Returns: undefined
                           },
"user_can_read_post":
{ Args: { "p_post": string,"p_user": string }; Returns: boolean
                           },
"vote_poll":
{ Args: { "p_options": (number)[],"p_post": string }; Returns: undefined
                           }
          }
          Enums: {
            "account_status": "active"|"suspended"|"banned","chat_availability": "open"|"sometimes"|"closed","circle_role": "owner"|"admin"|"member","circle_visibility": "public"|"private"|"invite","connection_status": "pending"|"accepted"|"declined","notification_type": "comment"|"reply"|"mention"|"connection_request"|"connection_accepted"|"message"|"circle_invite"|"circle_request"|"circle_approved"|"project_request"|"project_approved"|"project_update"|"moderation","post_kind": "documented"|"hypothesis"|"opinion"|"experience"|"interpretation"|"open_question","post_type": "debate"|"question"|"research"|"discovery"|"experience"|"resource"|"poll"|"idea","project_role": "owner"|"collaborator","project_status": "idea"|"planning"|"active"|"paused"|"completed","project_topic_kind": "theme"|"skill","reaction_type": "valuable"|"curious"|"agree"|"needs_sources","report_reason": "spam"|"harassment"|"hate"|"illegal"|"personal_data"|"mislabeled"|"other","report_status": "open"|"resolved"|"dismissed","report_target": "post"|"comment"|"profile"|"message"|"circle"|"project","request_status": "pending"|"accepted"|"declined","topic_relation": "interested"|"learning"|"knowledgeable"|"experienced"|"can_teach"|"seeking_collaborators","topic_status": "approved"|"pending"|"rejected","user_goal": "learn"|"research"|"debate"|"share"|"meet_people"|"friendship"|"find_collaborators"|"join_projects"|"create_circles"|"join_communities"|"organize_meetups"|"share_experiences","user_role": "admin"|"moderator"|"member"|"restricted","visibility": "public"|"connections"|"private"
          }
          CompositeTypes: {
            "member_card": {
                        "id": string | null,"username": string | null,"display_name": string | null,"avatar_url": string | null,"bio": string | null,"looking_for": string | null,"country": string | null,"region": string | null,"availability": Database["public"]['Enums']["chat_availability"] | null,"languages": (string)[] | null,"shared_count": number | null,"shared_topics": (string)[] | null,"topics": (string)[] | null,"reasons": (string)[] | null,"connection": string | null
                      },"post_list_item": {
                        "id": string | null,"title": string | null,"excerpt": string | null,"kind": Database["public"]['Enums']["post_kind"] | null,"is_question": boolean | null,"category_slug": string | null,"category_name": string | null,"circle_id": string | null,"author_id": string | null,"author_username": string | null,"author_name": string | null,"author_avatar": string | null,"tags": (string)[] | null,"comment_count": number | null,"reaction_count": number | null,"image_count": number | null,"is_pinned": boolean | null,"is_locked": boolean | null,"created_at": string | null,"last_activity_at": string | null,"forum_slug": string | null,"forum_name": string | null,"post_type": Database["public"]['Enums']["post_type"] | null,"has_poll": boolean | null,"attachment_count": number | null
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
            "account_status": ["active", "suspended", "banned"],"chat_availability": ["open", "sometimes", "closed"],"circle_role": ["owner", "admin", "member"],"circle_visibility": ["public", "private", "invite"],"connection_status": ["pending", "accepted", "declined"],"notification_type": ["comment", "reply", "mention", "connection_request", "connection_accepted", "message", "circle_invite", "circle_request", "circle_approved", "project_request", "project_approved", "project_update", "moderation"],"post_kind": ["documented", "hypothesis", "opinion", "experience", "interpretation", "open_question"],"post_type": ["debate", "question", "research", "discovery", "experience", "resource", "poll", "idea"],"project_role": ["owner", "collaborator"],"project_status": ["idea", "planning", "active", "paused", "completed"],"project_topic_kind": ["theme", "skill"],"reaction_type": ["valuable", "curious", "agree", "needs_sources"],"report_reason": ["spam", "harassment", "hate", "illegal", "personal_data", "mislabeled", "other"],"report_status": ["open", "resolved", "dismissed"],"report_target": ["post", "comment", "profile", "message", "circle", "project"],"request_status": ["pending", "accepted", "declined"],"topic_relation": ["interested", "learning", "knowledgeable", "experienced", "can_teach", "seeking_collaborators"],"topic_status": ["approved", "pending", "rejected"],"user_goal": ["learn", "research", "debate", "share", "meet_people", "friendship", "find_collaborators", "join_projects", "create_circles", "join_communities", "organize_meetups", "share_experiences"],"user_role": ["admin", "moderator", "member", "restricted"],"visibility": ["public", "connections", "private"]
          }
        }
} as const
