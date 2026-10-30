import { NextRequest, NextResponse } from 'next/server';
import { resendOtpSchema } from '@/lib/schemas/auth';
import { sql } from '@/lib/db';
import { createOtpRecord } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/email';
import { handleApiError } from '@/lib/errors';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = resendOtpSchema.parse(body);

    const limit = rateLimit(`resend-otp:${data.email}`, 3, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        { status: 429 }
      );
    }

    const userRows = await sql`
      SELECT id, email, email_verified
      FROM users
      WHERE email = ${data.email}
      LIMIT 1;
    `;

    if (userRows.length > 0) {
      const user = userRows[0];
      const { code } = await createOtpRecord(user.id, data.purpose);
      await sendOtpEmail(user.email, code, data.purpose);
    }

    // Always return generic success to prevent email enumeration
    return NextResponse.json({
      ok: true,
      data: {
        sent: true,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
