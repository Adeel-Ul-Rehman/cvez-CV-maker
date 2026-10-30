import type { CvData, CvConfig } from '@/lib/cv/schema';
import { generateEuropassDocx } from './europass';
import { generateJobhireChronologicalDocx } from './jobhire-chronological';
import { generateJobhireCreativeDocx } from './jobhire-creative';
import { generateAdeelSignatureDocx } from './new-templates';

/**
 * Dispatcher to generate an editable Microsoft Word (.docx) document Buffer
 * for any of the registered CV templates.
 */
export async function generateDocx(
  templateKey: string,
  cv: { data: CvData; config: CvConfig }
): Promise<Buffer> {
  const context = { data: cv.data, config: cv.config };

  switch (templateKey) {
    case 'adeel-signature':
      return await generateAdeelSignatureDocx(context);
    case 'jobhire-chronological':
      return await generateJobhireChronologicalDocx(context);
    case 'jobhire-creative':
      return await generateJobhireCreativeDocx(context);
    case 'europass':
    default:
      return await generateEuropassDocx(context);
  }
}

export * from './types';
export * from './common';
