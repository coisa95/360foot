-- Enrich players table with Transfermarkt data
ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS number INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS foot TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS market_value TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS market_value_num BIGINT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS transfermarkt_id TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS career_json JSONB;

-- Enrich transfers table
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS player_photo TEXT;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS player_nationality TEXT;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS player_position TEXT;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS player_age INTEGER;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS market_value TEXT;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS from_team_logo TEXT;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS to_team_logo TEXT;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS transfermarkt_player_id TEXT;

-- Mapping table for cross-referencing IDs between APIs
CREATE TABLE IF NOT EXISTS player_id_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_football_id INTEGER,
  transfermarkt_id TEXT,
  player_slug TEXT,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(api_football_id),
  UNIQUE(transfermarkt_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_transfermarkt_id ON players(transfermarkt_id);
CREATE INDEX IF NOT EXISTS idx_players_market_value_num ON players(market_value_num DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_transfermarkt ON transfers(transfermarkt_player_id);
CREATE INDEX IF NOT EXISTS idx_player_mapping_slug ON player_id_mapping(player_slug);
