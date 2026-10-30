-- Layer 3 Database Migration: Indexes for public CV access and version pruning

CREATE INDEX IF NOT EXISTS idx_cvs_public_slug_active
  ON cvs (public_slug) WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_versions_cv_created
  ON cv_versions (cv_id, created_at ASC);
