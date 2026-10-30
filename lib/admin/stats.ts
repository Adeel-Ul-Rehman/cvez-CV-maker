import { sql } from '@/lib/db';

export interface OverviewStats {
  users: {
    total: number;
    verified: number;
    verifiedToday: number;
    newThisWeek: number;
  };
  cvs: {
    total: number;
    createdToday: number;
    byTemplate: { templateKey: string; count: number }[];
  };
  exports: {
    estimatedToday: number;
  };
  ai: {
    callsToday: number;
    successRate: number;
    byProvider: { provider: string; count: number }[];
  };
  versions: {
    total: number;
    avgPerCv: number;
  };
}

export interface RecentActivityItem {
  id: string;
  adminId: string;
  adminEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const [
    userStatsRows,
    cvStatsRows,
    cvTemplateRows,
    exportRows,
    aiStatsRows,
    aiProviderRows,
    versionRows,
  ] = await Promise.all([
    // 1. Users block
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE email_verified = TRUE)::int AS verified,
        COUNT(*) FILTER (WHERE email_verified = TRUE AND updated_at >= date_trunc('day', now()))::int AS verified_today,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS new_this_week
      FROM users;
    `,
    // 2. CVs block
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS created_today
      FROM cvs;
    `,
    // 3. CVs by template
    sql`
      SELECT
        template_key AS "templateKey",
        COUNT(*)::int AS count
      FROM cvs
      GROUP BY template_key
      ORDER BY count DESC;
    `,
    // 4. Exports block
    sql`
      SELECT
        COUNT(*)::int AS estimated_today
      FROM export_events
      WHERE created_at >= date_trunc('day', now());
    `,
    // 5. AI stats block
    sql`
      SELECT
        COUNT(*)::int AS calls_today,
        COALESCE(
          ROUND(
            (COUNT(*) FILTER (WHERE success = TRUE)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100,
            1
          ),
          0
        )::float AS success_rate
      FROM ai_usage_logs
      WHERE created_at >= date_trunc('day', now());
    `,
    // 6. AI by provider
    sql`
      SELECT
        provider,
        COUNT(*)::int AS count
      FROM ai_usage_logs
      GROUP BY provider
      ORDER BY count DESC;
    `,
    // 7. Versions block
    sql`
      SELECT
        COUNT(*)::int AS total
      FROM cv_versions;
    `,
  ]);

  const userStats = userStatsRows[0] || { total: 0, verified: 0, verified_today: 0, new_this_week: 0 };
  const cvStats = cvStatsRows[0] || { total: 0, created_today: 0 };
  const exportStats = exportRows[0] || { estimated_today: 0 };
  const aiStats = aiStatsRows[0] || { calls_today: 0, success_rate: 0 };
  const versionStats = versionRows[0] || { total: 0 };

  const cvTotal = cvStats.total || 0;
  const versionTotal = versionStats.total || 0;
  const avgPerCv = cvTotal > 0 ? Number((versionTotal / cvTotal).toFixed(2)) : 0;

  return {
    users: {
      total: userStats.total,
      verified: userStats.verified,
      verifiedToday: userStats.verified_today,
      newThisWeek: userStats.new_this_week,
    },
    cvs: {
      total: cvTotal,
      createdToday: cvStats.created_today,
      byTemplate: cvTemplateRows.map((r) => ({
        templateKey: r.templateKey,
        count: r.count,
      })),
    },
    exports: {
      estimatedToday: exportStats.estimated_today,
    },
    ai: {
      callsToday: aiStats.calls_today,
      successRate: Number(aiStats.success_rate),
      byProvider: aiProviderRows.map((r) => ({
        provider: r.provider,
        count: r.count,
      })),
    },
    versions: {
      total: versionTotal,
      avgPerCv,
    },
  };
}

export async function getRecentActivity(limit = 20): Promise<RecentActivityItem[]> {
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const rows = await sql`
    SELECT
      a.id,
      a.admin_id AS "adminId",
      u.email AS "adminEmail",
      a.action,
      a.target_type AS "targetType",
      a.target_id AS "targetId",
      a.metadata,
      a.created_at AS "createdAt"
    FROM admin_audit_logs a
    LEFT JOIN users u ON u.id = a.admin_id
    ORDER BY a.created_at DESC
    LIMIT ${safeLimit};
  `;

  return rows.map((r) => ({
    id: r.id,
    adminId: r.adminId,
    adminEmail: r.adminEmail,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    metadata: (r.metadata as Record<string, any>) || {},
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}
