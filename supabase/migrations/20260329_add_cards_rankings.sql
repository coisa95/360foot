-- Add top yellow/red cards columns to standings table
ALTER TABLE standings ADD COLUMN IF NOT EXISTS top_yellow_cards_json jsonb;
ALTER TABLE standings ADD COLUMN IF NOT EXISTS top_red_cards_json jsonb;
