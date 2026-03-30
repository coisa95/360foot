-- Table pour stocker les mots-clés tendance football par pays
CREATE TABLE IF NOT EXISTS trending_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  country_code TEXT NOT NULL,        -- ex: CI, SN, CM, FR
  country_name TEXT NOT NULL,        -- ex: Côte d'Ivoire, Sénégal
  volume_score INT DEFAULT 0,        -- score relatif Google Trends (0-100)
  related_queries TEXT[],            -- requêtes associées
  source TEXT DEFAULT 'google_trends',
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour requêtes fréquentes
CREATE INDEX idx_trending_country ON trending_keywords(country_code);
CREATE INDEX idx_trending_date ON trending_keywords(fetched_at);
CREATE INDEX idx_trending_keyword ON trending_keywords(keyword);

-- Colonne date pour dédoublonnage (plus simple qu'un cast dans l'index)
ALTER TABLE trending_keywords ADD COLUMN fetch_date DATE DEFAULT CURRENT_DATE;

-- Unicité par mot-clé + pays + jour (évite les doublons)
CREATE UNIQUE INDEX idx_trending_unique ON trending_keywords(keyword, country_code, fetch_date);
