import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { OAUTH_STATE_COOKIE, getCookieDomain, isSecureCookie, createSignedOAuthState } from '@/lib/auth/cookies';

export async function GET(req: NextRequest) {
  // Compute origin reliably on local or Vercel
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const computedOrigin = host ? `${proto}://${host}` : req.nextUrl.origin;

  if (!env.GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(`${computedOrigin}/login?auth_error=google_not_configured`);
  }

  let callbackUrl = env.GOOGLE_CALLBACK_URL;
  // If GOOGLE_CALLBACK_URL is set to localhost but request is on production, use production origin!
  if (!callbackUrl || (callbackUrl.includes('localhost') && !computedOrigin.includes('localhost'))) {
    callbackUrl = `${computedOrigin}/api/auth/google/callback`;
  }

  // Create cryptographically signed state token
  const state = createSignedOAuthState();

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
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
  const secure = isSecureCookie();

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 15 * 60, // 15 minutes
    ...(domain ? { domain } : {}),
  });

  return response;
}
