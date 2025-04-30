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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      risk_management: {
        Row: {
          created_at: string
          id: string
          max_buy_volume: string | null
          single_buy_volume: string | null
          stop_loss: string | null
          strategy_id: string
          take_profit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_buy_volume?: string | null
          single_buy_volume?: string | null
          stop_loss?: string | null
          strategy_id: string
          take_profit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_buy_volume?: string | null
          single_buy_volume?: string | null
          stop_loss?: string | null
          strategy_id?: string
          take_profit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_management_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          market: string
          name: string
          target_asset: string | null
          timeframe: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          market: string
          name: string
          target_asset?: string | null
          timeframe: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          market?: string
          name?: string
          target_asset?: string | null
          timeframe?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          id: string
          left_indicator: string | null
          left_parameters: Json | null
          left_type: string
          logic: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
