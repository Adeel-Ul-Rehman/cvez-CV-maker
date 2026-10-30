import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { handleApiError, notFound } from '@/lib/errors';
import { logAdminAction } from '@/lib/admin/audit';
import { enforceAdminRateLimit } from '@/lib/admin/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, true);

    const { id } = params;

    const existingRows = await sql`
      SELECT id, template_key, is_active
      FROM templates
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (!existingRows || existingRows.length === 0) {
      throw notFound('Template not found', 'TEMPLATE_NOT_FOUND');
    }

    const current = existingRows[0];
    const newActive = !current.is_active;

    const updatedRows = await sql`
      UPDATE templates
      SET is_active = ${newActive},
          updated_at = now()
      WHERE id = ${id}
      RETURNING
        id,
        template_key AS "templateKey",
        name,
        description,
        category,
        thumbnail_url AS "thumbnailUrl",
        definition,
        is_active AS "isActive",
        display_order AS "displayOrder",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `;

    const updated = updatedRows[0];

    logAdminAction(admin.userId, 'template.toggle', 'template', id, {
      templateKey: updated.templateKey,
      previousActive: current.is_active,
      newActive,
    });

    return NextResponse.json({
      ok: true,
      data: {
        template: {
          ...updated,
          createdAt: new Date(updated.createdAt).toISOString(),
          updatedAt: new Date(updated.updatedAt).toISOString(),
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
