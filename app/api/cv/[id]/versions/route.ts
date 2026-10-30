import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError, notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth(req);
    const cvId = params.id;

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
      SELECT id, created_at
      FROM cv_versions
      WHERE cv_id = ${cvId}
      ORDER BY created_at DESC;
    `;

    return NextResponse.json({
      ok: true,
      data: {
        versions: versionRows,
        count: versionRows.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
