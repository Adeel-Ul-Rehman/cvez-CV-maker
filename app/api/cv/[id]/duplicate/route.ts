import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { MAX_CVS_PER_USER } from '@/lib/cv/limits';
import { forbidden, handleApiError, notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth(req);
    const sourceId = params.id;

    const duplicatedCv = await withTransaction(async (tx) => {
      // 1. Lock user row and check 5-CV limit
      const userRows = await tx.sql`
        SELECT id, cv_count
        FROM users
        WHERE id = ${authUser.userId}
        FOR UPDATE;
      `;

      if (!userRows || userRows.length === 0) {
        throw notFound('User not found', 'USER_NOT_FOUND');
      }

      const currentCount = Number(userRows[0].cv_count) || 0;
      if (currentCount >= MAX_CVS_PER_USER) {
        throw forbidden(
          `You have reached the maximum limit of ${MAX_CVS_PER_USER} CVs (current count: ${currentCount})`,
          'CV_LIMIT_REACHED'
        );
      }

      // 2. Fetch source CV with owner verification
      const sourceRows = await tx.sql`
        SELECT * FROM cvs
        WHERE id = ${sourceId} AND user_id = ${authUser.userId}
        LIMIT 1;
      `;

      if (!sourceRows || sourceRows.length === 0) {
        throw notFound('CV not found', 'CV_NOT_FOUND');
      }

      const source = sourceRows[0];
      const newTitle = `${source.title} (copy)`;

      const dataJson = typeof source.data === 'string' ? source.data : JSON.stringify(source.data);
      const configJson = typeof source.config === 'string' ? source.config : JSON.stringify(source.config);

      // 3. Insert duplicate CV (fresh start, is_public=false, public_slug=null)
      const insertedRows = await tx.sql`
        INSERT INTO cvs (
          user_id,
          title,
          template_key,
          data,
          config,
          is_public,
          public_slug
        )
        VALUES (
          ${authUser.userId},
          ${newTitle},
          ${source.template_key},
          ${dataJson}::jsonb,
          ${configJson}::jsonb,
          FALSE,
          NULL
        )
        RETURNING *;
      `;

      // 4. Increment cv_count
      await tx.sql`
        UPDATE users
        SET cv_count = cv_count + 1, updated_at = now()
        WHERE id = ${authUser.userId};
      `;

      return insertedRows[0];
    });

    return NextResponse.json({
      ok: true,
      data: {
        cv: duplicatedCv,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
