-- Layer 4 Database Migration: Thumbnail public ID and template key index

ALTER TABLE templates ADD COLUMN IF NOT EXISTS thumbnail_public_id TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_templates_template_key ON templates(template_key);
