import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyResetToken } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/password';
import { revokeAllForUser } from '@/lib/auth/tokens';
import { resetPasswordSchema } from '@/lib/schemas/auth';
import { badRequest, handleApiError, notFound } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw badRequest(firstIssue?.message || 'Invalid input data', 'VALIDATION_ERROR');
    }

    const { resetToken, newPassword } = parsed.data;

    // Verify resetToken (JWT, purpose="pw_reset"), extract user id
    const payload = await verifyResetToken(resetToken);
    const userId = payload.sub;

    // Verify user exists in database
    const userRows = await sql`
      SELECT id FROM users WHERE id = ${userId} LIMIT 1;
    `;

    if (!userRows || userRows.length === 0) {
      throw notFound('User not found', 'USER_NOT_FOUND');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password_hash in DB
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}, updated_at = now()
      WHERE id = ${userId};
    `;

    // Revoke all refresh tokens for this user (force logout everywhere)
    await revokeAllForUser(userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
