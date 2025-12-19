// src/lib/supabaseClient.ts

/**
 * CONTEXT: COMMUTEWISE SHARED SUPABASE CLIENT
 * ===========================================
 * SINGLETON CLIENT USED ACROSS:
 * - STOP STORE (stops table)
 * - ROUTE PERSISTENCE (routes, route_stops)
 *
 * THIS AVOIDS:
 * - MULTIPLE GoTrueClient INSTANCES WARNING
 * - INCONSISTENT AUTH STATE / TOKENS
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "COMMUTEWISE: MISSING SUPABASE CONFIG. CHECK VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
