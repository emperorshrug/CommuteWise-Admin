// src/debug/logSupabaseConfig.ts

/**
 * TEMPORARY DEBUG HELPER
 * ======================
 * LOGS:
 * - SUPABASE URL
 * - FIRST 12 CHARACTERS OF THE KEY
 *
 * USE:
 * - IMPORT AND CALL logSupabaseConfigOnce() FROM App.tsx OR main.tsx
 *   DURING DEBUGGING, THEN REMOVE WHEN RESOLVED.
 */

import { supabase } from "../lib/supabaseClient";

let hasLogged = false;

export function logSupabaseConfigOnce() {
  if (hasLogged) return;
  hasLogged = true;

  // @ts-expect-error: accessing internal fields for debug
  const url = supabase?.rest?.url || import.meta.env.VITE_SUPABASE_URL;
  const key =
    import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

  // CAPS LOCK COMMENT: NEVER LOG FULL KEY IN PRODUCTION; ONLY PREFIX FOR DEBUG
  const keyPrefix = key ? String(key).slice(0, 12) : "<missing>";

  console.log("COMMUTEWISE SUPABASE CONFIG DEBUG:", {
    url,
    keyPrefix,
  });
}
