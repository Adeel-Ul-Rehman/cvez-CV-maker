-- Layer 6: AI Usage Logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN (
    'template_recommend',
    'improve_summary',
    'improve_bullets',
    'improve_skills',
    'ats_check',
    'template_search'
  )),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_used INT NULL,
  success BOOLEAN NOT NULL,
  error_code TEXT NULL,
  duration_ms INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created
  ON ai_usage_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_feature_created
  ON ai_usage_logs (feature, created_at DESC);
