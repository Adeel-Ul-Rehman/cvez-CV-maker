import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError, notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string; versionId: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth(req);
    const { id: cvId, versionId } = params;

    // Verify CV belongs to user
    const cvRows = await sql`
      SELECT id FROM cvs
      WHERE id = ${cvId} AND user_id = ${authUser.userId}
      LIMIT 1;
    `;

    if (!cvRows || cvRows.length === 0) {
      throw notFound('CV not found', 'CV_NOT_FOUND');
    }

    const versionRows = await sql`
      SELECT id, data, config, created_at
      FROM cv_versions
      WHERE id = ${versionId} AND cv_id = ${cvId}
      LIMIT 1;
    `;

    if (!versionRows || versionRows.length === 0) {
      throw notFound('Version not found', 'VERSION_NOT_FOUND');
    }

    return NextResponse.json({
      ok: true,
      data: {
        version: versionRows[0],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
