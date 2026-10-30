import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { handleApiError, notFound } from '@/lib/errors';
import { logAdminAction } from '@/lib/admin/audit';
import { enforceAdminRateLimit } from '@/lib/admin/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, false);

    const { id } = params;

    const rows = await sql`
      SELECT
        c.id,
        c.user_id AS "userId",
        u.email AS "userEmail",
        u.full_name AS "userFullName",
        c.title,
        c.template_key AS "templateKey",
        c.data,
        c.config,
        c.is_public AS "isPublic",
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        (SELECT COUNT(*)::int FROM cv_versions cv WHERE cv.cv_id = c.id) AS "versionCount",
        (SELECT COUNT(*)::int FROM export_events ee WHERE ee.cv_id = c.id) AS "exportCount"
      FROM cvs c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ${id}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      throw notFound('CV not found', 'CV_NOT_FOUND');
    }

    const cv = rows[0];

    // Audit log this admin inspection of a user CV
    logAdminAction(admin.userId, 'cv.inspect', 'cv', id, {
      ownerId: cv.userId,
      templateKey: cv.templateKey,
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: cv.id,
        title: cv.title,
        templateKey: cv.templateKey,
        data: cv.data,
        config: cv.config,
        isPublic: cv.isPublic,
        createdAt: new Date(cv.createdAt).toISOString(),
        updatedAt: new Date(cv.updatedAt).toISOString(),
        versionCount: cv.versionCount,
        exportCount: cv.exportCount,
        owner: {
          id: cv.userId,
          email: cv.userEmail,
          fullName: cv.userFullName,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, true);

    const { id } = params;

    const rows = await sql`
      SELECT id, user_id AS "userId", title, template_key AS "templateKey"
      FROM cvs
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      throw notFound('CV not found', 'CV_NOT_FOUND');
    }

    const cv = rows[0];

    // Delete CV and decrement user cv_count atomically
    await sql`
      WITH deleted AS (
        DELETE FROM cvs WHERE id = ${id}
        RETURNING user_id
      )
      UPDATE users
      SET cv_count = GREATEST(0, cv_count - 1),
          updated_at = now()
      WHERE id = (SELECT user_id FROM deleted);
    `;

    logAdminAction(admin.userId, 'cv.delete', 'cv', id, {
      ownerId: cv.userId,
      title: cv.title,
      templateKey: cv.templateKey,
    });

    return NextResponse.json({
      ok: true,
      data: {
        message: 'CV deleted successfully',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
