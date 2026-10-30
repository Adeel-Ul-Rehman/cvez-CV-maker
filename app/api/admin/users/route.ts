import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { adminUsersQuerySchema } from '@/lib/schemas/admin';
import { enforceAdminRateLimit } from '@/lib/admin/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, false);

    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, search, role, verified } = adminUsersQuerySchema.parse(queryParams);

    const offset = (page - 1) * limit;
    const searchPattern = search ? `%${search}%` : null;

    // Fetch total matching count
    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM users u
      WHERE
        (${searchPattern}::text IS NULL OR u.email ILIKE ${searchPattern} OR u.full_name ILIKE ${searchPattern})
        AND (${role || null}::text IS NULL OR u.role = ${role})
        AND (${verified === undefined ? null : verified}::boolean IS NULL OR u.email_verified = ${verified});
    `;
    const total = countRows[0]?.total || 0;

    // Fetch paginated user rows with lastActivityAt
    const users = await sql`
      SELECT
        u.id,
        u.email,
        u.full_name AS "fullName",
        u.role,
        u.email_verified AS "emailVerified",
        u.provider,
        u.cv_count AS "cvCount",
        u.created_at AS "createdAt",
        (
          SELECT GREATEST(MAX(rt.created_at), u.created_at)
          FROM refresh_tokens rt
          WHERE rt.user_id = u.id
        ) AS "lastActivityAt"
      FROM users u
      WHERE
        (${searchPattern}::text IS NULL OR u.email ILIKE ${searchPattern} OR u.full_name ILIKE ${searchPattern})
        AND (${role || null}::text IS NULL OR u.role = ${role})
        AND (${verified === undefined ? null : verified}::boolean IS NULL OR u.email_verified = ${verified})
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return NextResponse.json({
      ok: true,
      data: {
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          emailVerified: u.emailVerified,
          provider: u.provider,
          cvCount: u.cvCount,
          createdAt: new Date(u.createdAt).toISOString(),
          lastActivityAt: u.lastActivityAt ? new Date(u.lastActivityAt).toISOString() : null,
        })),
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
