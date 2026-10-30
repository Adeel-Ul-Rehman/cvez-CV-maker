import React from 'react';
import { CvRenderer } from '@/lib/renderer/CvRenderer';
import { printResetCss } from '@/lib/renderer/styles';
import type { CvData, CvConfig } from '@/lib/cv/schema';

// Use dynamic require for react-dom/server to comply with Next.js App Router RSC requirements
const { renderToStaticMarkup } = require('react-dom/server');

/**
 * Server-renders a CV into a complete standalone HTML document suitable for Puppeteer rendering.
 */
export async function renderCvHtml(cv: {
  templateKey: string;
  data: CvData;
  config: CvConfig;
}): Promise<string> {
  const element = React.createElement(CvRenderer, {
    templateKey: cv.templateKey,
    data: cv.data,
    config: cv.config,
  });

  const cvHtml = renderToStaticMarkup(element);
  const pageSize = cv.config.pageSize || 'A4';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${printResetCss(pageSize)}</style>
  <style>
    /* Force exact print dimensions for PDF and image export */
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    [data-cv-root] {
      width: ${pageSize === 'LETTER' ? '8.5in' : '210mm'};
      min-height: ${pageSize === 'LETTER' ? '11in' : '297mm'};
      margin: 0;
      box-shadow: none !important;
    }
  </style>
</head>
<body>${cvHtml}</body>
</html>`;
}
