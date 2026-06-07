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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      feedback: {
        Row: {
          created_at: string
          email: string | null
          id: string
          kind: string
          message: string
          page: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          message: string
          page?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          message?: string
          page?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          created_at: string
          final_chips: number | null
          game_id: string
          id: string
          player_id: string
        }
        Insert: {
          created_at?: string
          final_chips?: number | null
          game_id: string
          id?: string
          player_id: string
        }
        Update: {
          created_at?: string
          final_chips?: number | null
          game_id?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          buyin: number
          closed_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          group_id: string
          id: string
          name: string
          notes: string | null
          played_on: string
          rate: number
          status: string
        }
        Insert: {
          buyin?: number
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          group_id: string
          id?: string
          name?: string
          notes?: string | null
          played_on?: string
          rate?: number
          status?: string
        }
        Update: {
          buyin?: number
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          group_id?: string
          id?: string
          name?: string
          notes?: string | null
          played_on?: string
          rate?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          default_buyin: number
          default_rate: number
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          default_buyin?: number
          default_rate?: number
          id?: string
          invite_code?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          default_buyin?: number
          default_rate?: number
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          group_id: string
          id: string
          is_active: boolean
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          group_id: string
          id?: string
          is_active?: boolean
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          group_id?: string
          id?: string
          is_active?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount_money: number
          created_at: string
          from_player_id: string
          game_id: string
          id: string
          is_paid: boolean
          paid_at: string | null
          to_player_id: string
        }
        Insert: {
          amount_money: number
          created_at?: string
          from_player_id: string
          game_id: string
          id?: string
          is_paid?: boolean
          paid_at?: string | null
          to_player_id: string
        }
        Update: {
          amount_money?: number
          created_at?: string
          from_player_id?: string
          game_id?: string
          id?: string
          is_paid?: boolean
          paid_at?: string | null
          to_player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_from_player_id_fkey"
            columns: ["from_player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "settlements_from_player_id_fkey"
            columns: ["from_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_to_player_id_fkey"
            columns: ["to_player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "settlements_to_player_id_fkey"
            columns: ["to_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_money: number
          amount_points: number
          counterparty_player_id: string | null
          created_at: string
          created_by: string | null
          game_id: string
          id: string
          note: string | null
          player_id: string
          type: string
        }
        Insert: {
          amount_money?: number
          amount_points?: number
          counterparty_player_id?: string | null
          created_at?: string
          created_by?: string | null
          game_id: string
          id?: string
          note?: string | null
          player_id: string
          type: string
        }
        Update: {
          amount_money?: number
          amount_points?: number
          counterparty_player_id?: string | null
          created_at?: string
          created_by?: string | null
          game_id?: string
          id?: string
          note?: string | null
          player_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_counterparty_player_id_fkey"
            columns: ["counterparty_player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "transactions_counterparty_player_id_fkey"
            columns: ["counterparty_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "transactions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      game_balances: {
        Row: {
          balance: number | null
          buyin_money: number | null
          buyin_points: number | null
          chips_ledger: number | null
          currency: string | null
          final_chips: number | null
          game_id: string | null
          group_id: string | null
          net_money_in: number | null
          player_id: string | null
          rate: number | null
          status: string | null
          transfer_buy_money: number | null
          transfer_buy_points: number | null
          transfer_sell_money: number | null
          transfer_sell_points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          best_game: number | null
          display_name: string | null
          games_played: number | null
          games_won: number | null
          group_id: string | null
          is_active: boolean | null
          player_id: string | null
          total_invested: number | null
          total_net: number | null
          user_id: string | null
          worst_game: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_game: { Args: { gid: string }; Returns: boolean }
      close_game: {
        Args: { p_game_id: string; p_settlements: Json }
        Returns: undefined
      }
      create_group: {
        Args: { p_currency?: string; p_name: string; p_rate?: number }
        Returns: string
      }
      is_group_member: { Args: { gid: string }; Returns: boolean }
      is_group_owner: { Args: { gid: string }; Returns: boolean }
      join_group_by_code: { Args: { p_code: string }; Returns: string }
      reopen_game: { Args: { p_game_id: string }; Returns: undefined }
      shares_group_with: { Args: { p_user: string }; Returns: boolean }
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
