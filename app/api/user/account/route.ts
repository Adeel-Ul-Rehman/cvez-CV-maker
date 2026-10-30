import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { verifyPassword } from '@/lib/auth/password';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { deleteAccountSchema } from '@/lib/schemas/auth';
import { badRequest, handleApiError, notFound, unauthorized } from '@/lib/errors';

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const body = await req.json();
    const parsed = deleteAccountSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw badRequest(firstIssue?.message || 'Invalid input data', 'VALIDATION_ERROR');
    }

    const { password } = parsed.data;

    // Fetch user details
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

    // If provider is google without password, require "CONFIRM" or "DELETE" string
    if (user.provider === 'google' && !user.password_hash) {
      if (password !== 'CONFIRM' && password !== 'DELETE') {
        throw unauthorized('Please type DELETE to delete your account', 'INVALID_CREDENTIALS');
      }
    } else {
      // Otherwise verify password hash
      if (!user.password_hash) {
        throw unauthorized('Invalid account state', 'INVALID_CREDENTIALS');
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        throw unauthorized('Incorrect password', 'INVALID_CREDENTIALS');
      }
    }

    // Delete user (cascades to cvs, otps, tokens)
    await sql`
      DELETE FROM users WHERE id = ${authUser.userId};
    `;

    // Clear auth cookies
    const response = NextResponse.json({ ok: true });
    clearAuthCookies(response);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
