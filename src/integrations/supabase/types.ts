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
      backtest_trades: {
        Row: {
          backtest_id: string
          contracts: number
          created_at: string
          date: string
          id: string
          price: number
          profit: number | null
          profit_percentage: number | null
          signal: string
          type: string
        }
        Insert: {
          backtest_id: string
          contracts: number
          created_at?: string
          date: string
          id?: string
          price: number
          profit?: number | null
          profit_percentage?: number | null
          signal: string
          type: string
        }
        Update: {
          backtest_id?: string
          contracts?: number
          created_at?: string
          date?: string
          id?: string
          price?: number
          profit?: number | null
          profit_percentage?: number | null
          signal?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "backtest_trades_backtest_id_fkey"
            columns: ["backtest_id"]
            isOneToOne: false
            referencedRelation: "backtests"
            referencedColumns: ["id"]
          },
        ]
      }
      backtests: {
        Row: {
          annualized_return: number | null
          avg_loss: number | null
          avg_profit: number | null
          created_at: string
          end_date: string
          id: string
          initial_capital: number
          losing_trades: number | null
          max_drawdown: number | null
          profit_factor: number | null
          sharpe_ratio: number | null
          start_date: string
          strategy_id: string
          total_return: number | null
          total_return_percentage: number | null
          total_trades: number | null
          user_id: string
          win_rate: number | null
          winning_trades: number | null
        }
        Insert: {
          annualized_return?: number | null
          avg_loss?: number | null
          avg_profit?: number | null
          created_at?: string
          end_date: string
          id?: string
          initial_capital: number
          losing_trades?: number | null
          max_drawdown?: number | null
          profit_factor?: number | null
          sharpe_ratio?: number | null
          start_date: string
          strategy_id: string
          total_return?: number | null
          total_return_percentage?: number | null
          total_trades?: number | null
          user_id: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Update: {
          annualized_return?: number | null
          avg_loss?: number | null
          avg_profit?: number | null
          created_at?: string
          end_date?: string
          id?: string
          initial_capital?: number
          losing_trades?: number | null
          max_drawdown?: number | null
          profit_factor?: number | null
          sharpe_ratio?: number | null
          start_date?: string
          strategy_id?: string
          total_return?: number | null
          total_return_percentage?: number | null
          total_trades?: number | null
          user_id?: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "backtests_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          subscription_tier: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          subscription_tier?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          subscription_tier?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      recommended_strategies: {
        Row: {
          created_at: string | null
          deprecated: boolean
          id: string
          is_official: boolean | null
          is_public: boolean | null
          recommended_by: string | null
          strategy_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deprecated?: boolean
          id?: string
          is_official?: boolean | null
          is_public?: boolean | null
          recommended_by?: string | null
          strategy_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deprecated?: boolean
          id?: string
          is_official?: boolean | null
          is_public?: boolean | null
          recommended_by?: string | null
          strategy_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommended_strategies_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
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
          description: string | null
          id: string
          is_active: boolean
          is_recommended_copy: boolean
          name: string
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
          description?: string | null
          id?: string
          is_active?: boolean
          is_recommended_copy?: boolean
          name: string
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
          description?: string | null
          id?: string
          is_active?: boolean
          is_recommended_copy?: boolean
          name?: string
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
      strategy_applications: {
        Row: {
          applied_at: string
          created_at: string
          id: string
          strategy_id: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          id?: string
          strategy_id: string
          user_id: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          id?: string
          strategy_id?: string
          user_id?: string
        }
        Relationships: []
      }
      strategy_copies: {
        Row: {
          copied_by: string
          copied_strategy_id: string
          copy_type: string
          created_at: string
          id: string
          source_strategy_id: string
        }
        Insert: {
          copied_by: string
          copied_strategy_id: string
          copy_type: string
          created_at?: string
          id?: string
          source_strategy_id: string
        }
        Update: {
          copied_by?: string
          copied_strategy_id?: string
          copy_type?: string
          created_at?: string
          id?: string
          source_strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_copies_copied_strategy_id_fkey"
            columns: ["copied_strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_copies_source_strategy_id_fkey"
            columns: ["source_strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_evaluations: {
        Row: {
          created_at: string | null
          evaluation_count: number | null
          id: string
          last_evaluated_at: string | null
          next_evaluation_due: string | null
          strategy_id: string | null
          timeframe: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evaluation_count?: number | null
          id?: string
          last_evaluated_at?: string | null
          next_evaluation_due?: string | null
          strategy_id?: string | null
          timeframe: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evaluation_count?: number | null
          id?: string
          last_evaluated_at?: string | null
          next_evaluation_due?: string | null
          strategy_id?: string | null
          timeframe?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_evaluations_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_recommendations: {
        Row: {
          created_at: string
          id: string
          is_official: boolean
          original_strategy_id: string
          recommended_by: string
          recommended_strategy_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_official?: boolean
          original_strategy_id: string
          recommended_by: string
          recommended_strategy_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_official?: boolean
          original_strategy_id?: string
          recommended_by?: string
          recommended_strategy_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_recommendations_original_strategy_id_fkey"
            columns: ["original_strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_recommendations_recommended_strategy_id_fkey"
            columns: ["recommended_strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_versions: {
        Row: {
          changes: string | null
          created_at: string
          id: string
          strategy_id: string
          user_id: string
          version_number: number
        }
        Insert: {
          changes?: string | null
          created_at?: string
          id?: string
          strategy_id: string
          user_id: string
          version_number: number
        }
        Update: {
          changes?: string | null
          created_at?: string
          id?: string
          strategy_id?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategy_versions_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      trading_rules_old: {
        Row: {
          condition: string
          created_at: string
          id: string
          left_indicator: string | null
          left_parameters: Json | null
          left_type: string
          logic: string
          metadata: Json | null
          right_indicator: string | null
          right_parameters: Json | null
          right_type: string
          right_value: string | null
          rule_group: number
          rule_type: string
          strategy_id: string
          updated_at: string
        }
        Insert: {
          condition: string
          created_at?: string
          id?: string
          left_indicator?: string | null
          left_parameters?: Json | null
          left_type: string
          logic: string
          metadata?: Json | null
          right_indicator?: string | null
          right_parameters?: Json | null
          right_type: string
          right_value?: string | null
          rule_group: number
          rule_type: string
          strategy_id: string
          updated_at?: string
        }
        Update: {
          condition?: string
          created_at?: string
          id?: string
          left_indicator?: string | null
          left_parameters?: Json | null
          left_type?: string
          logic?: string
          metadata?: Json | null
          right_indicator?: string | null
          right_parameters?: Json | null
          right_type?: string
          right_value?: string | null
          rule_group?: number
          rule_type?: string
          strategy_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_rules_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
