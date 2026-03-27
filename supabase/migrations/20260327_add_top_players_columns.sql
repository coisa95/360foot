-- Add top scorers and top assists JSON columns to standings table
ALTER TABLE standings ADD COLUMN IF NOT EXISTS top_scorers_json JSONB;
ALTER TABLE standings ADD COLUMN IF NOT EXISTS top_assists_json JSONB;

-- Add predictions_json column to matches table for pre-match predictions
ALTER TABLE matches ADD COLUMN IF NOT EXISTS predictions_json JSONB;

-- Add h2h_json column to matches table for head-to-head history
ALTER TABLE matches ADD COLUMN IF NOT EXISTS h2h_json JSONB;

-- Add injuries_json column to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS injuries_json JSONB;

-- Add team_stats_json column to teams table for detailed team statistics
ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_stats_json JSONB;

-- Add coach details to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach_photo TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach_nationality TEXT;
