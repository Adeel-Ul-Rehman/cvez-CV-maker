import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { updateProfileSchema } from '@/lib/schemas/auth';
import { badRequest, handleApiError, notFound } from '@/lib/errors';

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw badRequest(firstIssue?.message || 'Invalid input data', 'VALIDATION_ERROR');
    }

    const { fullName, avatarUrl } = parsed.data;

    // Fetch existing user to resolve unchanged fields safely
    const existing = await sql`
      SELECT id, full_name, avatar_url
      FROM users
      WHERE id = ${authUser.userId}
      LIMIT 1;
    `;

    if (!existing || existing.length === 0) {
      throw notFound('User not found', 'USER_NOT_FOUND');
    }

    const newFullName = fullName !== undefined ? fullName : existing[0].full_name;
    const newAvatarUrl = avatarUrl !== undefined ? avatarUrl : existing[0].avatar_url;

    const updatedRows = await sql`
      UPDATE users
      SET full_name = ${newFullName},
          avatar_url = ${newAvatarUrl},
          updated_at = now()
      WHERE id = ${authUser.userId}
      RETURNING id, email, full_name, avatar_url, role, email_verified, cv_count, created_at;
    `;

    const updated = updatedRows[0];

    return NextResponse.json({
      ok: true,
      data: {
        id: updated.id,
        email: updated.email,
        fullName: updated.full_name,
        avatarUrl: updated.avatar_url,
        role: updated.role,
        emailVerified: updated.email_verified,
        cvCount: updated.cv_count,
        createdAt: updated.created_at,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
