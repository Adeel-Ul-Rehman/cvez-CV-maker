import type { CvData, CvConfig } from '../cv/schema';

export interface RenderContext {
  templateKey: string;
  data: CvData;
  config: CvConfig;
}

export interface TemplateProps {
  data: CvData;
  config: CvConfig;
}
