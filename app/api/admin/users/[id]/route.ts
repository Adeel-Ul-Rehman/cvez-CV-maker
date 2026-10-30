import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { badRequest, handleApiError, notFound } from '@/lib/errors';
import { adminUpdateUserSchema } from '@/lib/schemas/admin';
import { logAdminAction } from '@/lib/admin/audit';
import { enforceAdminRateLimit } from '@/lib/admin/rate-limit';
import { revokeAllForUser } from '@/lib/auth/tokens';
import { deleteAsset } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, false);

    const { id } = params;

    const userRows = await sql`
      SELECT
        u.id,
        u.email,
        u.full_name AS "fullName",
        u.role,
        u.email_verified AS "emailVerified",
        u.provider,
        u.avatar_url AS "avatarUrl",
        u.cv_count AS "cvCount",
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt"
      FROM users u
      WHERE u.id = ${id}
      LIMIT 1;
    `;

    if (!userRows || userRows.length === 0) {
      throw notFound('User not found', 'USER_NOT_FOUND');
    }

    const user = userRows[0];

    // Fetch user's CVs and aggregate counts in parallel
    const [cvRows, exportCountRows, aiCountRows] = await Promise.all([
      sql`
        SELECT id, title, template_key AS "templateKey", updated_at AS "updatedAt", is_public AS "isPublic"
        FROM cvs
        WHERE user_id = ${id}
        ORDER BY updated_at DESC;
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM export_events
        WHERE user_id = ${id};
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM ai_usage_logs
        WHERE user_id = ${id};
      `,
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified,
          provider: user.provider,
          avatarUrl: user.avatarUrl,
          createdAt: new Date(user.createdAt).toISOString(),
          updatedAt: new Date(user.updatedAt).toISOString(),
        },
        cvs: cvRows.map((c) => ({
          id: c.id,
          title: c.title,
          templateKey: c.templateKey,
          updatedAt: new Date(c.updatedAt).toISOString(),
          isPublic: c.isPublic,
        })),
        aggregates: {
          cvCount: user.cvCount,
          exportsTotal: exportCountRows[0]?.total || 0,
          aiCallsTotal: aiCountRows[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, true);

    const { id } = params;
    const body = await req.json();
    const { role, emailVerified } = adminUpdateUserSchema.parse(body);

    const userRows = await sql`
      SELECT id, email, role, email_verified
      FROM users
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (!userRows || userRows.length === 0) {
      throw notFound('User not found', 'USER_NOT_FOUND');
    }

    const targetUser = userRows[0];

    // Self demotion check
    if (id === admin.userId && role === 'user') {
      throw badRequest('Cannot demote self', 'CANNOT_DEMOTE_SELF');
    }

    // Last admin protection on demotion
    if (targetUser.role === 'admin' && role === 'user') {
      const adminCountRows = await sql`
        SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin';
      `;
      if ((adminCountRows[0]?.count || 0) <= 1) {
        throw badRequest('Cannot demote the last remaining admin', 'LAST_ADMIN_PROTECTED');
      }
    }

    // Update fields
    const updatedRows = await sql`
      UPDATE users
      SET
        role = COALESCE(${role || null}, role),
        email_verified = COALESCE(${emailVerified === undefined ? null : emailVerified}, email_verified),
        updated_at = now()
      WHERE id = ${id}
      RETURNING id, email, full_name AS "fullName", role, email_verified AS "emailVerified", updated_at AS "updatedAt";
    `;

    // Force re-login on role change
    if (role && role !== targetUser.role) {
      await revokeAllForUser(id);
    }

    const action = role ? 'user.update_role' : 'user.verify_email';
    logAdminAction(admin.userId, action, 'user', id, {
      previousRole: targetUser.role,
      newRole: role,
      emailVerified,
    });

    return NextResponse.json({
      ok: true,
      data: {
        user: updatedRows[0],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, true);

    const { id } = params;

    // Self deletion check
    if (id === admin.userId) {
      throw badRequest('Cannot delete self', 'CANNOT_DELETE_SELF');
    }

    const userRows = await sql`
      SELECT id, email, role, avatar_url
      FROM users
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (!userRows || userRows.length === 0) {
      throw notFound('User not found', 'USER_NOT_FOUND');
    }

    const targetUser = userRows[0];

    // Last admin protection on deletion
    if (targetUser.role === 'admin') {
      const adminCountRows = await sql`
        SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin';
      `;
      if ((adminCountRows[0]?.count || 0) <= 1) {
        throw badRequest('Cannot delete the last remaining admin', 'LAST_ADMIN_PROTECTED');
      }
    }

    // Optionally clean Cloudinary avatar
    if (targetUser.avatar_url && typeof targetUser.avatar_url === 'string') {
      try {
        const match = targetUser.avatar_url.match(/cv-maker\/avatars\/[^.]+/);
        if (match) {
          await deleteAsset(match[0]);
        }
      } catch (cloudErr) {
        console.warn('Failed to delete avatar from Cloudinary on user delete:', cloudErr);
      }
    }

    // Cascade deletes CVs, versions, tokens via DB Foreign Keys
    await sql`DELETE FROM users WHERE id = ${id};`;

    logAdminAction(admin.userId, 'user.delete', 'user', id, {
      email: targetUser.email,
    });

    return NextResponse.json({
      ok: true,
      data: {
        message: 'User deleted successfully',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
