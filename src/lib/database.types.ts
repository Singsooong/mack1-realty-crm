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
      agents: {
        Row: {
          avatar_url: string | null
          email: string
          id: string
          listings: number | null
          name: string
          phone: string | null
          rating: number | null
          revenue: string | null
          role: string | null
          sales: number | null
          specialty: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          email: string
          id?: string
          listings?: number | null
          name: string
          phone?: string | null
          rating?: number | null
          revenue?: string | null
          role?: string | null
          sales?: number | null
          specialty?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string
          id?: string
          listings?: number | null
          name?: string
          phone?: string | null
          rating?: number | null
          revenue?: string | null
          role?: string | null
          sales?: number | null
          specialty?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          agent_attendees: string[] | null
          date: string
          id: string
          location: string | null
          time: string | null
          title: string
          type: string | null
        }
        Insert: {
          agent_attendees?: string[] | null
          date: string
          id?: string
          location?: string | null
          time?: string | null
          title: string
          type?: string | null
        }
        Update: {
          agent_attendees?: string[] | null
          date?: string
          id?: string
          location?: string | null
          time?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          body: string
          client_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          body: string
          client_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          client_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_url: string | null
          email: string | null
          id: string
          last_contact: string | null
          name: string
          phone: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          name: string
          phone?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          agent_id: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          completed_at: string | null
          created_at: string
          download_url: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          original_file_paths: string[]
          property: string | null
          recipients: Json
          signature_image_path: string | null
          signing_url: string | null
          signwell_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          completed_at?: string | null
          created_at?: string
          download_url?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          original_file_paths?: string[]
          property?: string | null
          recipients?: Json
          signature_image_path?: string | null
          signing_url?: string | null
          signwell_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          completed_at?: string | null
          created_at?: string
          download_url?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          original_file_paths?: string[]
          property?: string | null
          recipients?: Json
          signature_image_path?: string | null
          signing_url?: string | null
          signwell_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_with_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_agent_id: string | null
          date: string | null
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          property_interest: string | null
          status: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          date?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          property_interest?: string | null
          status?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          date?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          property_interest?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents_with_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          client_name: string | null
          created_at: string
          document_id: string | null
          document_title: string | null
          id: string
          read_at: string | null
          recipient_id: string | null
          status: string | null
          type: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          document_id?: string | null
          document_title?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          status?: string | null
          type?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          document_id?: string | null
          document_title?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          acreage: number | null
          address: string | null
          agent_id: string | null
          agent1_id: string | null
          agent1_name: string | null
          agent2_id: string | null
          agent2_name: string | null
          area: string | null
          basement: boolean | null
          baths: number | null
          beds: number | null
          building_name: string | null
          cart_port: number | null
          city: string | null
          community_name: string | null
          country: string | null
          created_by: string | null
          description: string | null
          elementary_school: string | null
          garage: number | null
          golf_course: boolean | null
          high_school: string | null
          hoa: boolean | null
          hoa_dues: number | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          jr_high_school: string | null
          list_price: number | null
          listing_office: string | null
          mls_agent_name: string | null
          mls_number: string | null
          name: string
          pool: boolean | null
          price: number | null
          school_district: string | null
          seller: string | null
          sqft: number | null
          state: string | null
          status: string | null
          stories: number | null
          style: string | null
          sub_area: string | null
          sub_type: string | null
          unit_floor: string | null
          view: string | null
          waterfront: boolean | null
          year_built: number | null
          zip_code: string | null
        }
        Insert: {
          acreage?: number | null
          address?: string | null
          agent_id?: string | null
          agent1_id?: string | null
          agent1_name?: string | null
          agent2_id?: string | null
          agent2_name?: string | null
          area?: string | null
          basement?: boolean | null
          baths?: number | null
          beds?: number | null
          building_name?: string | null
          cart_port?: number | null
          city?: string | null
          community_name?: string | null
          country?: string | null
          created_by?: string | null
          description?: string | null
          elementary_school?: string | null
          garage?: number | null
          golf_course?: boolean | null
          high_school?: string | null
          hoa?: boolean | null
          hoa_dues?: number | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          jr_high_school?: string | null
          list_price?: number | null
          listing_office?: string | null
          mls_agent_name?: string | null
          mls_number?: string | null
          name: string
          pool?: boolean | null
          price?: number | null
          school_district?: string | null
          seller?: string | null
          sqft?: number | null
          state?: string | null
          status?: string | null
          stories?: number | null
          style?: string | null
          sub_area?: string | null
          sub_type?: string | null
          unit_floor?: string | null
          view?: string | null
          waterfront?: boolean | null
          year_built?: number | null
          zip_code?: string | null
        }
        Update: {
          acreage?: number | null
          address?: string | null
          agent_id?: string | null
          agent1_id?: string | null
          agent1_name?: string | null
          agent2_id?: string | null
          agent2_name?: string | null
          area?: string | null
          basement?: boolean | null
          baths?: number | null
          beds?: number | null
          building_name?: string | null
          cart_port?: number | null
          city?: string | null
          community_name?: string | null
          country?: string | null
          created_by?: string | null
          description?: string | null
          elementary_school?: string | null
          garage?: number | null
          golf_course?: boolean | null
          high_school?: string | null
          hoa?: boolean | null
          hoa_dues?: number | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          jr_high_school?: string | null
          list_price?: number | null
          listing_office?: string | null
          mls_agent_name?: string | null
          mls_number?: string | null
          name?: string
          pool?: boolean | null
          price?: number | null
          school_district?: string | null
          seller?: string | null
          sqft?: number | null
          state?: string | null
          status?: string | null
          stories?: number | null
          style?: string | null
          sub_area?: string | null
          sub_type?: string | null
          unit_floor?: string | null
          view?: string | null
          waterfront?: boolean | null
          year_built?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_with_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_agent_id: string | null
          category: string | null
          client_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string
          title: string
        }
        Insert: {
          assigned_agent_id?: string | null
          category?: string | null
          client_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string
          title: string
        }
        Update: {
          assigned_agent_id?: string | null
          category?: string | null
          client_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents_with_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_google_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: number
          id: string
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: number
          id?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: number
          id?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          document_id: string | null
          event_type: string
          id: string
          payload: Json
          signwell_event_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          event_type: string
          id?: string
          payload: Json
          signwell_event_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          signwell_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      agents_with_counts: {
        Row: {
          avatar_url: string | null
          email: string | null
          id: string | null
          listings: number | null
          listings_count: number | null
          name: string | null
          phone: string | null
          rating: number | null
          revenue: string | null
          role: string | null
          sales: number | null
          specialty: string | null
          status: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_agent_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
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
