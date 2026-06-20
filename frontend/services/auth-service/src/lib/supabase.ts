import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseClients {
  /** Anon key — Auth SDK (signUp, signIn, OAuth, refresh). */
  supabaseAuth: SupabaseClient;
  /** Service role — `profiles` writes/reads; bypasses RLS. */
  db: SupabaseClient;
}

export function createSupabaseClients(url: string, anonKey: string, serviceRoleKey: string): SupabaseClients {
  const supabaseAuth = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const db = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { supabaseAuth, db };
}
