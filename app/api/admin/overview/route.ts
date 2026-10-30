import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { getOverviewStats, getRecentActivity } from '@/lib/admin/stats';
import { enforceAdminRateLimit } from '@/lib/admin/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    enforceAdminRateLimit(admin.userId, false);

    const [stats, recentActivity] = await Promise.all([
      getOverviewStats(),
      getRecentActivity(20),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        ...stats,
        recentActivity,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
