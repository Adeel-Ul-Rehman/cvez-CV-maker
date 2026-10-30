import type { CvData, CvConfig } from '@/lib/cv/schema';

export interface DocxRenderContext {
  data: CvData;
  config: CvConfig;
}

export interface DocxTemplateGenerator {
  (ctx: DocxRenderContext): Promise<Buffer>;
}
