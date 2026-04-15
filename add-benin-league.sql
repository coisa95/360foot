-- ============================================================================
-- Ajout de la Celtiis Ligue 1 (Bénin) dans la table leagues
--
-- Utilisée par le cron scrape-african-local pour tagger les articles générés
-- depuis benin-sports.com. api_football_id = 479 (Benin Premier League).
-- ============================================================================
INSERT INTO leagues (name, slug, country, country_code, tier, api_football_id)
VALUES
  ('Celtiis Ligue 1 Bénin', 'celtiis-ligue-1-benin', 'Bénin', 'BJ', 1, 479),
  ('Botola Pro', 'botola-pro', 'Maroc', 'MA', 1, 200),
  ('Ligue 1 Pro Tunisie', 'ligue-1-tunisie', 'Tunisie', 'TN', 1, 202),
  ('LINAFOOT', 'linafoot-rdc', 'RD Congo', 'CD', 1, 204)
ON CONFLICT (slug) DO NOTHING;
