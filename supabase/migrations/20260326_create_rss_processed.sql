CREATE TABLE IF NOT EXISTS rss_processed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT UNIQUE NOT NULL,
  article_id UUID REFERENCES articles(id),
  processed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rss_processed_url ON rss_processed(source_url);
