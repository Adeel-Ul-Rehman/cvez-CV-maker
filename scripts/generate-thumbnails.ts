import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { TEMPLATE_KEYS } from '../templates/registry';
import { sql } from '../lib/db';

function findLocalBrowserExecutable(): string {
  const platform = process.platform;
  if (platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env.LOCALAPPDATA
        ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe')
        : '',
      process.env.PROGRAMFILES
        ? path.join(process.env.PROGRAMFILES, 'Google\\Chrome\\Application\\chrome.exe')
        : '',
    ].filter(Boolean);

    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }
  throw new Error('No local browser executable found');
}

async function main() {
  console.log('============================================================');
  console.log('GENERATING TEMPLATE THUMBNAILS VIA PUPPETEER');
  console.log('============================================================\n');

  const executablePath = findLocalBrowserExecutable();
  console.log('Using browser at:', executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const outDir = path.resolve(process.cwd(), 'public', 'template-thumbnails');
  fs.mkdirSync(outDir, { recursive: true });

  for (const key of TEMPLATE_KEYS) {
    try {
      console.log(`Rendering thumbnail for [${key}]...`);
      const page = await browser.newPage();
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 2,
      });

      const url = `http://localhost:3000/api/templates/${key}/sample-preview`;
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      const outPath = path.join(outDir, `${key}.png`);
      await page.screenshot({
        path: outPath,
        type: 'png',
        clip: {
          x: 0,
          y: 0,
          width: 794,
          height: 1123,
        },
      });

      const stats = fs.statSync(outPath);
      console.log(`  ✓ Saved ${outPath} (${Math.round(stats.size / 1024)} KB)`);

      // Update in DB
      await sql`
        UPDATE templates
        SET thumbnail_url = ${`/template-thumbnails/${key}.png`},
            updated_at = now()
        WHERE template_key = ${key};
      `;

      await page.close();
    } catch (err) {
      console.error(`  ✗ Error rendering thumbnail for ${key}:`, err);
    }
  }

  await browser.close();
  console.log('\n============================================================');
  console.log('THUMBNAIL GENERATION COMPLETE');
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('Fatal error in thumbnail generator:', err);
  process.exit(1);
});
