import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/schemas/auth';
import { sql } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createOtpRecord } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/email';
import { conflict, handleApiError } from '@/lib/errors';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        { status: 429 }
      );
    }

    const body = await req.json();
    const data = registerSchema.parse(body);

    const existingUsers = await sql`
      SELECT id, email, email_verified
      FROM users
      WHERE email = ${data.email}
      LIMIT 1;
    `;

    let userId: string;

    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.email_verified) {
        throw conflict('An account with this email already exists', 'EMAIL_EXISTS');
      }

      // Existing unverified user: update credentials and resend verification
      userId = existing.id;
      const passwordHash = await hashPassword(data.password);
      await sql`
        UPDATE users
        SET password_hash = ${passwordHash}, full_name = ${data.fullName}, updated_at = now()
        WHERE id = ${userId};
      `;
    } else {
      // New user
      const passwordHash = await hashPassword(data.password);
      const inserted = await sql`
        INSERT INTO users (email, password_hash, full_name, role, email_verified, provider)
        VALUES (${data.email}, ${passwordHash}, ${data.fullName}, 'user', FALSE, 'email')
        RETURNING id;
      `;
      userId = inserted[0].id;
    }

    const { code } = await createOtpRecord(userId, 'email_verify');
    await sendOtpEmail(data.email, code, 'email_verify');

    return NextResponse.json({
      ok: true,
      data: {
        email: data.email,
        needsVerification: true,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
