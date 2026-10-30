import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { revokeAllForUser } from '@/lib/auth/tokens';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { changePasswordSchema } from '@/lib/schemas/auth';
import { badRequest, handleApiError, notFound, unauthorized } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw badRequest(firstIssue?.message || 'Invalid input data', 'VALIDATION_ERROR');
    }

    const { currentPassword, newPassword } = parsed.data;

    // Fetch user's current password hash
    const rows = await sql`
      SELECT id, password_hash, provider
      FROM users
      WHERE id = ${authUser.userId}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      throw notFound('User not found', 'USER_NOT_FOUND');
    }

    const user = rows[0];

    if (!user.password_hash) {
      throw badRequest('Account was registered via Google OAuth and has no password', 'NO_PASSWORD_SET');
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      throw unauthorized('Incorrect current password', 'INVALID_CREDENTIALS');
    }

    // Hash new password and update DB
    const newPasswordHash = await hashPassword(newPassword);
    await sql`
      UPDATE users
      SET password_hash = ${newPasswordHash}, updated_at = now()
      WHERE id = ${authUser.userId};
    `;

    // Revoke all sessions for this user
    await revokeAllForUser(authUser.userId);

    // Clear authentication cookies and notify client
    const response = NextResponse.json({ ok: true, reauthRequired: true });
    clearAuthCookies(response);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
