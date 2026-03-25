import { createClient as supabaseCreateClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Server-side Supabase client using the service role key.
 * Use this in API routes, server components, and server actions.
 */
export function createClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return supabaseCreateClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Client-side Supabase client using the anonymous key.
 * Use this in client components and browser-side code.
 */
export function createBrowserClient() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return supabaseCreateClient(supabaseUrl, anonKey);
}
