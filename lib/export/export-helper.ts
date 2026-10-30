import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { rateLimit } from '@/lib/rateLimit';
import { AppError, handleApiError, notFound } from '@/lib/errors';

export async function handleCvExport(
  req: NextRequest,
  cvId: string,
  ext: 'pdf' | 'docx' | 'png' | 'jpg',
  mimeType: string,
  generator: (cv: { template_key: string; data: any; config: any }) => Promise<Buffer>
): Promise<Response> {
  try {
    const authUser = await requireAuth(req);

    // Fetch CV with owner check (404 if not found or not owner)
    const rows = await sql`
      SELECT id, title, template_key, data, config
      FROM cvs
      WHERE id = ${cvId} AND user_id = ${authUser.userId}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      throw notFound('CV not found', 'CV_NOT_FOUND');
    }

    const cv = rows[0] as unknown as {
      id: string;
      title: string;
      template_key: string;
      data: any;
      config: any;
    };

    // Enforce rate limit: 10 exports per user per 5 minutes
    const limiter = rateLimit(`export:${authUser.userId}`, 10, 5 * 60_000);
    if (!limiter.allowed) {
      throw new AppError(429, 'RATE_LIMITED', 'Too many export requests');
    }

    const startTime = Date.now();
    let buffer: Buffer;
    try {
      buffer = await generator(cv);

      const durationMs = Date.now() - startTime;
      sql`
        INSERT INTO export_events (
          user_id,
          cv_id,
          format,
          template_key,
          duration_ms,
          success,
          error_code
        ) VALUES (
          ${authUser.userId},
          ${cvId},
          ${ext},
          ${cv.template_key},
          ${durationMs},
          TRUE,
          NULL
        );
      `.catch((e) => console.error('Failed to log export success event:', e));
    } catch (genErr: any) {
      const durationMs = Date.now() - startTime;
      const errorCode = genErr?.code || 'EXPORT_FAILED';

      sql`
        INSERT INTO export_events (
          user_id,
          cv_id,
          format,
          template_key,
          duration_ms,
          success,
          error_code
        ) VALUES (
          ${authUser.userId},
          ${cvId},
          ${ext},
          ${cv.template_key},
          ${durationMs},
          FALSE,
          ${errorCode}
        );
      `.catch((e) => console.error('Failed to log export failure event:', e));

      console.error(`Export ${ext} failed for CV ${cvId}:`, genErr);
      return Response.json(
        {
          ok: false,
          error: {
            code: 'EXPORT_FAILED',
            message: genErr?.message || `Failed to generate ${ext.toUpperCase()}`,
          },
        },
        { status: 500 }
      );
    }

    // Filename sanitization: strip non [a-zA-Z0-9-_ ], trim, fallback to "cv"
    const sanitizedTitle = (cv.title || 'cv').replace(/[^a-zA-Z0-9\-_ ]/g, '').trim() || 'cv';
    const filename = `${sanitizedTitle}-${cv.template_key}.${ext}`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
