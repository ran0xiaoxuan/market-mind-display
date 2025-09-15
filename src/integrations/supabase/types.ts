export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      daily_signal_counts: {
        Row: {
          created_at: string
          id: string
          notification_count: number
          signal_date: string
          strategy_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_count?: number
          signal_date?: string
          strategy_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_count?: number
          signal_date?: string
          strategy_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_signal_counts_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_test_signal_counts: {
        Row: {
          created_at: string
          id: string
          signal_date: string
          test_signal_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_date?: string
          test_signal_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_date?: string
          test_signal_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          signal_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          signal_id: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          signal_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          discord_enabled: boolean
          discord_webhook_url: string | null
          email_enabled: boolean
          entry_signals: boolean
          exit_signals: boolean
          id: string
          telegram_bot_token: string | null
          telegram_chat_id: string | null
          telegram_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discord_enabled?: boolean
          discord_webhook_url?: string | null
          email_enabled?: boolean
          entry_signals?: boolean
          exit_signals?: boolean
          id?: string
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          telegram_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discord_enabled?: boolean
          discord_webhook_url?: string | null
          email_enabled?: boolean
          entry_signals?: boolean
          exit_signals?: boolean
          id?: string
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          telegram_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          id: string
          original_strategy_id: string
          original_user_id: string
          name: string
          description: string | null
          timeframe: string
          target_asset: string | null
          target_asset_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          original_strategy_id: string
          original_user_id: string
          name: string
          description?: string | null
          timeframe: string
          target_asset?: string | null
          target_asset_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          original_strategy_id?: string
          original_user_id?: string
          name?: string
          description?: string | null
          timeframe?: string
          target_asset?: string | null
          target_asset_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_original_strategy_id_fkey"
            columns: ["original_strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          subscription_tier: string | null
          timezone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      rule_groups: {
        Row: {
          created_at: string
          explanation: string | null
          group_order: number
          id: string
          logic: string
          required_conditions: number | null
          rule_type: string
          strategy_id: string | null
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          group_order: number
          id?: string
          logic: string
          required_conditions?: number | null
          rule_type: string
          strategy_id?: string | null
        }
        Update: {
          created_at?: string
          explanation?: string | null
          group_order?: number
          id?: string
          logic?: string
          required_conditions?: number | null
          rule_type?: string
          strategy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rule_groups_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          can_be_deleted: boolean
          created_at: string
          daily_signal_limit: number | null
          description: string | null
          id: string
          is_active: boolean
          is_recommended_copy: boolean
          name: string
          signal_notifications_enabled: boolean | null
          source_strategy_id: string | null
          target_asset: string | null
          target_asset_name: string | null
          timeframe: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_be_deleted?: boolean
          created_at?: string
          daily_signal_limit?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_recommended_copy?: boolean
          name: string
          signal_notifications_enabled?: boolean | null
          source_strategy_id?: string | null
          target_asset?: string | null
          target_asset_name?: string | null
          timeframe: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_be_deleted?: boolean
          created_at?: string
          daily_signal_limit?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_recommended_copy?: boolean
          name?: string
          signal_notifications_enabled?: boolean | null
          source_strategy_id?: string | null
          target_asset?: string | null
          target_asset_name?: string | null
          timeframe?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategies_source_strategy_id_fkey"
            columns: ["source_strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      test_signals: {
        Row: {
          created_at: string
          id: string
          signal_data: Json
          signal_type: string
          strategy_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_data?: Json
          signal_type: string
          strategy_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_data?: Json
          signal_type?: string
          strategy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_signals_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_rules: {
        Row: {
          condition: string
          created_at: string
          explanation: string | null
          id: string
          inequality_order: number
          left_indicator: string | null
          left_parameters: Json | null
          left_type: string
          left_value: string | null
          left_value_type: string | null
          right_indicator: string | null
          right_parameters: Json | null
          right_type: string
          right_value: string | null
          right_value_type: string | null
          rule_group_id: string | null
          updated_at: string
        }
        Insert: {
          condition: string
          created_at?: string
          explanation?: string | null
          id?: string
          inequality_order: number
          left_indicator?: string | null
          left_parameters?: Json | null
          left_type: string
          left_value?: string | null
          left_value_type?: string | null
          right_indicator?: string | null
          right_parameters?: Json | null
          right_type: string
          right_value?: string | null
          right_value_type?: string | null
          rule_group_id?: string | null
          updated_at?: string
        }
        Update: {
          condition?: string
          created_at?: string
          explanation?: string | null
          id?: string
          inequality_order?: number
          left_indicator?: string | null
          left_parameters?: Json | null
          left_type?: string
          left_value?: string | null
          left_value_type?: string | null
          right_indicator?: string | null
          right_parameters?: Json | null
          right_type?: string
          right_value?: string | null
          right_value_type?: string | null
          rule_group_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "new_trading_rules_rule_group_id_fkey"
            columns: ["rule_group_id"]
            isOneToOne: false
            referencedRelation: "rule_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_signals: {
        Row: {
          created_at: string
          id: string
          processed: boolean
          signal_data: Json
          signal_type: string
          strategy_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed?: boolean
          signal_data: Json
          signal_type: string
          strategy_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed?: boolean
          signal_data?: Json
          signal_type?: string
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_signals_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_strategy_cascade: {
        Args: { strategy_uuid: string }
        Returns: undefined
      }
      get_strategy_application_count: {
        Args: { strategy_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
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
