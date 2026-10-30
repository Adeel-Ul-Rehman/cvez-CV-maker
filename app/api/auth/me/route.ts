import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError, notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const rows = await sql`
      SELECT id, email, full_name, avatar_url, role, email_verified, provider, cv_count, created_at
      FROM users
      WHERE id = ${authUser.userId}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      throw notFound('User not found', 'USER_NOT_FOUND');
    }

    const user = rows[0];

    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      emailVerified: user.email_verified,
      provider: user.provider,
      cvCount: user.cv_count,
      createdAt: user.created_at,
    };

    return NextResponse.json({
      ok: true,
      data: {
        user: userData,
        ...userData,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
