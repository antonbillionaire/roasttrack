-- Add IP address column for free preview rate limiting
ALTER TABLE generations ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Index for fast IP-based lookups
CREATE INDEX IF NOT EXISTS idx_generations_ip_preview
  ON generations(ip_address, is_free_preview, created_at)
  WHERE is_free_preview = true;
