-- Layer 7: Admin Audit Logs & Export Events

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NULL,
  target_id UUID NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_created
  ON admin_audit_logs (admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_target
  ON admin_audit_logs (target_type, target_id);

CREATE TABLE IF NOT EXISTS export_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('pdf','docx','png','jpg')),
  template_key TEXT NOT NULL,
  duration_ms INT NULL,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_code TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_export_events_created
  ON export_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_events_user
  ON export_events (user_id, created_at DESC);
