import { NextRequest, NextResponse } from 'next/server';
import { sql, withTransaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { updateCvSchema } from '@/lib/schemas/cv';
import { cvConfigSchema, cvDataSchema } from '@/lib/cv/schema';
import { snapshotCurrentVersion, pruneOldVersions } from '@/lib/cv/versions';
import { generateUniquePublicSlug } from '@/lib/cv/slug';
import { badRequest, handleApiError, notFound } from '@/lib/errors';
import { getTemplate } from '@/templates/registry';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// -------------------------------------------------------------
// GET /api/cv/[id] — Fetch a single CV (owner only)
// -------------------------------------------------------------
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth(req);
    const cvId = params.id;

    const rows = await sql`
      SELECT * FROM cvs
      WHERE id = ${cvId} AND user_id = ${authUser.userId}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      throw notFound('CV not found', 'CV_NOT_FOUND');
    }

    const cv = rows[0];

    const versionRows = await sql`
      SELECT COUNT(*) as count FROM cv_versions WHERE cv_id = ${cvId};
    `;
    const count = Number(versionRows[0]?.count) || 0;

    return NextResponse.json({
      ok: true,
      data: {
        cv: {
          ...cv,
          versionCount: count,
          version_count: count,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// -------------------------------------------------------------
// PATCH /api/cv/[id] — Update CV (owner only)
// -------------------------------------------------------------
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth(req);
    const cvId = params.id;

    const body = await req.json();
    const parsed = updateCvSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw badRequest(firstIssue?.message || 'Invalid update data', 'VALIDATION_ERROR');
    }

    const { title, templateKey, data: partialData, config: partialConfig, is_public } = parsed.data;

    if (templateKey && !getTemplate(templateKey)) {
      throw badRequest(`Template '${templateKey}' is not supported`, 'INVALID_TEMPLATE');
    }

    const updatedCv = await withTransaction(async (tx) => {
      // 1. Fetch CV with row lock
      const existingRows = await tx.sql`
        SELECT * FROM cvs
        WHERE id = ${cvId} AND user_id = ${authUser.userId}
        FOR UPDATE;
      `;

      if (!existingRows || existingRows.length === 0) {
        throw notFound('CV not found', 'CV_NOT_FOUND');
      }

      const existing = existingRows[0];

      // 2. Resolve merged data
      let finalData = existing.data;
      if (partialData) {
        const currentData = existing.data || {};
        const merged = {
          basics: {
            ...(currentData.basics || {}),
            ...(partialData.basics || {}),
          },
          sections: partialData.sections !== undefined ? partialData.sections : (currentData.sections || []),
        };
        finalData = cvDataSchema.parse(merged);
      }

      // 3. Resolve merged config
      let finalConfig = existing.config;
      if (partialConfig) {
        const currentConfig = existing.config || {};
        const merged = {
          ...currentConfig,
          ...partialConfig,
        };
        finalConfig = cvConfigSchema.parse(merged);
      }

      // 4. Resolve template key and title
      const finalTitle = title !== undefined ? title : existing.title;
      const finalTemplateKey = templateKey !== undefined ? templateKey : existing.template_key;

      // 5. Resolve public sharing status & slug
      let finalIsPublic = existing.is_public;
      let finalPublicSlug = existing.public_slug;

      if (is_public !== undefined) {
        finalIsPublic = is_public;
        if (is_public && !finalPublicSlug) {
          finalPublicSlug = await generateUniquePublicSlug();
        } else if (!is_public) {
          finalPublicSlug = null;
        }
      }

      // 6. Snapshot current version before updating
      await snapshotCurrentVersion(existing, tx);

      // 7. Update CV
      const dataJson = JSON.stringify(finalData);
      const configJson = JSON.stringify(finalConfig);

      const updatedRows = await tx.sql`
        UPDATE cvs
        SET title = ${finalTitle},
            template_key = ${finalTemplateKey},
            data = ${dataJson}::jsonb,
            config = ${configJson}::jsonb,
            is_public = ${finalIsPublic},
            public_slug = ${finalPublicSlug},
            updated_at = now()
        WHERE id = ${cvId} AND user_id = ${authUser.userId}
        RETURNING *;
      `;

      // 8. Prune older versions beyond 20
      await pruneOldVersions(cvId, tx);

      return updatedRows[0];
    });

    return NextResponse.json({
      ok: true,
      data: {
        cv: updatedCv,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// -------------------------------------------------------------
// DELETE /api/cv/[id] — Delete CV (owner only)
// -------------------------------------------------------------
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth(req);
    const cvId = params.id;

    await withTransaction(async (tx) => {
      const existingRows = await tx.sql`
        SELECT id FROM cvs
        WHERE id = ${cvId} AND user_id = ${authUser.userId}
        FOR UPDATE;
      `;

      if (!existingRows || existingRows.length === 0) {
        throw notFound('CV not found', 'CV_NOT_FOUND');
      }

      // Delete CV (cv_versions cascade automatically)
      await tx.sql`
        DELETE FROM cvs
        WHERE id = ${cvId} AND user_id = ${authUser.userId};
      `;

      // Decrement cv_count safely
      await tx.sql`
        UPDATE users
        SET cv_count = GREATEST(cv_count - 1, 0), updated_at = now()
        WHERE id = ${authUser.userId};
      `;
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
