import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, REFRESH_COOKIE } from '@/lib/auth/cookies';
import { revokeRefreshToken } from '@/lib/auth/tokens';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    const response = NextResponse.json({ ok: true });
    clearAuthCookies(response);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
