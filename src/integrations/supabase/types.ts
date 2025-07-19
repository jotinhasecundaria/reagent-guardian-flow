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
      appointments: {
        Row: {
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          exam_type_id: string | null
          id: string
          notes: string | null
          patient_name: string | null
          scheduled_date: string
          status: string | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          exam_type_id?: string | null
          id?: string
          notes?: string | null
          patient_name?: string | null
          scheduled_date: string
          status?: string | null
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          exam_type_id?: string | null
          id?: string
          notes?: string | null
          patient_name?: string | null
          scheduled_date?: string
          status?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_transactions: {
        Row: {
          block_number: number | null
          data_hash: string
          gas_used: number | null
          id: string
          reagent_lot_id: string | null
          status: string | null
          timestamp: string | null
          transaction_hash: string
          transaction_type: string
        }
        Insert: {
          block_number?: number | null
          data_hash: string
          gas_used?: number | null
          id?: string
          reagent_lot_id?: string | null
          status?: string | null
          timestamp?: string | null
          transaction_hash: string
          transaction_type: string
        }
        Update: {
          block_number?: number | null
          data_hash?: string
          gas_used?: number | null
          id?: string
          reagent_lot_id?: string | null
          status?: string | null
          timestamp?: string | null
          transaction_hash?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_transactions_reagent_lot_id_fkey"
            columns: ["reagent_lot_id"]
            isOneToOne: false
            referencedRelation: "reagent_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      consumption_logs: {
        Row: {
          action_type: string
          appointment_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          notes: string | null
          points_awarded: number | null
          quantity_after: number
          quantity_before: number
          quantity_changed: number
          reagent_lot_id: string
          sustainability_impact: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          points_awarded?: number | null
          quantity_after: number
          quantity_before: number
          quantity_changed: number
          reagent_lot_id: string
          sustainability_impact?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          points_awarded?: number | null
          quantity_after?: number
          quantity_before?: number
          quantity_changed?: number
          reagent_lot_id?: string
          sustainability_impact?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumption_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumption_logs_reagent_lot_id_fkey"
            columns: ["reagent_lot_id"]
            isOneToOne: false
            referencedRelation: "reagent_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_predictions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          factors: Json | null
          id: string
          predicted_consumption: number
          prediction_period: string
          reagent_id: string
          unit_id: string
          valid_from: string | null
          valid_until: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          factors?: Json | null
          id?: string
          predicted_consumption: number
          prediction_period: string
          reagent_id: string
          unit_id: string
          valid_from?: string | null
          valid_until: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          factors?: Json | null
          id?: string
          predicted_consumption?: number
          prediction_period?: string
          reagent_id?: string
          unit_id?: string
          valid_from?: string | null
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_predictions_reagent_id_fkey"
            columns: ["reagent_id"]
            isOneToOne: false
            referencedRelation: "reagents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_predictions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          required_reagents: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          required_reagents?: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          required_reagents?: Json
        }
        Relationships: []
      }
      intelligent_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          is_resolved: boolean | null
          metadata: Json | null
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          title: string
          unit_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          title: string
          unit_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          title?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligent_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligent_alerts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_readings: {
        Row: {
          id: string
          metadata: Json | null
          sensor_id: string
          timestamp: string | null
          unit_measure: string
          value: number
        }
        Insert: {
          id?: string
          metadata?: Json | null
          sensor_id: string
          timestamp?: string | null
          unit_measure: string
          value: number
        }
        Update: {
          id?: string
          metadata?: Json | null
          sensor_id?: string
          timestamp?: string | null
          unit_measure?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "iot_readings_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "iot_sensors"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_sensors: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          is_active: boolean | null
          last_reading: Json | null
          last_reading_at: string | null
          location: string
          sensor_type: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          is_active?: boolean | null
          last_reading?: Json | null
          last_reading_at?: string | null
          location: string
          sensor_type: string
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          is_active?: boolean | null
          last_reading?: Json | null
          last_reading_at?: string | null
          location?: string
          sensor_type?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iot_sensors_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      location_suggestions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          environmental_conditions: Json | null
          id: string
          is_active: boolean | null
          reagent_type: string | null
          reasoning: string | null
          suggested_location: string
          unit_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          environmental_conditions?: Json | null
          id?: string
          is_active?: boolean | null
          reagent_type?: string | null
          reasoning?: string | null
          suggested_location: string
          unit_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          environmental_conditions?: Json | null
          id?: string
          is_active?: boolean | null
          reagent_type?: string | null
          reasoning?: string | null
          suggested_location?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_suggestions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          contact_info: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      offline_sync_queue: {
        Row: {
          action_type: string
          created_at: string | null
          data: Json
          id: string
          synced_at: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          data: Json
          id?: string
          synced_at?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          data?: Json
          id?: string
          synced_at?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          role: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          role: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_print_history: {
        Row: {
          created_at: string | null
          id: string
          print_reason: string | null
          printed_by: string | null
          reagent_lot_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          print_reason?: string | null
          printed_by?: string | null
          reagent_lot_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          print_reason?: string | null
          printed_by?: string | null
          reagent_lot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_print_history_reagent_lot_id_fkey"
            columns: ["reagent_lot_id"]
            isOneToOne: false
            referencedRelation: "reagent_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_controls: {
        Row: {
          id: string
          next_test_due: string | null
          observations: string | null
          parameters: Json | null
          reagent_lot_id: string
          test_date: string | null
          test_result: string | null
          test_type: string
          tested_by: string | null
        }
        Insert: {
          id?: string
          next_test_due?: string | null
          observations?: string | null
          parameters?: Json | null
          reagent_lot_id: string
          test_date?: string | null
          test_result?: string | null
          test_type: string
          tested_by?: string | null
        }
        Update: {
          id?: string
          next_test_due?: string | null
          observations?: string | null
          parameters?: Json | null
          reagent_lot_id?: string
          test_date?: string | null
          test_result?: string | null
          test_type?: string
          tested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_controls_reagent_lot_id_fkey"
            columns: ["reagent_lot_id"]
            isOneToOne: false
            referencedRelation: "reagent_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_controls_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reagent_lots: {
        Row: {
          ai_recommended_location: string | null
          blockchain_hash: string | null
          created_at: string | null
          criticality_level: string | null
          current_quantity: number
          expiry_date: string
          id: string
          initial_quantity: number
          location: string | null
          lot_number: string
          manufacturer_id: string | null
          minimum_stock: number | null
          qr_code_data: Json | null
          quality_score: number | null
          reagent_id: string
          registered_by: string | null
          reserved_quantity: number | null
          status: string | null
          storage_conditions: Json | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          ai_recommended_location?: string | null
          blockchain_hash?: string | null
          created_at?: string | null
          criticality_level?: string | null
          current_quantity: number
          expiry_date: string
          id?: string
          initial_quantity: number
          location?: string | null
          lot_number: string
          manufacturer_id?: string | null
          minimum_stock?: number | null
          qr_code_data?: Json | null
          quality_score?: number | null
          reagent_id: string
          registered_by?: string | null
          reserved_quantity?: number | null
          status?: string | null
          storage_conditions?: Json | null
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          ai_recommended_location?: string | null
          blockchain_hash?: string | null
          created_at?: string | null
          criticality_level?: string | null
          current_quantity?: number
          expiry_date?: string
          id?: string
          initial_quantity?: number
          location?: string | null
          lot_number?: string
          manufacturer_id?: string | null
          minimum_stock?: number | null
          qr_code_data?: Json | null
          quality_score?: number | null
          reagent_id?: string
          registered_by?: string | null
          reserved_quantity?: number | null
          status?: string | null
          storage_conditions?: Json | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reagent_lots_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reagent_lots_reagent_id_fkey"
            columns: ["reagent_id"]
            isOneToOne: false
            referencedRelation: "reagents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reagent_lots_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      reagent_reservations: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          quantity_reserved: number
          reagent_lot_id: string
          status: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          quantity_reserved: number
          reagent_lot_id: string
          status?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          quantity_reserved?: number
          reagent_lot_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reagent_reservations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reagent_reservations_reagent_lot_id_fkey"
            columns: ["reagent_lot_id"]
            isOneToOne: false
            referencedRelation: "reagent_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      reagents: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          minimum_stock: number | null
          name: string
          storage_conditions: string | null
          type: string | null
          unit_measure: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          minimum_stock?: number | null
          name: string
          storage_conditions?: string | null
          type?: string | null
          unit_measure?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          minimum_stock?: number | null
          name?: string
          storage_conditions?: string | null
          type?: string | null
          unit_measure?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          contact_info: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          achievements: Json | null
          created_at: string | null
          id: string
          level_name: string | null
          streaks: Json | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievements?: Json | null
          created_at?: string | null
          id?: string
          level_name?: string | null
          streaks?: Json | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievements?: Json | null
          created_at?: string | null
          id?: string
          level_name?: string | null
          streaks?: Json | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_gamification_points: {
        Args: {
          action_type: string
          reagent_criticality?: string
          sustainability_factor?: number
        }
        Returns: number
      }
      calculate_stock_status: {
        Args: { lot_id: string }
        Returns: string
      }
      generate_demand_prediction: {
        Args: { p_reagent_id: string; p_unit_id: string; p_period: string }
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_unit: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
