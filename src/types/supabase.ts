// CAPS LOCK COMMENT: DEFINING A COMPLETE DATABASE TYPE TO SATISFY SUPABASE V2 CLIENT.
// THIS MATCHES YOUR "STOPS" TABLE EXACTLY (SNAKE_CASE COLUMNS).
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      stops: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          latitude: number;
          longitude: number;
          type: "terminal" | "stop";
          barangay: string;
          vehicle_types: string[];
        };
        Insert: {
          id: string;
          created_at?: string;
          name: string;
          latitude: number;
          longitude: number;
          type: "terminal" | "stop";
          barangay: string;
          vehicle_types: string[];
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          type?: "terminal" | "stop";
          barangay?: string;
          vehicle_types?: string[];
        };
        // CAPS LOCK COMMENT: EMPTY RELATIONSHIPS ARRAY IS REQUIRED BY NEWER SUPABASE CLIENTS
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
