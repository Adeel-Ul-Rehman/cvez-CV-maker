import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { badRequest, conflict, handleApiError } from '@/lib/errors';
import { adminCreateTemplateSchema } from '@/lib/schemas/admin';
import { logAdminAction } from '@/lib/admin/audit';
import { enforceAdminRateLimit } from '@/lib/admin/rate-limit';
import { getTemplate } from '@/templates/registry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, false);

    const templates = await sql`
      SELECT
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
        updated_at AS "updatedAt"
      FROM templates
      ORDER BY display_order ASC, created_at ASC;
    `;

    return NextResponse.json({
      ok: true,
      data: {
        templates: templates.map((t) => ({
          id: t.id,
          templateKey: t.templateKey,
          name: t.name,
          description: t.description,
          category: t.category,
          thumbnailUrl: t.thumbnailUrl,
          definition: t.definition,
          isActive: t.isActive,
          displayOrder: t.displayOrder,
          createdAt: new Date(t.createdAt).toISOString(),
          updatedAt: new Date(t.updatedAt).toISOString(),
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, true);

    const body = await req.json();
    const { templateKey, name, description, category, isActive, displayOrder } =
      adminCreateTemplateSchema.parse(body);

    // 1. Verify template exists in code registry
    const registryTemplate = getTemplate(templateKey);
    if (!registryTemplate) {
      throw badRequest(
        `Template key '${templateKey}' is not registered in code. You must implement the React template component in /templates/${templateKey} before creating the DB record.`,
        'TEMPLATE_KEY_NOT_IN_CODE'
      );
    }

    // 2. Check templateKey uniqueness in DB
    const existing = await sql`
      SELECT id FROM templates WHERE template_key = ${templateKey} LIMIT 1;
    `;
    if (existing && existing.length > 0) {
      throw conflict(`Template key '${templateKey}' already exists`, 'TEMPLATE_KEY_EXISTS');
    }

    // 3. Insert new template with definition from registry
    const inserted = await sql`
      INSERT INTO templates (
        template_key,
        name,
        description,
        category,
        definition,
        is_active,
        display_order
      ) VALUES (
        ${templateKey},
        ${name},
        ${description},
        ${category},
        ${JSON.stringify(registryTemplate)}::jsonb,
        ${isActive},
        ${displayOrder}
      )
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

    const newTemplate = inserted[0];

    logAdminAction(admin.userId, 'template.create', 'template', newTemplate.id, {
      templateKey,
      category,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          template: {
            ...newTemplate,
            createdAt: new Date(newTemplate.createdAt).toISOString(),
            updatedAt: new Date(newTemplate.updatedAt).toISOString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
