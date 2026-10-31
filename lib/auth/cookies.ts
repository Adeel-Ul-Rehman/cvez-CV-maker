import { NextResponse } from 'next/server';
import crypto from 'crypto';
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

export function isSecureCookie(): boolean {
  return process.env.NODE_ENV === 'production' || env.COOKIE_SECURE === true;
}

/**
 * Creates a cryptographically signed OAuth state token that survives
 * browser redirects and WebKit/Safari cross-site cookie restrictions.
 */
export function createSignedOAuthState(): string {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}.${nonce}`;
  const secret = env.JWT_SECRET || 'cv_maker_oauth_secret';
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/**
 * Validates a signed OAuth state token.
 * Returns true if the HMAC is authentic and timestamp is within 15 minutes.
 */
export function verifySignedOAuthState(state: string | null | undefined): boolean {
  if (!state || typeof state !== 'string') return false;
  const parts = state.split('.');
  if (parts.length !== 3) return false;

  const [timestampStr, nonce, sig] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Max age: 15 minutes; allow 1 minute clock skew into the future
  const now = Date.now();
  if (now - timestamp > 15 * 60 * 1000 || timestamp - now > 60 * 1000) {
    return false;
  }

  const payload = `${timestampStr}.${nonce}`;
  const secret = env.JWT_SECRET || 'cv_maker_oauth_secret';
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Sets httpOnly authentication cookies on a NextResponse.
 */
export function setAuthCookies(res: NextResponse, tokens: TokenPair): void {
  const domain = getCookieDomain();
  const secure = isSecureCookie();

  res.cookies.set(ACCESS_COOKIE, tokens.access, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: (Number(env.ACCESS_TOKEN_TTL_MINUTES) || 15) * 60,
    ...(domain ? { domain } : {}),
  });

  res.cookies.set(REFRESH_COOKIE, tokens.refresh, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: (Number(env.REFRESH_TOKEN_TTL_DAYS) || 7) * 24 * 60 * 60,
    ...(domain ? { domain } : {}),
  });
}

/**
 * Clears authentication cookies on a NextResponse.
 */
export function clearAuthCookies(res: NextResponse): void {
  const domain = getCookieDomain();
  const secure = isSecureCookie();

  res.cookies.set(ACCESS_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
    ...(domain ? { domain } : {}),
  });

  res.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
    ...(domain ? { domain } : {}),
  });
}
