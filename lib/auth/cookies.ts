import { NextResponse } from 'next/server';
import { env } from '../env';

export const ACCESS_COOKIE = 'cv_access';
export const REFRESH_COOKIE = 'cv_refresh';
export const OAUTH_STATE_COOKIE = 'cv_oauth_state';

interface TokenPair {
  access: string;
  refresh: string;
}

/**
 * Sets httpOnly authentication cookies on a NextResponse.
 */
export function setAuthCookies(res: NextResponse, tokens: TokenPair): void {
  const domain = env.COOKIE_DOMAIN !== 'localhost' ? env.COOKIE_DOMAIN : undefined;

  res.cookies.set(ACCESS_COOKIE, tokens.access, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60,
    domain,
  });

  res.cookies.set(REFRESH_COOKIE, tokens.refresh, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
    domain,
  });
}

/**
 * Clears authentication cookies on a NextResponse.
 */
export function clearAuthCookies(res: NextResponse): void {
  const domain = env.COOKIE_DOMAIN !== 'localhost' ? env.COOKIE_DOMAIN : undefined;

  res.cookies.set(ACCESS_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: 0,
    domain,
  });

  res.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: 0,
    domain,
  });
}
