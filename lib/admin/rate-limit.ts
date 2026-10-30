import { rateLimit } from '@/lib/rateLimit';
import { AppError } from '@/lib/errors';

const ONE_MINUTE_MS = 60 * 1000;

/**
 * Enforces rate limits for administrative endpoints:
 * - GET requests: 60 per minute per admin
 * - Mutating requests (POST, PATCH, DELETE): 20 per minute per admin
 * Throws AppError(429, 'RATE_LIMITED') when limit is exceeded.
 */
export function enforceAdminRateLimit(adminId: string, isMutation = false): void {
  const limit = isMutation ? 20 : 60;
  const key = `admin:${isMutation ? 'mutation' : 'get'}:${adminId}`;

  const result = rateLimit(key, limit, ONE_MINUTE_MS);

  if (!result.allowed) {
    throw new AppError(429, 'RATE_LIMITED', 'Too many admin requests. Please slow down.');
  }
}
