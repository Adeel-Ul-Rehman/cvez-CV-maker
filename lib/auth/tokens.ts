import crypto from 'crypto';
import { sql } from '../db';
import { env } from '../env';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt';
import { unauthorized } from '../errors';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface TokenUser {
  id: string;
  role: string;
  email: string;
  fullName?: string | null;
}

/**
 * Issues both an access and refresh token, persisting the refresh token hash in DB.
 */
export async function issueTokenPair(
  user: TokenUser,
  _ip?: string,
  _userAgent?: string
): Promise<{ access: string; refresh: string }> {
  const jti = crypto.randomUUID();

  const access = await signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  const refresh = await signRefreshToken({
    sub: user.id,
    jti,
  });

  const tokenHash = hashToken(refresh);
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${tokenHash}, ${expiresAt.toISOString()});
  `;

  return { access, refresh };
}

/**
 * Verifies an old refresh token, revokes it in DB, and issues a fresh token pair.
 */
export async function rotateRefreshToken(oldRefreshToken: string): Promise<{
  access: string;
  refresh: string;
  user: { id: string; email: string; fullName: string | null; role: string };
}> {
  const payload = await verifyRefreshToken(oldRefreshToken);
  const oldHash = hashToken(oldRefreshToken);

  const rows = await sql`
    SELECT id, user_id, revoked, expires_at
    FROM refresh_tokens
    WHERE token_hash = ${oldHash}
      AND user_id = ${payload.sub}
      AND revoked = FALSE
      AND expires_at > now()
    LIMIT 1;
  `;

  if (!rows || rows.length === 0) {
    throw unauthorized('Refresh token is invalid, expired, or revoked', 'INVALID_REFRESH_TOKEN');
  }

  // Mark old token as revoked
  await sql`
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE id = ${rows[0].id};
  `;

  // Fetch user data
  const userRows = await sql`
    SELECT id, email, full_name, role
    FROM users
    WHERE id = ${payload.sub}
    LIMIT 1;
  `;

  if (!userRows || userRows.length === 0) {
    throw unauthorized('User no longer exists', 'USER_NOT_FOUND');
  }

  const user = userRows[0];
  const newTokens = await issueTokenPair({
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.full_name,
  });

  return {
    ...newTokens,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    },
  };
}

/**
 * Revokes a single refresh token in DB.
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await sql`
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE token_hash = ${tokenHash};
  `;
}

/**
 * Revokes all active refresh tokens for a user (forces full logout across all devices).
 */
export async function revokeAllForUser(userId: string): Promise<void> {
  await sql`
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE user_id = ${userId};
  `;
}
