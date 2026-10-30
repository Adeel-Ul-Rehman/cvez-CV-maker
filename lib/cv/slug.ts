import crypto from 'crypto';
import { sql } from '../db';

const SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // Lowercase + digits, unambiguous (no 0, o, 1, l, i)

/**
 * Generates a 10-character random lowercase alphanumeric URL-safe slug.
 */
export function generateSlug(length = 10): string {
  const bytes = crypto.randomBytes(length);
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return slug;
}

/**
 * Generates a unique public slug, retrying up to maxRetries times if a collision occurs.
 */
export async function generateUniquePublicSlug(
  customCheck?: (slug: string) => Promise<boolean>,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const slug = generateSlug();
    if (customCheck) {
      const isTaken = await customCheck(slug);
      if (!isTaken) return slug;
    } else {
      const existing = await sql`
        SELECT id FROM cvs WHERE public_slug = ${slug} LIMIT 1;
      `;
      if (!existing || existing.length === 0) {
        return slug;
      }
    }
  }
  throw new Error('Failed to generate a unique public slug after 3 attempts');
}
