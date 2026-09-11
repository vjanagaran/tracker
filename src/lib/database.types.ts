// Regenerated from the project schema. Re-run after `supabase login`:
// npx supabase gen types typescript --linked > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      action_plans: {
        Row: {
          challenge: string | null
          created_at: string
          description: string
          focus_area_id: string
          id: string
          sort_order: number
          status: Database["public"]["Enums"]["plan_status"]
        }
        Insert: {
          challenge?: string | null
          created_at?: string
          description: string
          focus_area_id: string
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["plan_status"]
        }
        Update: {
          challenge?: string | null
          created_at?: string
          description?: string
          focus_area_id?: string
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["plan_status"]
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_focus_area_id_fkey"
            columns: ["focus_area_id"]
            isOneToOne: false
            referencedRelation: "focus_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      board_members: {
        Row: {
          board_id: string
          id: string
          joined_on: string
          left_on: string | null
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_state"]
          user_id: string
        }
        Insert: {
          board_id: string
          id?: string
          joined_on?: string
          left_on?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_state"]
          user_id: string
        }
        Update: {
          board_id?: string
          id?: string
          joined_on?: string
          left_on?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_state"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_members_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          cadence_days: number
          created_at: string
          created_by: string
          description: string | null
          id: string
          meeting_weekday: number | null
          name: string
        }
        Insert: {
          cadence_days?: number
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          meeting_weekday?: number | null
          name: string
        }
        Update: {
          cadence_days?: number
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          meeting_weekday?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_areas: {
        Row: {
          created_at: string
          current_issue: string
          goal_1y: string | null
          goal_5y: string | null
          id: string
          sort_order: number
          spoke_id: string
        }
        Insert: {
          created_at?: string
          current_issue: string
          goal_1y?: string | null
          goal_5y?: string | null
          id?: string
          sort_order?: number
          spoke_id: string
        }
        Update: {
          created_at?: string
          current_issue?: string
          goal_1y?: string | null
          goal_5y?: string | null
          id?: string
          sort_order?: number
          spoke_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_areas_spoke_id_fkey"
            columns: ["spoke_id"]
            isOneToOne: false
            referencedRelation: "spokes"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string | null
          board_id: string
          created_at: string
          id: string
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["meeting_status"]
        }
        Insert: {
          agenda?: string | null
          board_id: string
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["meeting_status"]
        }
        Update: {
          agenda?: string | null
          board_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["meeting_status"]
        }
        Relationships: [
          {
            foreignKeyName: "meetings_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_superadmin: boolean
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          is_superadmin?: boolean
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_superadmin?: boolean
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      spoke_scores: {
        Row: {
          cycle_id: string
          score_now: number | null
          spoke_id: string
          target_1y: number | null
          target_5y: number | null
        }
        Insert: {
          cycle_id: string
          score_now?: number | null
          spoke_id: string
          target_1y?: number | null
          target_5y?: number | null
        }
        Update: {
          cycle_id?: string
          score_now?: number | null
          spoke_id?: string
          target_1y?: number | null
          target_5y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spoke_scores_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "wheel_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spoke_scores_spoke_id_fkey"
            columns: ["spoke_id"]
            isOneToOne: false
            referencedRelation: "spokes"
            referencedColumns: ["id"]
          },
        ]
      }
      spokes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_predefined: boolean
          name: string
          sort_order: number
          wheel_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_predefined?: boolean
          name: string
          sort_order?: number
          wheel_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_predefined?: boolean
          name?: string
          sort_order?: number
          wheel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spokes_wheel_id_fkey"
            columns: ["wheel_id"]
            isOneToOne: false
            referencedRelation: "wheels"
            referencedColumns: ["id"]
          },
        ]
      }
      task_action_plans: {
        Row: {
          action_plan_id: string
          task_id: string
        }
        Insert: {
          action_plan_id: string
          task_id: string
        }
        Update: {
          action_plan_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_action_plans_action_plan_id_fkey"
            columns: ["action_plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_action_plans_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_notes: {
        Row: {
          created_at: string
          id: string
          note: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_on: string | null
          created_at: string
          id: string
          planned_start_on: string | null
          status: Database["public"]["Enums"]["task_status"]
          tag: Database["public"]["Enums"]["task_tag"] | null
          target_on: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_on?: string | null
          created_at?: string
          id?: string
          planned_start_on?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tag?: Database["public"]["Enums"]["task_tag"] | null
          target_on?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_on?: string | null
          created_at?: string
          id?: string
          planned_start_on?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tag?: Database["public"]["Enums"]["task_tag"] | null
          target_on?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wheel_cycles: {
        Row: {
          created_at: string
          id: string
          period: string
          updated_at: string
          wheel_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period: string
          updated_at?: string
          wheel_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period?: string
          updated_at?: string
          wheel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wheel_cycles_wheel_id_fkey"
            columns: ["wheel_id"]
            isOneToOne: false
            referencedRelation: "wheels"
            referencedColumns: ["id"]
          },
        ]
      }
      wheels: {
        Row: {
          created_at: string
          id: string
          type: Database["public"]["Enums"]["wheel_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          type: Database["public"]["Enums"]["wheel_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["wheel_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wheels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wol_spoke_templates: {
        Row: {
          name: string
          sort_order: number
        }
        Insert: {
          name: string
          sort_order: number
        }
        Update: {
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      board_velocity: {
        Args: { p_board_id: string; p_from: string; p_to: string }
        Returns: {
          completed_count: number
          full_name: string
          open_count: number
          user_id: string
        }[]
      }
      create_wheel_cycle: {
        Args: { p_period: string; p_wheel_id: string }
        Returns: string
      }
      is_board_chairman: {
        Args: { p_board_id: string }
        Returns: boolean
      }
      is_board_member: {
        Args: { p_board_id: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      meeting_window: {
        Args: { p_meeting_id: string }
        Returns: {
          window_from: string
          window_to: string
        }[]
      }
      owns_cycle: {
        Args: { p_cycle_id: string }
        Returns: boolean
      }
      owns_focus_area: {
        Args: { p_focus_area_id: string }
        Returns: boolean
      }
      owns_spoke: {
        Args: { p_spoke_id: string }
        Returns: boolean
      }
      owns_task: {
        Args: { p_task_id: string }
        Returns: boolean
      }
      owns_wheel: {
        Args: { p_wheel_id: string }
        Returns: boolean
      }
      shares_board_with: {
        Args: { p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      meeting_status: "Scheduled" | "Completed" | "Cancelled"
      member_role: "chairman" | "director"
      member_state: "active" | "inactive"
      plan_status: "Active" | "Completed" | "Dropped"
      task_status:
        | "Not Started"
        | "Work in Progress"
        | "Completed"
        | "Postponed"
        | "Hold Now"
        | "Cancelled"
      task_tag: "WOL" | "WOB" | "OPEN"
      wheel_type: "WOL" | "WOB"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
