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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          admin_email: string | null
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      admin_login_logs: {
        Row: {
          action_type: string
          email: string
          id: string
          logged_in_at: string
          user_id: string
        }
        Insert: {
          action_type?: string
          email: string
          id?: string
          logged_in_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          email?: string
          id?: string
          logged_in_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          email: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_active_at: string
          logged_out_at: string | null
          login_at: string
          logout_reason: string | null
          role: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          email: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_active_at?: string
          logged_out_at?: string | null
          login_at?: string
          logout_reason?: string | null
          role?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          email?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_active_at?: string
          logged_out_at?: string | null
          login_at?: string
          logout_reason?: string | null
          role?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          event_id: string
          event_website_url: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
        }
        Insert: {
          api_key?: string
          created_at?: string
          event_id: string
          event_website_url?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string
          event_id?: string
          event_website_url?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_contacts: {
        Row: {
          created_at: string | null
          display_order: number | null
          email: string | null
          event_id: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string
          role: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone: string
          role?: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_contacts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question_pattern: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question_pattern: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question_pattern?: string
        }
        Relationships: []
      }
      college_scores: {
        Row: {
          category: string
          college_name: string
          event_id: string
          event_name: string
          id: string
          points: number
          position: string | null
          team_name: string | null
          updated_at: string
        }
        Insert: {
          category: string
          college_name: string
          event_id: string
          event_name: string
          id?: string
          points?: number
          position?: string | null
          team_name?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          college_name?: string
          event_id?: string
          event_name?: string
          id?: string
          points?: number
          position?: string | null
          team_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_scores_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          affiliated_university: string | null
          approval_status: string
          city: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          short_name: string | null
          source: string
          state: string | null
          website_url: string | null
        }
        Insert: {
          affiliated_university?: string | null
          approval_status?: string
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          short_name?: string | null
          source?: string
          state?: string | null
          website_url?: string | null
        }
        Update: {
          affiliated_university?: string | null
          approval_status?: string
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          short_name?: string | null
          source?: string
          state?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      event_updates: {
        Row: {
          api_key_id: string
          created_at: string
          event_id: string
          id: string
          payload: Json
          sync_status: string
          update_type: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          event_id: string
          id?: string
          payload?: Json
          sync_status?: string
          update_type: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          event_id?: string
          id?: string
          payload?: Json
          sync_status?: string
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_updates_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_updates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string
          date: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          prize_pool: string | null
          rules: string[] | null
          slug: string
          team_size_max: number
          team_size_min: number
          time: string | null
          venue: string | null
          website_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          date?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          prize_pool?: string | null
          rules?: string[] | null
          slug: string
          team_size_max?: number
          team_size_min?: number
          time?: string | null
          venue?: string | null
          website_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          date?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          prize_pool?: string | null
          rules?: string[] | null
          slug?: string
          team_size_max?: number
          team_size_min?: number
          time?: string | null
          venue?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          amount_paid: string | null
          college_id: string | null
          college_name: string
          created_at: string
          event_id: string
          id: string
          leader_email: string
          leader_name: string
          leader_phone: string
          members: Json | null
          payment_screenshot_url: string | null
          registration_status: string
          semester: string | null
          source: string
          team_name: string | null
          transaction_id: string | null
          utr_number: string | null
        }
        Insert: {
          amount_paid?: string | null
          college_id?: string | null
          college_name: string
          created_at?: string
          event_id: string
          id?: string
          leader_email: string
          leader_name: string
          leader_phone: string
          members?: Json | null
          payment_screenshot_url?: string | null
          registration_status?: string
          semester?: string | null
          source?: string
          team_name?: string | null
          transaction_id?: string | null
          utr_number?: string | null
        }
        Update: {
          amount_paid?: string | null
          college_id?: string | null
          college_name?: string
          created_at?: string
          event_id?: string
          id?: string
          leader_email?: string
          leader_name?: string
          leader_phone?: string
          members?: Json | null
          payment_screenshot_url?: string | null
          registration_status?: string
          semester?: string | null
          source?: string
          team_name?: string | null
          transaction_id?: string | null
          utr_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_events: {
        Row: {
          category: string
          created_at: string
          day: number
          display_order: number
          emoji: string
          end_hour: number
          id: string
          is_active: boolean
          lane: number
          name: string
          start_hour: number
          team_size: string | null
          venue: string
        }
        Insert: {
          category?: string
          created_at?: string
          day?: number
          display_order?: number
          emoji?: string
          end_hour: number
          id?: string
          is_active?: boolean
          lane?: number
          name: string
          start_hour: number
          team_size?: string | null
          venue?: string
        }
        Update: {
          category?: string
          created_at?: string
          day?: number
          display_order?: number
          emoji?: string
          end_hour?: number
          id?: string
          is_active?: boolean
          lane?: number
          name?: string
          start_hour?: number
          team_size?: string | null
          venue?: string
        }
        Relationships: []
      }
      section_cards: {
        Row: {
          card_key: string
          card_name: string
          display_order: number
          id: string
          is_visible: boolean
          section_key: string
          updated_at: string
        }
        Insert: {
          card_key: string
          card_name: string
          display_order?: number
          id?: string
          is_visible?: boolean
          section_key: string
          updated_at?: string
        }
        Update: {
          card_key?: string
          card_name?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          section_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_cards_section_key_fkey"
            columns: ["section_key"]
            isOneToOne: false
            referencedRelation: "site_sections"
            referencedColumns: ["section_key"]
          },
        ]
      }
      site_sections: {
        Row: {
          description: string | null
          display_order: number
          id: string
          is_visible: boolean
          section_key: string
          section_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          section_key: string
          section_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          section_key?: string
          section_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          logo_url: string
          name: string
          tier: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url: string
          name: string
          tier?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          tier?: string
          website_url?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          role: string | null
          section: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          role?: string | null
          section: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          role?: string | null
          section?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          email: string | null
          id: string
          is_owner: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          email?: string | null
          id?: string
          is_owner?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          email?: string | null
          id?: string
          is_owner?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visibility_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          changed_from: boolean
          changed_to: boolean
          id: string
          target_key: string
          target_name: string
          target_type: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          changed_from?: boolean
          changed_to?: boolean
          id?: string
          target_key: string
          target_name: string
          target_type: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          changed_from?: boolean
          changed_to?: boolean
          id?: string
          target_key?: string
          target_name?: string
          target_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_registration_duplicate: {
        Args: { _event_id: string; _field: string; _value: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
