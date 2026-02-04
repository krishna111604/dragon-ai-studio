export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      call_sheets: {
        Row: {
          call_time: string
          cast_members: Json | null
          created_at: string
          crew_members: Json | null
          id: string
          location: string
          notes: string | null
          project_id: string
          scenes: string[] | null
          shoot_date: string
          updated_at: string
          user_id: string
          weather_notes: string | null
        }
        Insert: {
          call_time: string
          cast_members?: Json | null
          created_at?: string
          crew_members?: Json | null
          id?: string
          location: string
          notes?: string | null
          project_id: string
          scenes?: string[] | null
          shoot_date: string
          updated_at?: string
          user_id: string
          weather_notes?: string | null
        }
        Update: {
          call_time?: string
          cast_members?: Json | null
          created_at?: string
          crew_members?: Json | null
          id?: string
          location?: string
          notes?: string | null
          project_id?: string
          scenes?: string[] | null
          shoot_date?: string
          updated_at?: string
          user_id?: string
          weather_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_sheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_requests: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          project_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          project_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          project_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          category: string
          challenge_date: string
          created_at: string
          description: string
          difficulty: string | null
          id: string
          tips: string[] | null
          title: string
        }
        Insert: {
          category: string
          challenge_date: string
          created_at?: string
          description: string
          difficulty?: string | null
          id?: string
          tips?: string[] | null
          title: string
        }
        Update: {
          category?: string
          challenge_date?: string
          created_at?: string
          description?: string
          difficulty?: string | null
          id?: string
          tips?: string[] | null
          title?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          lessons_learned: string[] | null
          milestones: string[] | null
          mood: string | null
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          lessons_learned?: string[] | null
          milestones?: string[] | null
          mood?: string | null
          project_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          lessons_learned?: string[] | null
          milestones?: string[] | null
          mood?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_boards: {
        Row: {
          color_palette: Json | null
          created_at: string
          generated_images: Json | null
          id: string
          keywords: string[] | null
          mood_description: string | null
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color_palette?: Json | null
          created_at?: string
          generated_images?: Json | null
          id?: string
          keywords?: string[] | null
          mood_description?: string | null
          project_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color_palette?: Json | null
          created_at?: string
          generated_images?: Json | null
          id?: string
          keywords?: string[] | null
          mood_description?: string | null
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_boards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          experience_level: string | null
          id: string
          preferred_genres: string[] | null
          preferred_styles: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          experience_level?: string | null
          id?: string
          preferred_genres?: string[] | null
          preferred_styles?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          experience_level?: string | null
          id?: string
          preferred_genres?: string[] | null
          preferred_styles?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_budgets: {
        Row: {
          created_at: string
          id: string
          line_items: Json | null
          notes: string | null
          project_id: string
          total_estimate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_items?: Json | null
          notes?: string | null
          project_id: string
          total_estimate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          line_items?: Json | null
          notes?: string | null
          project_id?: string
          total_estimate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_characters: {
        Row: {
          appearance_details: string | null
          created_at: string
          description: string
          id: string
          name: string
          project_id: string
          reference_image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appearance_details?: string | null
          created_at?: string
          description: string
          id?: string
          name: string
          project_id: string
          reference_image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appearance_details?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          project_id?: string
          reference_image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_characters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_collaborators: {
        Row: {
          created_at: string
          cursor_position: Json | null
          id: string
          last_active_at: string | null
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cursor_position?: Json | null
          id?: string
          last_active_at?: string | null
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cursor_position?: Json | null
          id?: string
          last_active_at?: string | null
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_insights: {
        Row: {
          content: Json
          created_at: string
          id: string
          insight_type: string
          is_saved: boolean | null
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          insight_type: string
          is_saved?: boolean | null
          project_id: string
          title: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          insight_type?: string
          is_saved?: boolean | null
          project_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          id: string
          project_id: string
          scene_description: string | null
          script_content: string | null
          user_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          id?: string
          project_id: string
          scene_description?: string | null
          script_content?: string | null
          user_id: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          id?: string
          project_id?: string
          scene_description?: string | null
          script_content?: string | null
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          genre: string | null
          id: string
          name: string
          project_code: string | null
          scene_description: string | null
          script_content: string | null
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          genre?: string | null
          id?: string
          name: string
          project_code?: string | null
          scene_description?: string | null
          script_content?: string | null
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          genre?: string | null
          id?: string
          name?: string
          project_code?: string | null
          scene_description?: string | null
          script_content?: string | null
          target_audience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scene_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          mood: string | null
          project_id: string
          prompt: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type: string
          media_url: string
          mood?: string | null
          project_id: string
          prompt: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          mood?: string | null
          project_id?: string
          prompt?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scene_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      shot_lists: {
        Row: {
          created_at: string
          id: string
          project_id: string
          scene_name: string
          shots: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          scene_name: string
          shots?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          scene_name?: string
          shots?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shot_lists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_project_by_code: {
        Args: { p_code: string }
        Returns: {
          id: string
          name: string
          user_id: string
        }[]
      }
      is_project_collaborator: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      is_project_editor: { Args: { p_project_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
