import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { handleApiError, notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface RouteParams {
  params: { slug: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const slug = params.slug;

    const rows = await sql`
      SELECT
        cvs.title,
        cvs.template_key,
        cvs.data,
        cvs.config,
        cvs.updated_at,
        templates.name as template_name,
        users.full_name,
        users.avatar_url
      FROM cvs
      JOIN templates ON cvs.template_key = templates.template_key
      JOIN users ON cvs.user_id = users.id
      WHERE cvs.public_slug = ${slug} AND cvs.is_public = TRUE
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      throw notFound('Public CV not found', 'PUBLIC_CV_NOT_FOUND');
    }

    const row = rows[0];

    return NextResponse.json(
      {
        ok: true,
        data: {
          cv: {
            title: row.title,
            template_key: row.template_key,
            data: row.data,
            config: row.config,
            updated_at: row.updated_at,
            template_name: row.template_name,
          },
          user: {
            fullName: row.full_name,
            avatarUrl: row.avatar_url,
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
