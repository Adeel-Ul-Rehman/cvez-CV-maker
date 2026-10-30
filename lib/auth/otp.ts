import crypto from 'crypto';
import { sql } from '../db';
import { env } from '../env';

/**
 * Generates a 6-digit cryptographically random numeric string.
 */
export function generateOtp(): string {
  // randomInt(min, max) where max is exclusive
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Computes SHA-256 of (code + JWT_SECRET) as hex.
 */
export function hashOtp(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code + env.JWT_SECRET)
    .digest('hex');
}

/**
 * Timing-safe comparison of OTP against a stored hash.
 */
export function verifyOtpHash(code: string, hash: string): boolean {
  try {
    const computed = Buffer.from(hashOtp(code), 'hex');
    const expected = Buffer.from(hash, 'hex');
    if (computed.length !== expected.length) {
      return false;
    }
    return crypto.timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

/**
 * Inserts a new OTP record into otp_codes table.
 */
export async function createOtpRecord(
  userId: string,
  purpose: 'email_verify' | 'password_reset'
): Promise<{ code: string; expiresAt: Date }> {
  const code = generateOtp();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await sql`
    INSERT INTO otp_codes (user_id, code_hash, purpose, expires_at)
    VALUES (${userId}, ${codeHash}, ${purpose}, ${expiresAt.toISOString()});
  `;

  return { code, expiresAt };
}

/**
 * Finds the latest non-consumed, non-expired OTP record for (user, purpose),
 * verifies hash, marks consumed=true, and returns true/false.
 */
export async function consumeOtpRecord(
  userId: string,
  purpose: string,
  code: string
): Promise<boolean> {
  const rows = await sql`
    SELECT id, code_hash, expires_at, consumed
    FROM otp_codes
    WHERE user_id = ${userId}
      AND purpose = ${purpose}
      AND consumed = FALSE
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;
  `;

  if (!rows || rows.length === 0) {
    return false;
  }

  const record = rows[0];
  const isValid = verifyOtpHash(code, record.code_hash);
  if (!isValid) {
    return false;
  }

  await sql`
    UPDATE otp_codes
    SET consumed = TRUE
    WHERE id = ${record.id};
  `;

  return true;
}
