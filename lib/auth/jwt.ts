import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env';
import { unauthorized } from '../errors';

const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface AccessTokenPayload {
  sub: string;
  role: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface ResetTokenPayload {
  sub: string;
  purpose: string;
}

/**
 * Signs a short-lived access token (HS256)
 */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_MINUTES}m`)
    .sign(accessSecret);
}

/**
 * Signs a long-lived refresh token (HS256)
 */
export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setJti(payload.jti)
    .setIssuedAt()
    .setExpirationTime(`${env.REFRESH_TOKEN_TTL_DAYS}d`)
    .sign(refreshSecret);
}

/**
 * Verifies and decodes an access token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, {
      algorithms: ['HS256'],
    });

    if (!payload.sub || typeof payload.role !== 'string' || typeof payload.email !== 'string') {
      throw unauthorized('Malformed access token payload', 'INVALID_TOKEN');
    }

    return {
      sub: payload.sub,
      role: payload.role,
      email: payload.email,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw unauthorized('Invalid or expired access token', 'INVALID_TOKEN');
  }
}

/**
 * Verifies and decodes a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret, {
      algorithms: ['HS256'],
    });

    if (!payload.sub || !payload.jti) {
      throw unauthorized('Malformed refresh token payload', 'INVALID_TOKEN');
    }

    return {
      sub: payload.sub,
      jti: payload.jti,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw unauthorized('Invalid or expired refresh token', 'INVALID_TOKEN');
  }
}

/**
 * Signs a short-lived password reset token (10 min)
 */
export async function signResetToken(payload: { sub: string }): Promise<string> {
  return new SignJWT({ purpose: 'pw_reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(accessSecret);
}

/**
 * Verifies a password reset token
 */
export async function verifyResetToken(token: string): Promise<ResetTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, {
      algorithms: ['HS256'],
    });

    if (!payload.sub || payload.purpose !== 'pw_reset') {
      throw unauthorized('Invalid password reset token', 'INVALID_RESET_TOKEN');
    }

    return {
      sub: payload.sub,
      purpose: payload.purpose,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw unauthorized('Invalid or expired password reset token', 'INVALID_RESET_TOKEN');
  }
}
