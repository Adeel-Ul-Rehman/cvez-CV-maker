import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { adminAuditLogsQuerySchema } from '@/lib/schemas/admin';
import { enforceAdminRateLimit } from '@/lib/admin/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, false);

    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, action, adminId, targetType, from, to } =
      adminAuditLogsQuerySchema.parse(queryParams);

    const offset = (page - 1) * limit;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM admin_audit_logs a
      WHERE
        (${action || null}::text IS NULL OR a.action = ${action})
        AND (${adminId || null}::uuid IS NULL OR a.admin_id = ${adminId}::uuid)
        AND (${targetType || null}::text IS NULL OR a.target_type = ${targetType})
        AND (${from || null}::timestamptz IS NULL OR a.created_at >= ${from}::timestamptz)
        AND (${to || null}::timestamptz IS NULL OR a.created_at <= ${to}::timestamptz);
    `;
    const total = countRows[0]?.total || 0;

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
      WHERE
        (${action || null}::text IS NULL OR a.action = ${action})
        AND (${adminId || null}::uuid IS NULL OR a.admin_id = ${adminId}::uuid)
        AND (${targetType || null}::text IS NULL OR a.target_type = ${targetType})
        AND (${from || null}::timestamptz IS NULL OR a.created_at >= ${from}::timestamptz)
        AND (${to || null}::timestamptz IS NULL OR a.created_at <= ${to}::timestamptz)
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return NextResponse.json({
      ok: true,
      data: {
        logs: rows.map((r) => ({
          id: r.id,
          adminId: r.adminId,
          adminEmail: r.adminEmail,
          action: r.action,
          targetType: r.targetType,
          targetId: r.targetId,
          metadata: r.metadata || {},
          targetSummary: `${r.targetType || 'system'}:${r.targetId || 'global'}`,
          createdAt: new Date(r.createdAt).toISOString(),
        })),
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
