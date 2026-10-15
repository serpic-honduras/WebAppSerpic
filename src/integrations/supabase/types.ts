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
      garantias: {
        Row: {
          created_at: string
          id: string
          monto: number
          numero_garantia: string
          project_id: string
          updated_at: string
          vigencia_fin: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          monto?: number
          numero_garantia?: string
          project_id: string
          updated_at?: string
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          monto?: number
          numero_garantia?: string
          project_id?: string
          updated_at?: string
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garantias_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_estimations: {
        Row: {
          created_at: string
          devolucion_anticipo: number
          id: string
          month: string
          monto_bruto: number
          otras_deducciones: number
          project_id: string
          retencion_calidad: number
          status: string
          total_neto_recibido: number
        }
        Insert: {
          created_at?: string
          devolucion_anticipo?: number
          id?: string
          month: string
          monto_bruto?: number
          otras_deducciones?: number
          project_id: string
          retencion_calidad?: number
          status?: string
          total_neto_recibido?: number
        }
        Update: {
          created_at?: string
          devolucion_anticipo?: number
          id?: string
          month?: string
          monto_bruto?: number
          otras_deducciones?: number
          project_id?: string
          retencion_calidad?: number
          status?: string
          total_neto_recibido?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_estimations_project_id_fkey"
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
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_access_codes: {
        Row: {
          access_code: string
          created_at: string
          expires_at: string
          id: string
          project_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          access_code: string
          created_at?: string
          expires_at: string
          id?: string
          project_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          access_code?: string
          created_at?: string
          expires_at?: string
          id?: string
          project_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_access_codes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          activities_description: string | null
          client: string
          client_contact_name: string | null
          client_email: string | null
          client_phone: string | null
          consortium: string | null
          construction_m2: number | null
          contract_amount: number
          contract_number: string | null
          created_at: string
          estimated_completion: string | null
          execution_year: number | null
          final_amount_hnl: number | null
          final_amount_usd: number | null
          final_duration_months: number | null
          final_reception_date: string | null
          final_term_days: number | null
          finish_date: string | null
          general_liability: number
          id: string
          initial_amount: number | null
          initial_term_days: number | null
          monthly_expenses: number
          name: string
          notes: string | null
          payment_bond: number
          performance_bond: number
          photos: Json
          project_exchange_rate: number | null
          project_manager_email: string | null
          project_manager_name: string | null
          project_manager_phone: string | null
          project_type: string | null
          resident_name: string | null
          start_date: string | null
          start_order_date: string | null
          status: string
          updated_at: string
          user_id: string
          work_type: string | null
          workers_comp: number
        }
        Insert: {
          activities_description?: string | null
          client: string
          client_contact_name?: string | null
          client_email?: string | null
          client_phone?: string | null
          consortium?: string | null
          construction_m2?: number | null
          contract_amount?: number
          contract_number?: string | null
          created_at?: string
          estimated_completion?: string | null
          execution_year?: number | null
          final_amount_hnl?: number | null
          final_amount_usd?: number | null
          final_duration_months?: number | null
          final_reception_date?: string | null
          final_term_days?: number | null
          finish_date?: string | null
          general_liability?: number
          id?: string
          initial_amount?: number | null
          initial_term_days?: number | null
          monthly_expenses?: number
          name: string
          notes?: string | null
          payment_bond?: number
          performance_bond?: number
          photos?: Json
          project_exchange_rate?: number | null
          project_manager_email?: string | null
          project_manager_name?: string | null
          project_manager_phone?: string | null
          project_type?: string | null
          resident_name?: string | null
          start_date?: string | null
          start_order_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
          work_type?: string | null
          workers_comp?: number
        }
        Update: {
          activities_description?: string | null
          client?: string
          client_contact_name?: string | null
          client_email?: string | null
          client_phone?: string | null
          consortium?: string | null
          construction_m2?: number | null
          contract_amount?: number
          contract_number?: string | null
          created_at?: string
          estimated_completion?: string | null
          execution_year?: number | null
          final_amount_hnl?: number | null
          final_amount_usd?: number | null
          final_duration_months?: number | null
          final_reception_date?: string | null
          final_term_days?: number | null
          finish_date?: string | null
          general_liability?: number
          id?: string
          initial_amount?: number | null
          initial_term_days?: number | null
          monthly_expenses?: number
          name?: string
          notes?: string | null
          payment_bond?: number
          performance_bond?: number
          photos?: Json
          project_exchange_rate?: number | null
          project_manager_email?: string | null
          project_manager_name?: string | null
          project_manager_phone?: string | null
          project_type?: string | null
          resident_name?: string | null
          start_date?: string | null
          start_order_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          work_type?: string | null
          workers_comp?: number
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          id: string
          is_system: boolean
          key: string
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_system?: boolean
          key: string
          name: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_my_permissions: {
        Args: never
        Returns: {
          key: string
          permissions: Json
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "auditor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user", "auditor"],
    },
  },
} as const
