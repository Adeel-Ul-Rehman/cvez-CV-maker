import bcrypt from 'bcryptjs';
import { env } from '../env';

/**
 * Hashes a plaintext password using bcryptjs with configured rounds.
 */
export async function hashPassword(plain: string): Promise<string> {
  const rounds = Number(env.BCRYPT_ROUNDS) || 10;
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(plain, salt);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
