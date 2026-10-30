import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { adminAiUsageQuerySchema } from '@/lib/schemas/admin';
import { enforceAdminRateLimit } from '@/lib/admin/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, false);

    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, feature, provider, success, from, to } =
      adminAiUsageQuerySchema.parse(queryParams);

    const offset = (page - 1) * limit;

    // Filtered total count
    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM ai_usage_logs a
      WHERE
        (${feature || null}::text IS NULL OR a.feature = ${feature})
        AND (${provider || null}::text IS NULL OR a.provider = ${provider})
        AND (${success === undefined ? null : success}::boolean IS NULL OR a.success = ${success})
        AND (${from || null}::timestamptz IS NULL OR a.created_at >= ${from}::timestamptz)
        AND (${to || null}::timestamptz IS NULL OR a.created_at <= ${to}::timestamptz);
    `;
    const total = countRows[0]?.total || 0;

    // Filtered paginated logs
    const rows = await sql`
      SELECT
        a.id,
        a.user_id AS "userId",
        u.email AS "userEmail",
        a.feature,
        a.provider,
        a.model,
        a.tokens_used AS "tokensUsed",
        a.success,
        a.error_code AS "errorCode",
        a.duration_ms AS "durationMs",
        a.created_at AS "createdAt"
      FROM ai_usage_logs a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE
        (${feature || null}::text IS NULL OR a.feature = ${feature})
        AND (${provider || null}::text IS NULL OR a.provider = ${provider})
        AND (${success === undefined ? null : success}::boolean IS NULL OR a.success = ${success})
        AND (${from || null}::timestamptz IS NULL OR a.created_at >= ${from}::timestamptz)
        AND (${to || null}::timestamptz IS NULL OR a.created_at <= ${to}::timestamptz)
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    // Filtered aggregate summary
    const [overallAgg, byFeatureRows, byProviderRows] = await Promise.all([
      sql`
        SELECT
          COALESCE(
            ROUND(
              (COUNT(*) FILTER (WHERE a.success = TRUE)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100,
              1
            ),
            0
          )::float AS "successRate",
          COALESCE(ROUND(AVG(a.duration_ms)), 0)::int AS "avgDurationMs"
        FROM ai_usage_logs a
        WHERE
          (${feature || null}::text IS NULL OR a.feature = ${feature})
          AND (${provider || null}::text IS NULL OR a.provider = ${provider})
          AND (${success === undefined ? null : success}::boolean IS NULL OR a.success = ${success})
          AND (${from || null}::timestamptz IS NULL OR a.created_at >= ${from}::timestamptz)
          AND (${to || null}::timestamptz IS NULL OR a.created_at <= ${to}::timestamptz);
      `,
      sql`
        SELECT
          a.feature,
          COUNT(*)::int AS count
        FROM ai_usage_logs a
        WHERE
          (${feature || null}::text IS NULL OR a.feature = ${feature})
          AND (${provider || null}::text IS NULL OR a.provider = ${provider})
          AND (${success === undefined ? null : success}::boolean IS NULL OR a.success = ${success})
          AND (${from || null}::timestamptz IS NULL OR a.created_at >= ${from}::timestamptz)
          AND (${to || null}::timestamptz IS NULL OR a.created_at <= ${to}::timestamptz)
        GROUP BY a.feature
        ORDER BY count DESC;
      `,
      sql`
        SELECT
          a.provider,
          COUNT(*)::int AS count
        FROM ai_usage_logs a
        WHERE
          (${feature || null}::text IS NULL OR a.feature = ${feature})
          AND (${provider || null}::text IS NULL OR a.provider = ${provider})
          AND (${success === undefined ? null : success}::boolean IS NULL OR a.success = ${success})
          AND (${from || null}::timestamptz IS NULL OR a.created_at >= ${from}::timestamptz)
          AND (${to || null}::timestamptz IS NULL OR a.created_at <= ${to}::timestamptz)
        GROUP BY a.provider
        ORDER BY count DESC;
      `,
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        logs: rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          userEmail: r.userEmail,
          feature: r.feature,
          provider: r.provider,
          model: r.model,
          tokensUsed: r.tokensUsed,
          success: r.success,
          errorCode: r.errorCode,
          durationMs: r.durationMs,
          createdAt: new Date(r.createdAt).toISOString(),
        })),
        total,
        page,
        limit,
        summary: {
          successRate: Number(overallAgg[0]?.successRate || 0),
          avgDurationMs: Number(overallAgg[0]?.avgDurationMs || 0),
          byFeature: byFeatureRows.map((r) => ({
            feature: r.feature,
            count: r.count,
          })),
          byProvider: byProviderRows.map((r) => ({
            provider: r.provider,
            count: r.count,
          })),
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
