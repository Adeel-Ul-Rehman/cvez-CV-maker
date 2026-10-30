import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { adminCvsQuerySchema } from '@/lib/schemas/admin';
import { enforceAdminRateLimit } from '@/lib/admin/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, false);

    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, templateKey, isPublic, userId } = adminCvsQuerySchema.parse(queryParams);

    const offset = (page - 1) * limit;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM cvs c
      WHERE
        (${templateKey || null}::text IS NULL OR c.template_key = ${templateKey})
        AND (${isPublic === undefined ? null : isPublic}::boolean IS NULL OR c.is_public = ${isPublic})
        AND (${userId || null}::uuid IS NULL OR c.user_id = ${userId}::uuid);
    `;
    const total = countRows[0]?.total || 0;

    const rows = await sql`
      SELECT
        c.id,
        c.user_id AS "userId",
        u.email AS "userEmail",
        c.title,
        c.template_key AS "templateKey",
        c.is_public AS "isPublic",
        c.updated_at AS "updatedAt",
        (SELECT COUNT(*)::int FROM cv_versions cv WHERE cv.cv_id = c.id) AS "versionCount",
        (SELECT COUNT(*)::int FROM export_events ee WHERE ee.cv_id = c.id) AS "exportCount"
      FROM cvs c
      JOIN users u ON u.id = c.user_id
      WHERE
        (${templateKey || null}::text IS NULL OR c.template_key = ${templateKey})
        AND (${isPublic === undefined ? null : isPublic}::boolean IS NULL OR c.is_public = ${isPublic})
        AND (${userId || null}::uuid IS NULL OR c.user_id = ${userId}::uuid)
      ORDER BY c.updated_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return NextResponse.json({
      ok: true,
      data: {
        cvs: rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          userEmail: r.userEmail,
          title: r.title,
          templateKey: r.templateKey,
          isPublic: r.isPublic,
          updatedAt: new Date(r.updatedAt).toISOString(),
          versionCount: r.versionCount,
          exportCount: r.exportCount,
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
