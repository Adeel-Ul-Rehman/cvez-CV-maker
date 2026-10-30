import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/schemas/auth';
import { sql } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { issueTokenPair } from '@/lib/auth/tokens';
import { setAuthCookies } from '@/lib/auth/cookies';
import { forbidden, handleApiError, unauthorized } from '@/lib/errors';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        { status: 429 }
      );
    }

    const body = await req.json();
    const data = loginSchema.parse(body);

    const userRows = await sql`
      SELECT id, email, password_hash, full_name, avatar_url, role, email_verified, provider
      FROM users
      WHERE email = ${data.email}
      LIMIT 1;
    `;

    if (!userRows || userRows.length === 0) {
      throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const user = userRows[0];

    if (!user.password_hash) {
      throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isMatch = await verifyPassword(data.password, user.password_hash);
    if (!isMatch) {
      throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.email_verified) {
      throw forbidden('Please verify your email before logging in', 'EMAIL_NOT_VERIFIED');
    }

    const tokenUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    };

    const tokens = await issueTokenPair(tokenUser, ip, req.headers.get('user-agent') || undefined);

    const response = NextResponse.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          avatarUrl: user.avatar_url,
          provider: user.provider,
        },
      },
    });

    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
