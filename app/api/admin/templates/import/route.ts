import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { handleApiError, badRequest } from '@/lib/errors';
import { logAdminAction } from '@/lib/admin/audit';
import { getBrowser } from '@/lib/export/browser';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function runDocxExtractor(
  docxPath: string,
  key: string,
  name: string,
  category: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'docx_extractor.py');
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';

    const args = [
      scriptPath,
      '--docx',
      docxPath,
      '--key',
      key,
      '--name',
      name,
      '--category',
      category,
      '--out-root',
      process.cwd(),
    ];

    const child = spawn(pythonExe, args);
    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(
          new Error(`Docx extractor failed (code ${code}): ${stderrData || stdoutData}`)
        );
      }
      try {
        const json = JSON.parse(stdoutData.trim());
        resolve(json);
      } catch (err: any) {
        reject(new Error(`Failed to parse docx extractor output: ${err.message}\nRaw: ${stdoutData}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}

async function captureTemplateThumbnail(templateKey: string, req: NextRequest): Promise<string> {
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const previewUrl = `${protocol}://${host}/api/templates/${templateKey}/sample-preview`;

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 });
    await page.goto(previewUrl, { waitUntil: 'networkidle0', timeout: 20000 });

    const thumbDir = path.join(process.cwd(), 'public', 'template-thumbnails');
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }

    const thumbPath = path.join(thumbDir, `${templateKey}.png`);
    await page.screenshot({ path: thumbPath, type: 'png' });
    return `/template-thumbnails/${templateKey}.png`;
  } catch (err: any) {
    console.error('Failed to capture template thumbnail via Puppeteer:', err);
    return `/template-thumbnails/${templateKey}.png`;
  } finally {
    await page.close();
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const contentType = req.headers.get('content-type') || '';

    let templateName = '';
    let templateKey = '';
    let category = 'Modern';
    let isAts = false;
    let docxFilePath = '';
    let tempFileCreated = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      templateName = (formData.get('name') as string) || '';
      templateKey = (formData.get('key') as string) || '';
      category = (formData.get('category') as string) || 'Modern';
      isAts = formData.get('isAts') === 'true' || formData.get('isAtsFriendly') === 'true';

      const file = formData.get('file') as File | null;
      const diskPath = formData.get('filePath') as string | null;

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadDir = path.join(process.cwd(), 'downloaded_templates', 'imported');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const safeFileName = `${Date.now()}-${slugify(file.name || 'template')}.docx`;
        docxFilePath = path.join(uploadDir, safeFileName);
        fs.writeFileSync(docxFilePath, buffer);
        tempFileCreated = true;
      } else if (diskPath && fs.existsSync(diskPath)) {
        docxFilePath = diskPath;
      } else {
        throw badRequest('Please upload a .docx file or provide a valid local filePath');
      }
    } else {
      const json = await req.json();
      templateName = json.name || '';
      templateKey = json.key || '';
      category = json.category || 'Modern';
      isAts = Boolean(json.isAts || json.isAtsFriendly);
      docxFilePath = json.filePath || '';

      if (!docxFilePath || !fs.existsSync(docxFilePath)) {
        throw badRequest(`File not found at specified filePath: ${docxFilePath}`);
      }
    }

    if (!templateName.trim()) {
      throw badRequest('Template display name is required');
    }

    if (!templateKey.trim()) {
      templateKey = slugify(templateName);
    } else {
      templateKey = slugify(templateKey);
    }

    // 1. Run Python Extractor
    const extraction = await runDocxExtractor(docxFilePath, templateKey, templateName, category);

    const templateDef = {
      ...extraction.template,
      category,
      sampleData: extraction.sampleData,
      photoUrl: extraction.photoUrl,
    };

    // 2. Determine display order
    const maxOrderRows = await sql`SELECT COALESCE(MAX(display_order), 0) + 1 AS "nextOrder" FROM templates;`;
    const nextOrder = Number(maxOrderRows[0]?.nextOrder || 10);

    // 3. Upsert into database
    await sql`
      INSERT INTO templates (
        template_key,
        name,
        description,
        category,
        thumbnail_url,
        definition,
        is_active,
        display_order
      )
      VALUES (
        ${templateKey},
        ${templateName},
        ${templateDef.description || 'Imported Word CV Template'},
        ${category},
        ${`/template-thumbnails/${templateKey}.png`},
        ${JSON.stringify(templateDef)}::jsonb,
        TRUE,
        ${nextOrder}
      )
      ON CONFLICT (template_key) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        definition = EXCLUDED.definition,
        thumbnail_url = EXCLUDED.thumbnail_url,
        is_active = TRUE,
        updated_at = now();
    `;

    // 4. Capture display thumbnail via Puppeteer
    let thumbnailPath = `/template-thumbnails/${templateKey}.png`;
    try {
      thumbnailPath = await captureTemplateThumbnail(templateKey, req);
      await sql`
        UPDATE templates
        SET thumbnail_url = ${thumbnailPath}
        WHERE template_key = ${templateKey};
      `;
    } catch (thumbErr) {
      console.warn('Thumbnail generation skipped or deferred:', thumbErr);
    }

    // 5. Audit Log
    try {
      await logAdminAction(admin.userId, 'import_template', 'template', templateKey, {
        name: templateName,
        category,
        source: docxFilePath,
      });
    } catch {
      // Audit non-fatal
    }

    return NextResponse.json({
      ok: true,
      message: `Template "${templateName}" imported successfully!`,
      data: {
        templateKey,
        name: templateName,
        category,
        thumbnailUrl: thumbnailPath,
        definition: templateDef,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
