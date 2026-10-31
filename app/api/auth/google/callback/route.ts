import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { env } from '@/lib/env';
import { issueTokenPair } from '@/lib/auth/tokens';
import { setAuthCookies, OAUTH_STATE_COOKIE, getCookieDomain, isSecureCookie, verifySignedOAuthState } from '@/lib/auth/cookies';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const computedOrigin = host ? `${proto}://${host}` : req.nextUrl.origin;

  let callbackUrl = env.GOOGLE_CALLBACK_URL;
  // If GOOGLE_CALLBACK_URL is set to localhost but request is on production, use production origin!
  if (!callbackUrl || (callbackUrl.includes('localhost') && !computedOrigin.includes('localhost'))) {
    callbackUrl = `${computedOrigin}/api/auth/google/callback`;
  }

  let appBaseUrl = env.NEXT_PUBLIC_APP_URL;
  if (!appBaseUrl || (appBaseUrl.includes('localhost') && !computedOrigin.includes('localhost'))) {
    appBaseUrl = computedOrigin;
  }

  if (error) {
    return NextResponse.redirect(`${appBaseUrl}/login?auth_error=${encodeURIComponent(error)}`);
  }

  const storedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  // Accept if cookie matches OR cryptographic HMAC signature is valid
  const isStateAuthentic =
    (storedState && state === storedState) ||
    verifySignedOAuthState(state);

  if (!code || !state || !isStateAuthentic) {
    return NextResponse.redirect(`${appBaseUrl}/login?auth_error=invalid_state`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID || '',
        client_secret: env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('Google token exchange error:', errBody);
      return NextResponse.redirect(`${appBaseUrl}/login?auth_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch userinfo from Google
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userinfoResponse.ok) {
      return NextResponse.redirect(`${appBaseUrl}/login?auth_error=fetch_userinfo_failed`);
    }

    const userinfo = await userinfoResponse.json();
    const googleSub: string = userinfo.sub;
    const email: string = userinfo.email?.toLowerCase();
    const name: string | null = userinfo.name || null;
    const picture: string | null = userinfo.picture || null;

    if (!email) {
      return NextResponse.redirect(`${appBaseUrl}/login?auth_error=no_email_provided`);
    }

    // 3. Upsert user by google_id OR email
    const existingUsers = await sql`
      SELECT id, email, role, full_name, provider, google_id
      FROM users
      WHERE google_id = ${googleSub} OR email = ${email}
      LIMIT 1;
    `;

    let userRecord: any;

    if (existingUsers && existingUsers.length > 0) {
      const existing = existingUsers[0];
      // User with email or google_id exists: link google_id, set email_verified=true
      const updated = await sql`
        UPDATE users
        SET google_id = ${googleSub},
            email_verified = TRUE,
            avatar_url = COALESCE(avatar_url, ${picture}),
            updated_at = now()
        WHERE id = ${existing.id}
        RETURNING id, email, role, full_name, avatar_url;
      `;
      userRecord = updated[0];
    } else {
      // Create new user with provider='google', email_verified=true, password_hash=null
      const inserted = await sql`
        INSERT INTO users (
          email,
          full_name,
          avatar_url,
          provider,
          google_id,
          role,
          email_verified
        )
        VALUES (
          ${email},
          ${name},
          ${picture},
          'google',
          ${googleSub},
          'user',
          TRUE
        )
        RETURNING id, email, role, full_name, avatar_url;
      `;
      userRecord = inserted[0];
    }

    // 4. Issue token pair
    const tokens = await issueTokenPair({
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      fullName: userRecord.full_name,
    });

    // 5. Create redirect response and set cookies
    const targetUrl = userRecord.role === 'admin' ? `${appBaseUrl}/admin/dashboard` : `${appBaseUrl}/dashboard`;
    const response = NextResponse.redirect(targetUrl);
    setAuthCookies(response, tokens);

    // Clear state cookie
    const domain = getCookieDomain();
    const secure = isSecureCookie();
    response.cookies.set(OAUTH_STATE_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: 0,
      ...(domain ? { domain } : {}),
    });

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${appBaseUrl}/login?auth_error=server_error`);
  }
}
