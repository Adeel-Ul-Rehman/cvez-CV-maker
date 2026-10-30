import { NextResponse } from 'next/server';
import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { renderToStaticMarkup } = require('react-dom/server');
import { sql } from '@/lib/db';
import { env } from '@/lib/env';
import { cloudinary } from '@/lib/cloudinary';
import { TEMPLATES, TEMPLATE_KEYS } from '@/templates/registry';
import { CvRenderer } from '@/lib/renderer/CvRenderer';
import { defaultConfigFor, emptyCvData } from '@/lib/cv/schema';
import { generatePdf } from '@/lib/export/pdf';
import { aiComplete } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  const checks: {
    database: string;
    env: string;
    templates: string;
    cloudinary: string;
    renderer: string;
    export: string;
    ai: string;
    admin: string;
  } = {
    database: 'error',
    env: 'error',
    templates: 'error',
    cloudinary: 'error',
    renderer: 'error',
    export: 'error',
    ai: 'error',
    admin: 'error',
  };

  // 1. Env check
  try {
    if (env.DATABASE_URL) {
      checks.env = 'ok';
    }
  } catch {
    checks.env = 'error';
  }

  // 2. Templates check
  if (TEMPLATES.length >= 3) {
    checks.templates = `ok (${TEMPLATES.length})`;
  } else {
    checks.templates = 'error';
  }

  // 3. Database check
  try {
    const result = await sql`SELECT 1 as alive;`;
    if (result && result.length > 0) {
      checks.database = 'ok';
    }
  } catch (error) {
    console.error('Health check database error:', error);
    checks.database = 'error';
  }

  // 4. Cloudinary check (8s timeout)
  try {
    const pingPromise = cloudinary.api.ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Cloudinary ping timeout')), 8000)
    );

    const pingRes: any = await Promise.race([pingPromise, timeoutPromise]);
    if (pingRes?.status === 'ok') {
      checks.cloudinary = 'ok';
    } else {
      checks.cloudinary = 'error';
    }
  } catch (error) {
    console.error('Health check Cloudinary error:', error);
    checks.cloudinary = 'error';
  }

  // 5. Renderer check: render stub for each of the 3 templates
  try {
    let renderedCount = 0;
    const failedTemplates: string[] = [];

    for (const key of TEMPLATE_KEYS) {
      try {
        const stubData = emptyCvData('Test User');
        const stubConfig = defaultConfigFor(key);
        const element = React.createElement(CvRenderer, {
          templateKey: key,
          data: stubData,
          config: stubConfig,
        });
        const html = renderToStaticMarkup(element);
        if (html && html.includes('Test User')) {
          renderedCount++;
        } else {
          failedTemplates.push(key);
        }
      } catch {
        failedTemplates.push(key);
      }
    }

    if (renderedCount === TEMPLATE_KEYS.length) {
      checks.renderer = `ok (${renderedCount})`;
    } else {
      checks.renderer = `error (${failedTemplates.join(', ')})`;
    }
  } catch (error) {
    console.error('Health check renderer error:', error);
    checks.renderer = 'error';
  }

  // 6. Export check (PDF generation check)
  try {
    const stubData = emptyCvData('Test User');
    const stubConfig = defaultConfigFor('europass');
    const pdfBuf = await generatePdf({
      templateKey: 'europass',
      data: stubData,
      config: stubConfig,
    });
    if (pdfBuf && pdfBuf.length > 1000 && pdfBuf.toString('utf-8', 0, 4) === '%PDF') {
      checks.export = 'ok';
    } else {
      checks.export = 'error';
    }
  } catch (error) {
    console.error('Health check export error:', error);
    checks.export = 'error';
  }

  // 7. AI check (Probe aiComplete with 10s timeout)
  try {
    const aiRes = await aiComplete([{ role: 'user', content: 'Reply with just: ok' }], {
      maxTokens: 50,
      timeoutMs: 10000,
    });
    if (aiRes && aiRes.text) {
      checks.ai = `ok (${aiRes.provider})`;
    } else {
      checks.ai = 'unavailable';
    }
  } catch (error) {
    // Graceful degradation: AI unavailability does not fail the whole service health
    checks.ai = 'unavailable';
  }

  // 8. Admin check (Verify admin_audit_logs table existence)
  try {
    const adminRows = await sql`SELECT 1 FROM admin_audit_logs LIMIT 1;`;
    if (adminRows) {
      checks.admin = 'ok';
    } else {
      checks.admin = 'error';
    }
  } catch (error) {
    console.error('Health check admin error:', error);
    checks.admin = 'error';
  }

  const ok =
    checks.database === 'ok' &&
    checks.env === 'ok' &&
    checks.templates.startsWith('ok') &&
    checks.cloudinary === 'ok' &&
    checks.renderer.startsWith('ok') &&
    checks.export === 'ok' &&
    checks.admin === 'ok';

  const responseBody = {
    ok,
    checks,
    timestamp,
  };

  return NextResponse.json(responseBody, {
    status: ok ? 200 : 503,
  });
}
