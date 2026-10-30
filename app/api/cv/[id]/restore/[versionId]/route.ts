import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { snapshotCurrentVersion, pruneOldVersions } from '@/lib/cv/versions';
import { handleApiError, notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string; versionId: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth(req);
    const { id: cvId, versionId } = params;

    const restoredCv = await withTransaction(async (tx) => {
      // 1. Fetch CV with owner check & lock
      const cvRows = await tx.sql`
        SELECT * FROM cvs
        WHERE id = ${cvId} AND user_id = ${authUser.userId}
        FOR UPDATE;
      `;

      if (!cvRows || cvRows.length === 0) {
        throw notFound('CV not found', 'CV_NOT_FOUND');
      }

      const currentCv = cvRows[0];

      // 2. Fetch version (must belong to this CV)
      const versionRows = await tx.sql`
        SELECT id, data, config
        FROM cv_versions
        WHERE id = ${versionId} AND cv_id = ${cvId}
        LIMIT 1;
      `;

      if (!versionRows || versionRows.length === 0) {
        throw notFound('Version not found', 'VERSION_NOT_FOUND');
      }

      const targetVersion = versionRows[0];

      // 3. Snapshot current CV state before restoring
      await snapshotCurrentVersion(currentCv, tx);

      // 4. Update CV with version data and config
      const dataJson = typeof targetVersion.data === 'string'
        ? targetVersion.data
        : JSON.stringify(targetVersion.data);
      const configJson = typeof targetVersion.config === 'string'
        ? targetVersion.config
        : JSON.stringify(targetVersion.config);

      const updatedRows = await tx.sql`
        UPDATE cvs
        SET data = ${dataJson}::jsonb,
            config = ${configJson}::jsonb,
            updated_at = now()
        WHERE id = ${cvId} AND user_id = ${authUser.userId}
        RETURNING *;
      `;

      // 5. Enforce MAX_VERSIONS_PER_CV
      await pruneOldVersions(cvId, tx);

      return updatedRows[0];
    });

    return NextResponse.json({
      ok: true,
      data: {
        cv: restoredCv,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
