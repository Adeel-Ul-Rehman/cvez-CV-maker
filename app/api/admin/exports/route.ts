import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { adminExportsQuerySchema } from '@/lib/schemas/admin';
import { enforceAdminRateLimit } from '@/lib/admin/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, false);

    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, format, userId, success } = adminExportsQuerySchema.parse(queryParams);

    const offset = (page - 1) * limit;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM export_events ee
      WHERE
        (${format || null}::text IS NULL OR ee.format = ${format})
        AND (${userId || null}::uuid IS NULL OR ee.user_id = ${userId}::uuid)
        AND (${success === undefined ? null : success}::boolean IS NULL OR ee.success = ${success});
    `;
    const total = countRows[0]?.total || 0;

    const rows = await sql`
      SELECT
        ee.id,
        ee.user_id AS "userId",
        u.email AS "userEmail",
        ee.cv_id AS "cvId",
        COALESCE(c.title, 'Deleted CV') AS "cvTitle",
        ee.format,
        ee.template_key AS "templateKey",
        ee.duration_ms AS "durationMs",
        ee.success,
        ee.error_code AS "errorCode",
        ee.created_at AS "createdAt"
      FROM export_events ee
      LEFT JOIN users u ON u.id = ee.user_id
      LEFT JOIN cvs c ON c.id = ee.cv_id
      WHERE
        (${format || null}::text IS NULL OR ee.format = ${format})
        AND (${userId || null}::uuid IS NULL OR ee.user_id = ${userId}::uuid)
        AND (${success === undefined ? null : success}::boolean IS NULL OR ee.success = ${success})
      ORDER BY ee.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return NextResponse.json({
      ok: true,
      data: {
        exports: rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          userEmail: r.userEmail,
          cvId: r.cvId,
          cvTitle: r.cvTitle,
          format: r.format,
          templateKey: r.templateKey,
          durationMs: r.durationMs,
          success: r.success,
          errorCode: r.errorCode,
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
