import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { renderToStaticMarkup } = require('react-dom/server');
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { CvRenderer } from '@/lib/renderer/CvRenderer';
import { printResetCss } from '@/lib/renderer/styles';
import { handleApiError, notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth(req);
    const cvId = params.id;

    // Fetch CV with owner verification
    const rows = await sql`
      SELECT * FROM cvs
      WHERE id = ${cvId} AND user_id = ${authUser.userId}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      throw notFound('CV not found', 'CV_NOT_FOUND');
    }

    const cv = rows[0];

    // Render CvRenderer to HTML string
    const cvElement = React.createElement(CvRenderer, {
      templateKey: cv.template_key,
      data: cv.data,
      config: cv.config,
    });

    const cvHtml = renderToStaticMarkup(cvElement);

    // If ?raw=1, return only the inner HTML component without the document shell
    const isRaw = req.nextUrl.searchParams.get('raw') === '1';
    if (isRaw) {
      return new NextResponse(cvHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    const pageSize = cv.config?.pageSize || 'A4';
    const isLetter = pageSize === 'LETTER';
    const pageWidth = isLetter ? '816px' : '794px';
    const pageMinHeight = isLetter ? '1056px' : '1123px';
    const isEmbed =
      req.nextUrl.searchParams.get('embed') === '1' ||
      req.nextUrl.searchParams.get('mode') === 'embed';

    const fullHtml = isEmbed
      ? `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=${pageWidth}, initial-scale=1.0">
  <title>${cv.title ? `${cv.title} - Preview` : 'CV Preview'}</title>
  <style>
    ${printResetCss(pageSize)}
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      width: ${pageWidth} !important;
      min-height: ${pageMinHeight} !important;
      overflow: hidden !important;
      -ms-overflow-style: none !important;
      scrollbar-width: none !important;
      box-sizing: border-box !important;
    }
    ::-webkit-scrollbar {
      display: none !important;
    }
  </style>
</head>
<body style="overflow: hidden; margin: 0; padding: 0; background: #ffffff;">
  ${cvHtml}
</body>
</html>`
      : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cv.title ? `${cv.title} - Preview` : 'CV Preview'}</title>
  <style>${printResetCss(pageSize)}</style>
</head>
<body style="display: flex; justify-content: center; padding: 20px 0;">
  ${cvHtml}
</body>
</html>`;

    return new NextResponse(fullHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
