import { sql, TransactionContext } from '../db';
import { forbidden, notFound } from '../errors';

export const MAX_CVS_PER_USER = 5;
export const MAX_VERSIONS_PER_CV = 20;

/**
 * Asserts that the user has not reached the maximum allowed CVs (5).
 * Uses SELECT cv_count FROM users ... FOR UPDATE to lock the row inside a transaction.
 */
export async function assertCvLimit(
  userId: string,
  tx?: TransactionContext
): Promise<number> {
  let rows: any[];

  if (tx) {
    rows = await tx.sql`
      SELECT cv_count FROM users WHERE id = ${userId} FOR UPDATE;
    `;
  } else {
    rows = await sql`
      SELECT cv_count FROM users WHERE id = ${userId};
    `;
  }

  if (!rows || rows.length === 0) {
    throw notFound('User not found', 'USER_NOT_FOUND');
  }

  const currentCount = Number(rows[0].cv_count) || 0;

  if (currentCount >= MAX_CVS_PER_USER) {
    throw forbidden(
      `You have reached the maximum limit of ${MAX_CVS_PER_USER} CVs (current count: ${currentCount})`,
      'CV_LIMIT_REACHED'
    );
  }

  return currentCount;
}
