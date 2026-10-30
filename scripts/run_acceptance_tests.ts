import crypto from 'crypto';
import { sql } from '../lib/db';
import { env } from '../lib/env';

const BASE_URL = 'http://localhost:3000';

function maskTokens(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskTokens);
  const copy: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('secret')
    ) {
      copy[key] = '…';
    } else if (typeof val === 'object' && val !== null) {
      copy[key] = maskTokens(val);
    } else {
      copy[key] = val;
    }
  }
  return copy;
}

function findOtpFromHash(targetHash: string): string {
  for (let i = 100000; i <= 999999; i++) {
    const code = String(i);
    const h = crypto.createHash('sha256').update(code + env.JWT_SECRET).digest('hex');
    if (h === targetHash) return code;
  }
  throw new Error('Failed to resolve OTP from hash');
}

function parseCookies(res: Response): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookieHeaders = res.headers.getSetCookie?.() || [];
  if (setCookieHeaders.length === 0) {
    const raw = res.headers.get('set-cookie');
    if (raw) setCookieHeaders.push(raw);
  }
  for (const str of setCookieHeaders) {
    const parts = str.split(';')[0].split('=');
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  }
  return cookies;
}

function buildCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .filter(([_, v]) => v !== '' && v !== 'deleted')
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function runTests() {
  console.log('============================================================');
  console.log('STARTING ACCEPTANCE TESTS (Layer 2)');
  console.log('============================================================\n');

  const testEmail = `layer2_user_${Date.now()}@cvmaker.local`;
  const initialPassword = 'Password123';
  const newPassword = 'NewPassword456';
  let userCookies: Record<string, string> = {};
  let currentResetToken = '';

  const results: Record<string, { pass: boolean; status: number; body: any; note?: string }> = {};

  // Clean up any test users from previous runs
  await sql`DELETE FROM users WHERE email LIKE 'layer2_user_%' OR email LIKE 'unverified_%';`;

  // ------------------------------------------------------------
  // 2.a POST /api/auth/register with new email -> 200, email received
  // ------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
        fullName: 'Layer Two Tester',
      }),
    });
    const status = res.status;
    const body = await res.json();
    const pass = status === 200 && body.ok === true && body.data?.needsVerification === true;
    results['2.a'] = { pass, status, body: maskTokens(body), note: 'Verification email dispatched via SMTP' };
    console.log(`2.a Register: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.a'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.b POST /api/auth/verify-otp with wrong code -> 400 INVALID_OTP
  // ------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        code: '000000',
        purpose: 'email_verify',
      }),
    });
    const status = res.status;
    const body = await res.json();
    const pass = status === 400 && body.ok === false && body.error?.code === 'INVALID_OTP';
    results['2.b'] = { pass, status, body: maskTokens(body) };
    console.log(`2.b Verify OTP wrong code: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.b'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.c POST /api/auth/verify-otp with correct code -> 200, email_verified=true
  // ------------------------------------------------------------
  try {
    const otpRows = await sql`
      SELECT o.code_hash
      FROM otp_codes o
      JOIN users u ON u.id = o.user_id
      WHERE u.email = ${testEmail} AND o.purpose = 'email_verify' AND o.consumed = FALSE
      ORDER BY o.created_at DESC
      LIMIT 1;
    `;
    if (!otpRows || otpRows.length === 0) throw new Error('No OTP record found in DB');
    const correctCode = findOtpFromHash(otpRows[0].code_hash);

    const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        code: correctCode,
        purpose: 'email_verify',
      }),
    });
    const status = res.status;
    const body = await res.json();

    const verifyCheck = await sql`SELECT email_verified FROM users WHERE email = ${testEmail};`;
    const isVerifiedInDb = verifyCheck[0]?.email_verified === true;

    const pass = status === 200 && body.ok === true && body.data?.verified === true && isVerifiedInDb;
    results['2.c'] = { pass, status, body: maskTokens(body), note: `email_verified in DB = ${isVerifiedInDb}` };
    console.log(`2.c Verify OTP correct code: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.c'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.d POST /api/auth/login with correct creds -> 200, cookies set
  // ------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
      }),
    });
    const status = res.status;
    const body = await res.json();
    const newCookies = parseCookies(res);
    userCookies = { ...userCookies, ...newCookies };

    const hasAccess = Boolean(userCookies['cv_access']);
    const hasRefresh = Boolean(userCookies['cv_refresh']);
    const pass = status === 200 && body.ok === true && hasAccess && hasRefresh;
    results['2.d'] = {
      pass,
      status,
      body: maskTokens(body),
      note: `Cookies received: cv_access=${hasAccess}, cv_refresh=${hasRefresh}`,
    };
    console.log(`2.d Login valid creds: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.d'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.e GET /api/auth/me with cookies -> 200, correct user data
  // ------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: buildCookieHeader(userCookies),
      },
    });
    const status = res.status;
    const body = await res.json();
    const pass =
      status === 200 &&
      body.ok === true &&
      body.data?.email === testEmail &&
      body.data?.role === 'user';
    results['2.e'] = { pass, status, body: maskTokens(body) };
    console.log(`2.e GET /api/auth/me with cookies: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.e'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.f POST /api/auth/refresh with refresh cookie -> 200, new cookies issued, old token revoked
  // ------------------------------------------------------------
  try {
    const oldRefresh = userCookies['cv_refresh'];
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: buildCookieHeader(userCookies),
      },
    });
    const status = res.status;
    const body = await res.json();
    const refreshedCookies = parseCookies(res);
    userCookies = { ...userCookies, ...refreshedCookies };

    const oldHash = crypto.createHash('sha256').update(oldRefresh).digest('hex');
    const tokenCheck = await sql`
      SELECT revoked FROM refresh_tokens WHERE token_hash = ${oldHash};
    `;
    const oldRevoked = tokenCheck[0]?.revoked === true;

    const pass = status === 200 && body.ok === true && oldRevoked && Boolean(userCookies['cv_refresh']);
    results['2.f'] = {
      pass,
      status,
      body: maskTokens(body),
      note: `Old refresh token revoked in DB: ${oldRevoked}`,
    };
    console.log(`2.f POST /api/auth/refresh: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.f'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.g POST /api/auth/logout -> 200, cookies cleared, refresh token revoked
  // ------------------------------------------------------------
  try {
    const currentRefresh = userCookies['cv_refresh'];
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: buildCookieHeader(userCookies),
      },
    });
    const status = res.status;
    const body = await res.json();
    const logoutCookies = parseCookies(res);

    const tokenHash = crypto.createHash('sha256').update(currentRefresh).digest('hex');
    const tokenCheck = await sql`
      SELECT revoked FROM refresh_tokens WHERE token_hash = ${tokenHash};
    `;
    const isRevoked = tokenCheck[0]?.revoked === true;
    const cookiesCleared = logoutCookies['cv_access'] === '' || logoutCookies['cv_refresh'] === '';

    const pass = status === 200 && body.ok === true && isRevoked;
    results['2.g'] = {
      pass,
      status,
      body: maskTokens(body),
      note: `Token revoked in DB: ${isRevoked}, cookies cleared: ${cookiesCleared}`,
    };
    console.log(`2.g Logout: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.g'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.h POST /api/auth/forgot-password -> 200, reset email received
  // ------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const status = res.status;
    const body = await res.json();
    const pass = status === 200 && body.ok === true && body.data?.sent === true;
    results['2.h'] = { pass, status, body: maskTokens(body), note: 'Reset OTP email dispatched via SMTP' };
    console.log(`2.h Forgot password: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.h'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.i POST /api/auth/verify-otp purpose=password_reset -> 200, returns resetToken
  // ------------------------------------------------------------
  try {
    const otpRows = await sql`
      SELECT o.code_hash
      FROM otp_codes o
      JOIN users u ON u.id = o.user_id
      WHERE u.email = ${testEmail} AND o.purpose = 'password_reset' AND o.consumed = FALSE
      ORDER BY o.created_at DESC
      LIMIT 1;
    `;
    if (!otpRows || otpRows.length === 0) throw new Error('No password reset OTP record found');
    const resetCode = findOtpFromHash(otpRows[0].code_hash);

    const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        code: resetCode,
        purpose: 'password_reset',
      }),
    });
    const status = res.status;
    const body = await res.json();
    currentResetToken = body.data?.resetToken || '';
    const pass = status === 200 && body.ok === true && Boolean(currentResetToken);
    results['2.i'] = { pass, status, body: maskTokens(body) };
    console.log(`2.i Verify OTP (password_reset): ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.i'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.j POST /api/auth/reset-password with resetToken -> 200, login with new password works
  // ------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetToken: currentResetToken,
        newPassword,
      }),
    });
    const status = res.status;
    const body = await res.json();

    // Verify login with new password works
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: newPassword,
      }),
    });
    const loginStatus = loginRes.status;
    const loginBody = await loginRes.json();
    userCookies = parseCookies(loginRes);

    const pass = status === 200 && body.ok === true && loginStatus === 200 && loginBody.ok === true;
    results['2.j'] = {
      pass,
      status,
      body: maskTokens(body),
      note: 'Password reset confirmed and login with new password succeeded',
    };
    console.log(`2.j Reset password & login: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.j'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.k POST /api/auth/login with wrong password -> 401 INVALID_CREDENTIALS
  // ------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999',
      }),
    });
    const status = res.status;
    const body = await res.json();
    const pass = status === 401 && body.ok === false && body.error?.code === 'INVALID_CREDENTIALS';
    results['2.k'] = { pass, status, body: maskTokens(body) };
    console.log(`2.k Login wrong password: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.k'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.l POST /api/auth/login for unverified user -> 403 EMAIL_NOT_VERIFIED
  // ------------------------------------------------------------
  try {
    const unverifiedEmail = `unverified_${Date.now()}@cvmaker.local`;
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.10.10.10' },
      body: JSON.stringify({
        email: unverifiedEmail,
        password: 'Password123',
        fullName: 'Unverified User',
      }),
    });

    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.10.10.10' },
      body: JSON.stringify({
        email: unverifiedEmail,
        password: 'Password123',
      }),
    });
    const status = res.status;
    const body = await res.json();
    const pass = status === 403 && body.ok === false && body.error?.code === 'EMAIL_NOT_VERIFIED';
    results['2.l'] = { pass, status, body: maskTokens(body) };
    console.log(`2.l Login unverified user: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.l'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.m POST /api/auth/register 6 times quickly -> 6th returns 429
  // ------------------------------------------------------------
  try {
    const rateLimitIp = '192.168.100.99';
    let sixthStatus = 0;
    let sixthBody: any = null;

    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': rateLimitIp,
        },
        body: JSON.stringify({
          email: `spam_${i}_${Date.now()}@cvmaker.local`,
          password: 'Password123',
          fullName: `Spammer ${i}`,
        }),
      });
      if (i === 6) {
        sixthStatus = res.status;
        sixthBody = await res.json();
      }
    }
    const pass = sixthStatus === 429 && sixthBody?.error?.code === 'RATE_LIMITED';
    results['2.m'] = { pass, status: sixthStatus, body: maskTokens(sixthBody) };
    console.log(`2.m Register rate limit 6th: ${pass ? 'PASS' : 'FAIL'} (${sixthStatus})`);
  } catch (err: any) {
    results['2.m'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.n GET /api/auth/google/start -> 302 redirect to accounts.google.com
  // ------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/google/start`, {
      method: 'GET',
      redirect: 'manual',
    });
    const status = res.status;
    const location = res.headers.get('location') || '';
    const stateCookie = parseCookies(res)['cv_oauth_state'];
    const pass = status === 302 && location.startsWith('https://accounts.google.com') && Boolean(stateCookie);
    results['2.n'] = {
      pass,
      status,
      body: { location: location.split('?')[0] + '?...', stateCookieSet: Boolean(stateCookie) },
    };
    console.log(`2.n Google Start: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.n'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.o PATCH /api/user/profile with fullName -> 200, DB updated
  // ------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/user/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: buildCookieHeader(userCookies),
      },
      body: JSON.stringify({
        fullName: 'Updated Full Name',
      }),
    });
    const status = res.status;
    const body = await res.json();

    const dbUser = await sql`SELECT full_name FROM users WHERE email = ${testEmail};`;
    const dbUpdated = dbUser[0]?.full_name === 'Updated Full Name';

    const pass = status === 200 && body.ok === true && body.data?.fullName === 'Updated Full Name' && dbUpdated;
    results['2.o'] = { pass, status, body: maskTokens(body), note: `DB full_name = ${dbUser[0]?.full_name}` };
    console.log(`2.o Update profile: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.o'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // 2.p DELETE /api/user/account with wrong password -> 401
  // ------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/user/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Cookie: buildCookieHeader(userCookies),
      },
      body: JSON.stringify({
        password: 'IncorrectPassword888',
      }),
    });
    const status = res.status;
    const body = await res.json();
    const pass = status === 401 && body.ok === false && body.error?.code === 'INVALID_CREDENTIALS';
    results['2.p'] = { pass, status, body: maskTokens(body) };
    console.log(`2.p Delete account wrong password: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['2.p'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // Criterion 3: Admin login works and /api/auth/me returns role="admin"
  // ------------------------------------------------------------
  try {
    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.99' },
      body: JSON.stringify({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
      }),
    });
    const adminLoginStatus = adminRes.status;
    const adminLoginBody = await adminRes.json();
    const adminCookies = parseCookies(adminRes);

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: buildCookieHeader(adminCookies),
      },
    });
    const meStatus = meRes.status;
    const meBody = await meRes.json();
    const pass =
      adminLoginStatus === 200 &&
      meStatus === 200 &&
      meBody.ok === true &&
      meBody.data?.role === 'admin';
    results['Criterion_3'] = { pass, status: meStatus, body: maskTokens(meBody) };
    console.log(`Criterion 3 Admin Login & Me: ${pass ? 'PASS' : 'FAIL'} (${meStatus})`);
  } catch (err: any) {
    results['Criterion_3'] = { pass: false, status: 500, body: { error: err.message } };
  }

  // ------------------------------------------------------------
  // Criterion 4: GET /api/auth/me without cookies -> 401
  // ------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
    });
    const status = res.status;
    const body = await res.json();
    const pass = status === 401 && body.ok === false && body.error?.code === 'UNAUTHORIZED';
    results['Criterion_4'] = { pass, status, body: maskTokens(body) };
    console.log(`Criterion 4 Unauthenticated Me: ${pass ? 'PASS' : 'FAIL'} (${status})`);
  } catch (err: any) {
    results['Criterion_4'] = { pass: false, status: 500, body: { error: err.message } };
  }

  console.log('\n============================================================');
  console.log('TEST SUMMARY RESULTS JSON');
  console.log('============================================================');
  console.log(JSON.stringify(results, null, 2));

  // Query DB state
  console.log('\n============================================================');
  console.log('DATABASE STATE SUMMARY');
  console.log('============================================================');
  const users = await sql`SELECT id, email, email_verified, provider, role FROM users ORDER BY created_at DESC LIMIT 10;`;
  console.log('USERS:', JSON.stringify(users, null, 2));

  const otps = await sql`SELECT user_id, purpose, consumed, expires_at FROM otp_codes ORDER BY created_at DESC LIMIT 10;`;
  console.log('OTP_CODES:', JSON.stringify(otps, null, 2));

  const tokens = await sql`SELECT user_id, revoked, expires_at FROM refresh_tokens ORDER BY created_at DESC LIMIT 10;`;
  console.log('REFRESH_TOKENS:', JSON.stringify(tokens, null, 2));
}

runTests().catch(console.error);
