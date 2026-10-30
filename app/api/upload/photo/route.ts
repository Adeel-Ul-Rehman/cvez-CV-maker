import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { rateLimit } from '@/lib/rateLimit';
import {
  ALLOWED_FOLDERS,
  ALLOWED_MIME_TYPES,
  uploadBuffer,
} from '@/lib/cloudinary';
import { badRequest, handleApiError } from '@/lib/errors';

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

    // 3. Validate file size (100 KB max limit)
    const MAX_PHOTO_SIZE_BYTES = 100 * 1024;
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      throw badRequest(
        'Profile picture size exceeds the 100 KB limit. Please select an image under 100 KB.',
        'INVALID_FILE_SIZE'
      );
    }

    // 4. Rate limiting: 10 photo uploads per user per minute
    const limit = rateLimit(`photo:${authUser.userId}`, 10, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many upload attempts. Please wait a minute.' } },
        { status: 429 }
      );
    }

    // 5. Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Upload to Cloudinary
    const publicId = `cv-photo-${authUser.userId}-${Date.now()}`;
    const uploadRes = await uploadBuffer(buffer, {
      folder: ALLOWED_FOLDERS.CV_PHOTOS,
      publicId,
    });

    return NextResponse.json({
      ok: true,
      data: {
        photoUrl: uploadRes.url,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
