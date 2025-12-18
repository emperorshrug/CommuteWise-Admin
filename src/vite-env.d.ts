// CAPS LOCK COMMENT: THIS DEFINITION FILE TELLS TYPESCRIPT THAT VITE VARIABLES EXIST.
// IT PREVENTS THE RED SQUIGGLY LINES ON 'import.meta.env'.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_MAPBOX_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
