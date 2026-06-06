export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
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
        Relationships: []
      }
      games: {
        Row: {
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
        Relationships: []
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
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          default_rate: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          default_rate?: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          default_rate?: number
          id?: string
          name?: string
        }
        Relationships: []
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
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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

type DefaultSchema = Database["public"]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never
