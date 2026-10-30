import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { renderToStaticMarkup } = require('react-dom/server');
import { getTemplate } from '@/templates/registry';
import { defaultConfigFor } from '@/lib/cv/schema';
import { getSampleDataForTemplate } from '@/lib/cv/sample-data';
import { CvRenderer } from '@/lib/renderer/CvRenderer';
import { printResetCss } from '@/lib/renderer/styles';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const templateKey = params.key;
    let template = getTemplate(templateKey);
    let sampleData: any = null;
    let config: any = null;

    if (!template) {
      // Check database for dynamically imported template
      try {
        const rows = await sql`
          SELECT template_key, name, description, category, definition
          FROM templates
          WHERE template_key = ${templateKey}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          const row = rows[0];
          template = row.definition || {
            key: row.template_key,
            name: row.name,
            description: row.description,
            category: row.category,
            supportedSections: ['experience', 'education', 'skills', 'strengths', 'interests'],
            defaultConfig: {
              fontFamily: 'Inter',
              fontSizePt: 10,
              primaryColor: '#0070C0',
              spacingScale: 1.0,
              showPhoto: true,
              pageSize: 'A4',
            },
          };
          if ((row.definition as any)?.sampleData) {
            sampleData = (row.definition as any).sampleData;
          }
        }
      } catch (dbErr) {
        console.error('Failed to load template from DB:', dbErr);
      }
    }

    if (!template) {
      // Graceful fallback for dynamic preview
      template = {
        key: templateKey,
        name: templateKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: 'Custom imported template',
        category: 'Modern',
        sourceFile: '',
        supportedSections: ['experience', 'education', 'skills', 'strengths', 'interests'],
        defaultConfig: {
          fontFamily: 'Times New Roman',
          fontSizePt: 10,
          primaryColor: '#0070C0',
          spacingScale: 1.0,
          showPhoto: true,
          pageSize: 'A4',
        },
        layoutHints: {
          columns: 2,
          hasSidebar: true,
          headerStyle: 'left',
        },
      };
    }

    config = (template as any).defaultConfig || defaultConfigFor(templateKey);
    if (!sampleData) {
      sampleData = getSampleDataForTemplate(templateKey);
    }

    const cvElement = React.createElement(CvRenderer, {
      templateKey,
      data: sampleData,
      config,
    });

    const cvHtml = renderToStaticMarkup(cvElement);

    const documentHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=794, initial-scale=1" />
  <title>${template.name} - Sample Preview</title>
  <style>
    ${printResetCss()}
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      width: 794px !important;
      min-height: 1123px !important;
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
<body style="overflow: hidden; margin: 0; padding: 0;">
  ${cvHtml}
</body>
</html>`;

    return new NextResponse(documentHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return new NextResponse(`Preview error: ${err.message}`, { status: 500 });
  }
}
