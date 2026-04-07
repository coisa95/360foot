-- ===========================================================================
-- Fix affiliate_clicks RLS: remove public INSERT/SELECT
-- Date: 2026-04-07
--
-- PROBLEM
-- The original supabase-setup.sql created:
--   CREATE POLICY "Service insert" ON affiliate_clicks
--     FOR INSERT WITH CHECK (true);
--   CREATE POLICY "Public read" ON affiliate_clicks
--     FOR SELECT USING (true);
-- Since the anon key is exposed publicly to the browser, ANY client could
-- INSERT arbitrary rows and READ the full click history. This defeats the
-- purpose of RLS and leaks sensitive affiliate revenue data.
--
-- FIX
-- Drop the public policies. Only the service_role key (used exclusively
-- server-side from /api/track-click) bypasses RLS, so nothing changes for
-- legitimate traffic.
-- ===========================================================================

DROP POLICY IF EXISTS "Service insert" ON affiliate_clicks;
DROP POLICY IF EXISTS "Public read" ON affiliate_clicks;

-- Keep RLS enabled. No policies => deny-all for anon/authenticated roles.
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Optional: explicit denial policy for clarity (defense in depth).
-- (service_role bypasses RLS, so this only affects anon/authenticated.)
CREATE POLICY "Deny all anon" ON affiliate_clicks
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
