import { getBrowser } from './browser';
import { renderCvHtml } from './render-html';
import type { CvData, CvConfig } from '@/lib/cv/schema';

export async function generatePdf(cv: {
  templateKey: string;
  data: CvData;
  config: CvConfig;
}): Promise<Buffer> {
  const html = await renderCvHtml(cv);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
      const imgs = Array.from(document.images);
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    const isLetter = cv.config.pageSize === 'LETTER';

    const pdfData = await page.pdf({
      format: isLetter ? 'Letter' : 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfData);
  } finally {
    await page.close();
  }
}
