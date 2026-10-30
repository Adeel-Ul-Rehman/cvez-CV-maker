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
 * Returns cookie domain if custom, or undefined (host-only) for localhost and *.vercel.app.
 * Avoids Public Suffix List rejection on *.vercel.app domains.
 */
export function getCookieDomain(): string | undefined {
  if (
    !env.COOKIE_DOMAIN ||
    env.COOKIE_DOMAIN === 'localhost' ||
    env.COOKIE_DOMAIN.endsWith('.vercel.app') ||
    env.COOKIE_DOMAIN.includes('vercel.app')
  ) {
    return undefined;
  }
  return env.COOKIE_DOMAIN;
}

/**
 * Sets httpOnly authentication cookies on a NextResponse.
 */
export function setAuthCookies(res: NextResponse, tokens: TokenPair): void {
  const domain = getCookieDomain();

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
  const domain = getCookieDomain();

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
