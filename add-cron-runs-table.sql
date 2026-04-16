-- ============================================================================
-- Table cron_runs : observabilité des exécutions cron
--
-- Chaque run de cron insère une ligne avec les stats (nb articles, erreurs…).
-- L'endpoint /api/admin/scrape-health lit les dernières 24h pour vérifier
-- que chaque source produit du contenu.
-- ============================================================================
CREATE TABLE IF NOT EXISTS cron_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cron_name TEXT NOT NULL,        -- ex: "scrape-african-local", "generate-streaming-articles"
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER,
  articles_generated INTEGER DEFAULT 0,
  sources_processed INTEGER DEFAULT 0,
  errors TEXT[],
  stats JSONB,                    -- stats détaillées par source (le JSON retourné par le cron)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_runs_name_started
  ON cron_runs (cron_name, started_at DESC);
