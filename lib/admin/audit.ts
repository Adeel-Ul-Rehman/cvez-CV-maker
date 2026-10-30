import { sql } from '@/lib/db';

export type AdminTargetType = 'user' | 'template' | 'cv' | null;

/**
 * Sanitizes metadata to strictly prevent sensitive data
 * (passwords, tokens, secrets, full CV content) from ever entering the audit logs.
 */
function sanitizeAuditMetadata(metadata?: Record<string, any>): Record<string, any> {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const sanitized: Record<string, any> = {};
  const blockedPatterns = ['password', 'token', 'secret', 'hash', 'data', 'content', 'cvdata'];

  for (const [key, value] of Object.entries(metadata)) {
    const keyLower = key.toLowerCase();
    if (blockedPatterns.some((pattern) => keyLower.includes(pattern))) {
      continue;
    }

    // Truncate long strings (e.g. max 500 chars) to prevent bloated audit logs
    if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = value.slice(0, 497) + '...';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Fire-and-forget audit logger for administrative actions.
 * Never blocks the API response and catches all internal errors.
 */
export function logAdminAction(
  adminId: string,
  action: string,
  targetType?: AdminTargetType,
  targetId?: string | null,
  metadata?: Record<string, any>
): void {
  const safeMetadata = sanitizeAuditMetadata(metadata);

  sql`
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      target_type,
      target_id,
      metadata
    ) VALUES (
      ${adminId},
      ${action},
      ${targetType || null},
      ${targetId || null},
      ${JSON.stringify(safeMetadata)}::jsonb
    );
  `.catch((err) => {
    console.error('Failed to write to admin_audit_logs:', err?.message || err);
  });
}
