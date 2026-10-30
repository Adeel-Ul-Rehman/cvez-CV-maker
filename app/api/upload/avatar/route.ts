import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { rateLimit } from '@/lib/rateLimit';
import {
  ALLOWED_FOLDERS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  uploadBuffer,
  deleteAsset,
} from '@/lib/cloudinary';
import { badRequest, handleApiError, notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // 1. Parse multipart/form-data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string' || !(file instanceof Blob)) {
      throw badRequest('File is required in form-data field "file"', 'MISSING_FILE');
    }

    // 2. Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      throw badRequest(
        'Invalid file type. Only PNG, JPEG, and WebP images are supported',
        'INVALID_FILE_TYPE'
      );
    }

    // 3. Validate file size (100 KB max limit for avatars)
    const MAX_AVATAR_SIZE_BYTES = 100 * 1024;
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      throw badRequest(
        'Profile picture size exceeds the 100 KB limit. Please select an image under 100 KB.',
        'INVALID_FILE_SIZE'
      );
    }

    // 4. Rate limiting: 1 avatar upload per user per 60s
    const limit = rateLimit(`avatar:${authUser.userId}`, 1, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many upload attempts. Please wait a minute.' } },
        { status: 429 }
      );
    }

    // 5. Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Check existing user for old avatar
    const userRows = await sql`
      SELECT id, avatar_url FROM users WHERE id = ${authUser.userId} LIMIT 1;
    `;

    if (!userRows || userRows.length === 0) {
      throw notFound('User not found', 'USER_NOT_FOUND');
    }

    const oldAvatarUrl = userRows[0].avatar_url;

    // 7. Upload to Cloudinary
    const publicId = `user-${authUser.userId}-${Date.now()}`;
    const uploadRes = await uploadBuffer(buffer, {
      folder: ALLOWED_FOLDERS.AVATARS,
      publicId,
    });

    // 8. Update users table in DB
    await sql`
      UPDATE users
      SET avatar_url = ${uploadRes.url}, updated_at = now()
      WHERE id = ${authUser.userId};
    `;

    // 9. If previous avatar was stored in Cloudinary avatars folder, delete it
    if (oldAvatarUrl && oldAvatarUrl.includes('cv-maker/avatars/')) {
      const match = oldAvatarUrl.match(/(cv-maker\/avatars\/[^.\/]+)/);
      if (match && match[1]) {
        await deleteAsset(match[1]);
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        avatarUrl: uploadRes.url,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
