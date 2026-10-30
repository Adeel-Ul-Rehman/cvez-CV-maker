import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { env } from '@/lib/env';
import { OAUTH_STATE_COOKIE } from '@/lib/auth/cookies';

export async function GET() {
  const state = crypto.randomBytes(32).toString('hex');

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID || '',
    redirect_uri: env.GOOGLE_CALLBACK_URL || '',
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const response = NextResponse.redirect(googleAuthUrl, 302);

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: 10 * 60, // 10 minutes
    ...(env.COOKIE_DOMAIN && env.COOKIE_DOMAIN !== 'localhost'
      ? { domain: env.COOKIE_DOMAIN }
      : {}),
  });

  return response;
}
