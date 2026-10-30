import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { env } from '@/lib/env';
import { requireAuth } from '@/lib/auth/middleware';
import { generateUniquePublicSlug } from '@/lib/cv/slug';
import { handleApiError, notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// -------------------------------------------------------------
// POST /api/cv/[id]/share — Enable public sharing
// -------------------------------------------------------------
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth(req);
    const cvId = params.id;

    const rows = await sql`
      SELECT id, is_public, public_slug
      FROM cvs
      WHERE id = ${cvId} AND user_id = ${authUser.userId}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      throw notFound('CV not found', 'CV_NOT_FOUND');
    }

    const cv = rows[0];
    const appBaseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // If already public with slug, return existing
    if (cv.is_public && cv.public_slug) {
      return NextResponse.json({
        ok: true,
        data: {
          is_public: true,
          public_slug: cv.public_slug,
          url: `${appBaseUrl}/cv/public/${cv.public_slug}`,
        },
      });
    }

    // Generate new unique slug and update CV
    const slug = await generateUniquePublicSlug();

    await sql`
      UPDATE cvs
      SET is_public = TRUE, public_slug = ${slug}, updated_at = now()
      WHERE id = ${cvId} AND user_id = ${authUser.userId};
    `;

    return NextResponse.json({
      ok: true,
      data: {
        is_public: true,
        public_slug: slug,
        url: `${appBaseUrl}/cv/public/${slug}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// -------------------------------------------------------------
// DELETE /api/cv/[id]/share — Disable public sharing
// -------------------------------------------------------------
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth(req);
    const cvId = params.id;

    const rows = await sql`
      SELECT id
      FROM cvs
      WHERE id = ${cvId} AND user_id = ${authUser.userId}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      throw notFound('CV not found', 'CV_NOT_FOUND');
    }

    await sql`
      UPDATE cvs
      SET is_public = FALSE, public_slug = NULL, updated_at = now()
      WHERE id = ${cvId} AND user_id = ${authUser.userId};
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
