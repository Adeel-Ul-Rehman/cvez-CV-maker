import { NextRequest, NextResponse } from 'next/server';
import { REFRESH_COOKIE, setAuthCookies } from '@/lib/auth/cookies';
import { rotateRefreshToken } from '@/lib/auth/tokens';
import { handleApiError, unauthorized } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
    if (!refreshToken) {
      throw unauthorized('Refresh token required', 'REFRESH_TOKEN_REQUIRED');
    }

    const { access, refresh, user } = await rotateRefreshToken(refreshToken);

    const response = NextResponse.json({
      ok: true,
      data: {
        user,
      },
    });

    setAuthCookies(response, { access, refresh });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
