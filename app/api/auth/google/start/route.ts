import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { env } from '@/lib/env';
import { OAUTH_STATE_COOKIE, getCookieDomain } from '@/lib/auth/cookies';

export async function GET(req: NextRequest) {
  const state = crypto.randomBytes(32).toString('hex');

  // Compute origin reliably on local or Vercel
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const computedOrigin = host ? `${proto}://${host}` : req.nextUrl.origin;

  const callbackUrl =
    env.GOOGLE_CALLBACK_URL ||
    `${computedOrigin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID || '',
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const response = NextResponse.redirect(googleAuthUrl, 302);
  const domain = getCookieDomain();

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: 10 * 60, // 10 minutes
    ...(domain ? { domain } : {}),
  });

  return response;
}
