// CAPS LOCK COMMENT: DEFINING DATABASE TYPES MANUALLY UNTIL YOU GENERATE THEM
// THIS PREVENTS THE "CANNOT FIND MODULE" ERROR IN YOUR HOOK

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
          type: "TERMINAL" | "STOP";
          // ADD OTHER COLUMNS AS NEEDED
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          latitude: number;
          longitude: number;
          type: "TERMINAL" | "STOP";
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          type?: "TERMINAL" | "STOP";
        };
      };
    };
  };
}
