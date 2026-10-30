import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { MAX_CVS_PER_USER } from '@/lib/cv/limits';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const rows = await sql`
      SELECT id, title, template_key, is_public, public_slug, created_at, updated_at
      FROM cvs
      WHERE user_id = ${authUser.userId}
      ORDER BY updated_at DESC;
    `;

    return NextResponse.json({
      ok: true,
      data: {
        cvs: rows,
        total: rows.length,
        limit: MAX_CVS_PER_USER,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
