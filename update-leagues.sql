-- Corriger les IDs API-Football des ligues africaines
UPDATE leagues SET api_football_id = 386 WHERE slug = 'ligue-1-cote-divoire';
UPDATE leagues SET api_football_id = 403 WHERE slug = 'ligue-pro-senegal';
UPDATE leagues SET api_football_id = 411 WHERE slug = 'elite-one-cameroun';
UPDATE leagues SET api_football_id = 598 WHERE slug = 'primus-ligue-mali';
UPDATE leagues SET api_football_id = 423 WHERE slug = 'fasofoot-burkina-faso';

-- Ajouter les nouvelles compétitions
INSERT INTO leagues (name, slug, country, country_code, tier, api_football_id) VALUES
  ('Bundesliga', 'bundesliga', 'Allemagne', 'DE', 1, 78),
  ('Qualifs Coupe du Monde - Europe', 'qualifs-cdm-europe', 'Monde', 'EU', 1, 32),
  ('Qualifs Coupe du Monde - Amérique du Sud', 'qualifs-cdm-amerique-sud', 'Monde', 'SA', 1, 34),
  ('Matchs amicaux internationaux', 'matchs-amicaux', 'Monde', 'WD', 2, 10)
ON CONFLICT (slug) DO NOTHING;
