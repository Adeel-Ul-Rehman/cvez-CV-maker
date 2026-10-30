import { NextRequest } from 'next/server';
import { ACCESS_COOKIE } from './cookies';
import { verifyAccessToken } from './jwt';
import { forbidden, unauthorized } from '../errors';

export interface AuthenticatedUser {
  userId: string;
  role: string;
  email: string;
}

/**
 * Requires a valid access token in cookies or Bearer Authorization header.
 * Throws unauthorized on missing, invalid, or expired tokens.
 */
export async function requireAuth(req: NextRequest): Promise<AuthenticatedUser> {
  let token = req.cookies.get(ACCESS_COOKIE)?.value;

  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    throw unauthorized('Authentication required', 'UNAUTHORIZED');
  }

  const payload = await verifyAccessToken(token);

  return {
    userId: payload.sub,
    role: payload.role,
    email: payload.email,
  };
}

/**
 * Requires an authenticated user with 'admin' role.
 * Throws forbidden if role is not admin.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  if (user.role !== 'admin') {
    throw forbidden('Administrator access required', 'FORBIDDEN');
  }

  return user;
}
