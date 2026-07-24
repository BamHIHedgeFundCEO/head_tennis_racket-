import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Anon key + URL from env. If missing (e.g. local dev without a project yet),
// the client is null and all writes become no-ops — the app still runs.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null;

export const supabaseReady = Boolean(supabase);
