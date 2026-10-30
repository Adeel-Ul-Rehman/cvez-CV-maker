import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/schemas/auth';
import { sql } from '@/lib/db';
import { createOtpRecord } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/email';
import { handleApiError } from '@/lib/errors';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = forgotPasswordSchema.parse(body);

    const limit = rateLimit(`forgot-password:${data.email}`, 3, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        { status: 429 }
      );
    }

    const userRows = await sql`
      SELECT id, email
      FROM users
      WHERE email = ${data.email}
      LIMIT 1;
    `;

    if (userRows.length > 0) {
      const user = userRows[0];
      const { code } = await createOtpRecord(user.id, 'password_reset');
      console.log(`\n========================================\n[AUTH] 📧 Password Reset OTP for ${user.email}: [ ${code} ]\n========================================\n`);
      await sendOtpEmail(user.email, code, 'password_reset');
    }

    // Anti-enumeration: always return generic success
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
