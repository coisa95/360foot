-- ============================================
-- 360 FOOT — Setup complet de la base de données
-- Copie-colle ce fichier dans Supabase SQL Editor et clique "Run"
-- ============================================

-- Ligues couvertes
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT,
  logo_url TEXT,
  tier INTEGER DEFAULT 2,
  api_football_id INTEGER UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Équipes
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  league_id UUID REFERENCES leagues(id),
  logo_url TEXT,
  country TEXT,
  venue TEXT,
  coach TEXT,
  api_football_id INTEGER UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Joueurs
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  team_id UUID REFERENCES teams(id),
  nationality TEXT,
  position TEXT,
  age INTEGER,
  photo_url TEXT,
  stats_json JSONB,
  api_football_id INTEGER UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matchs
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  league_id UUID REFERENCES leagues(id),
  slug TEXT UNIQUE NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'NS',
  score_home INTEGER,
  score_away INTEGER,
  stats_json JSONB,
  events_json JSONB,
  lineups_json JSONB,
  api_football_id INTEGER UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Articles générés par l'IA
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  type TEXT NOT NULL,
  match_id UUID REFERENCES matches(id),
  league_id UUID REFERENCES leagues(id),
  team_id UUID REFERENCES teams(id),
  player_id UUID REFERENCES players(id),
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  tags TEXT[],
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Classements
CREATE TABLE IF NOT EXISTS standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id),
  season TEXT NOT NULL,
  data_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transferts
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  player_id UUID REFERENCES players(id),
  from_team TEXT,
  to_team TEXT,
  fee TEXT,
  transfer_type TEXT,
  date DATE,
  article_id UUID REFERENCES articles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookmakers (affiliation)
CREATE TABLE IF NOT EXISTS bookmakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  bonus_json JSONB,
  affiliate_url TEXT NOT NULL,
  countries TEXT[],
  priority INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true
);

-- Tracking clics affiliation
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmaker_id UUID REFERENCES bookmakers(id),
  article_id UUID,
  page_url TEXT,
  country TEXT,
  sub_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEX pour les performances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league_id);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_standings_league ON standings(league_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_timestamp ON affiliate_clicks(timestamp);

-- ============================================
-- DONNÉES INITIALES : Ligues
-- ============================================
INSERT INTO leagues (name, slug, country, country_code, tier, api_football_id) VALUES
  ('Ligue 1 Côte d''Ivoire', 'ligue-1-cote-divoire', 'Côte d''Ivoire', 'CI', 1, 373),
  ('Ligue Pro Sénégal', 'ligue-pro-senegal', 'Sénégal', 'SN', 1, 384),
  ('Elite One Cameroun', 'elite-one-cameroun', 'Cameroun', 'CM', 1, 406),
  ('Primus Ligue Mali', 'primus-ligue-mali', 'Mali', 'ML', 1, 394),
  ('Fasofoot Burkina Faso', 'fasofoot-burkina-faso', 'Burkina Faso', 'BF', 1, 398),
  ('Ligue 1 France', 'ligue-1-france', 'France', 'FR', 1, 61),
  ('Premier League', 'premier-league', 'Angleterre', 'GB', 1, 39),
  ('La Liga', 'la-liga', 'Espagne', 'ES', 1, 140),
  ('Serie A', 'serie-a', 'Italie', 'IT', 1, 135),
  ('Champions League', 'champions-league', 'Europe', 'EU', 1, 2),
  ('Europa League', 'europa-league', 'Europe', 'EU', 1, 3),
  ('CAN', 'can', 'Afrique', 'AF', 1, 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- DONNÉES INITIALES : Bookmakers
-- ============================================
INSERT INTO bookmakers (name, slug, affiliate_url, bonus_json, countries, priority) VALUES
  ('1xBet', '1xbet', 'https://1xbet.com/?ref=360foot', '{"CI": "Bonus 100% jusqu''à 130€", "SN": "Bonus 100% jusqu''à 130€", "CM": "Bonus 100% jusqu''à 130€", "default": "Bonus 100%"}', ARRAY['CI', 'SN', 'CM', 'ML', 'BF'], 1),
  ('PremierBet', 'premierbet', 'https://premierbet.com/?ref=360foot', '{"ML": "Bonus 50%", "BF": "Bonus 50%", "default": "Bonus 50%"}', ARRAY['ML', 'BF', 'CM'], 2),
  ('Betclic', 'betclic', 'https://betclic.com/?ref=360foot', '{"FR": "100€ offerts", "default": "100€ offerts"}', ARRAY['FR'], 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SÉCURITÉ : Row Level Security (RLS)
-- ============================================
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Politique : lecture publique pour toutes les tables (site public, pas de login)
CREATE POLICY "Public read" ON leagues FOR SELECT USING (true);
CREATE POLICY "Public read" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read" ON players FOR SELECT USING (true);
CREATE POLICY "Public read" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read" ON standings FOR SELECT USING (true);
CREATE POLICY "Public read" ON transfers FOR SELECT USING (true);
CREATE POLICY "Public read" ON bookmakers FOR SELECT USING (true);

-- Politique : écriture via service_role uniquement (CRON jobs)
CREATE POLICY "Service insert" ON affiliate_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read" ON affiliate_clicks FOR SELECT USING (true);
