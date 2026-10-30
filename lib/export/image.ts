import { getBrowser } from './browser';
import { renderCvHtml } from './render-html';
import type { CvData, CvConfig } from '@/lib/cv/schema';

export async function generatePng(cv: {
  templateKey: string;
  data: CvData;
  config: CvConfig;
}): Promise<Buffer> {
  const html = await renderCvHtml(cv);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 794px corresponds to 210mm at 96 DPI. deviceScaleFactor 2 produces high-DPI retina output (~1588x2246)
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const screenshot = await page.screenshot({
      fullPage: true,
      type: 'png',
    });

    return Buffer.from(screenshot);
  } finally {
    await page.close();
  }
}

export async function generateJpg(cv: {
  templateKey: string;
  data: CvData;
  config: CvConfig;
}): Promise<Buffer> {
  const html = await renderCvHtml(cv);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const screenshot = await page.screenshot({
      fullPage: true,
      type: 'jpeg',
      quality: 95,
    });

    return Buffer.from(screenshot);
  } finally {
    await page.close();
  }
}
