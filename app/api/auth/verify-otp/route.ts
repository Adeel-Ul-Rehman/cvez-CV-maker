import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpSchema } from '@/lib/schemas/auth';
import { sql } from '@/lib/db';
import { consumeOtpRecord } from '@/lib/auth/otp';
import { signResetToken } from '@/lib/auth/jwt';
import { issueTokenPair } from '@/lib/auth/tokens';
import { setAuthCookies } from '@/lib/auth/cookies';
import { badRequest, handleApiError, unauthorized } from '@/lib/errors';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`verify-otp:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        { status: 429 }
      );
    }

    const body = await req.json();
    const data = verifyOtpSchema.parse(body);

    const userRows = await sql`
      SELECT id, email, email_verified
      FROM users
      WHERE email = ${data.email}
      LIMIT 1;
    `;

    if (!userRows || userRows.length === 0) {
      // 401 if not found to prevent user enumeration
      throw unauthorized('Invalid verification request', 'UNAUTHORIZED');
    }

    const user = userRows[0];
    const consumed = await consumeOtpRecord(user.id, data.purpose, data.code);
    if (!consumed) {
      throw badRequest('Invalid or expired verification code', 'INVALID_OTP');
    }

    if (data.purpose === 'email_verify') {
      const updatedRows = await sql`
        UPDATE users
        SET email_verified = TRUE, updated_at = now()
        WHERE id = ${user.id}
        RETURNING id, email, role, full_name;
      `;

      const activeUser = updatedRows[0] || user;
      const tokens = await issueTokenPair({
        id: activeUser.id,
        email: activeUser.email,
        role: activeUser.role,
        fullName: activeUser.full_name,
      });

      const response = NextResponse.json({
        ok: true,
        data: {
          verified: true,
          user: activeUser,
        },
      });

      setAuthCookies(response, tokens);
      return response;
    }

    if (data.purpose === 'password_reset') {
      const resetToken = await signResetToken({ sub: user.id });
      return NextResponse.json({
        ok: true,
        data: {
          verified: true,
          resetToken,
        },
      });
    }

    throw badRequest('Invalid verification purpose', 'INVALID_PURPOSE');
  } catch (error) {
    return handleApiError(error);
  }
}
