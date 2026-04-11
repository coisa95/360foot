import { createClient as supabaseCreateClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Server-side Supabase client using the service role key.
 * Use this in CRON jobs and server actions that need write access.
 */
export function createClient() {
  return supabaseCreateClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Read-only Supabase client using the anon key (respects RLS).
 * Use this in public API routes and server components for read operations.
 */
export function createAnonClient() {
  return supabaseCreateClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
