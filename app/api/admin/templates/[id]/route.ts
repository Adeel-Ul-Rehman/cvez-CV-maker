import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { badRequest, conflict, handleApiError, notFound } from '@/lib/errors';
import { adminUpdateTemplateSchema } from '@/lib/schemas/admin';
import { logAdminAction } from '@/lib/admin/audit';
import { enforceAdminRateLimit } from '@/lib/admin/rate-limit';
import { deleteAsset } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, true);

    const { id } = params;
    const body = await req.json();
    const { name, description, category, isActive, displayOrder, thumbnailUrl } =
      adminUpdateTemplateSchema.parse(body);

    const existingRows = await sql`
      SELECT id, template_key, thumbnail_public_id
      FROM templates
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (!existingRows || existingRows.length === 0) {
      throw notFound('Template not found', 'TEMPLATE_NOT_FOUND');
    }

    // Validate thumbnailUrl if provided
    let newPublicId: string | null = null;
    if (thumbnailUrl) {
      let isValidUrl = false;
      try {
        const parsed = new URL(thumbnailUrl);
        isValidUrl =
          parsed.protocol === 'https:' &&
          parsed.hostname.startsWith('res.cloudinary.com') &&
          parsed.pathname.includes('cv-maker/template-thumbnails');
      } catch {
        isValidUrl = false;
      }

      if (!isValidUrl) {
        throw badRequest(
          'thumbnailUrl must be an HTTPS Cloudinary URL belonging to cv-maker/template-thumbnails/*',
          'INVALID_THUMBNAIL_URL'
        );
      }

      const match = thumbnailUrl.match(/cv-maker\/template-thumbnails\/[^.]+/);
      if (match) {
        newPublicId = match[0];
      }
    }

    const updatedRows = await sql`
      UPDATE templates
      SET
        name = COALESCE(${name || null}, name),
        description = COALESCE(${description || null}, description),
        category = COALESCE(${category || null}, category),
        is_active = COALESCE(${isActive === undefined ? null : isActive}, is_active),
        display_order = COALESCE(${displayOrder === undefined ? null : displayOrder}, display_order),
        thumbnail_url = COALESCE(${thumbnailUrl || null}, thumbnail_url),
        thumbnail_public_id = COALESCE(${newPublicId}, thumbnail_public_id),
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

    logAdminAction(admin.userId, 'template.update', 'template', id, {
      templateKey: updated.templateKey,
      updatedFields: Object.keys(body),
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, true);

    const { id } = params;

    const existingRows = await sql`
      SELECT id, template_key, thumbnail_public_id
      FROM templates
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (!existingRows || existingRows.length === 0) {
      throw notFound('Template not found', 'TEMPLATE_NOT_FOUND');
    }

    const template = existingRows[0];

    // Check if any CVs currently use this template
    const cvCountRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM cvs
      WHERE template_key = ${template.template_key};
    `;
    const cvCount = cvCountRows[0]?.count || 0;

    if (cvCount > 0) {
      throw conflict(
        `Cannot delete template '${template.template_key}': ${cvCount} CV(s) are currently using it.`,
        'TEMPLATE_IN_USE'
      );
    }

    // Optionally clean Cloudinary thumbnail
    if (template.thumbnail_public_id) {
      try {
        await deleteAsset(template.thumbnail_public_id);
      } catch (err) {
        console.warn('Failed to delete thumbnail from Cloudinary:', err);
      }
    }

    await sql`DELETE FROM templates WHERE id = ${id};`;

    logAdminAction(admin.userId, 'template.delete', 'template', id, {
      templateKey: template.template_key,
    });

    return NextResponse.json({
      ok: true,
      data: {
        message: 'Template deleted successfully',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
