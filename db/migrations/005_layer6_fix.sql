-- Layer 6 Fix: Make user_id in ai_usage_logs nullable for provider-level failure and system logs
ALTER TABLE ai_usage_logs ALTER COLUMN user_id DROP NOT NULL;
