import type { TemplateDefinition } from '@/types';

export const europassTemplate: TemplateDefinition = {
  key: 'europass',
  name: 'Europass CV',
  description: 'Official European Union CV format with clean timeline layout and photo support',
  category: 'EU',
  sourceFile: 'downloaded_templates/europass_cv_template.docx',
  supportedSections: [
    'summary',
    'experience',
    'education',
    'skills',
    'certifications',
    'languages',
  ],
  defaultConfig: {
    fontFamily: 'Arial',
    fontSizePt: 10.5,
    primaryColor: '#0B3D91',
    spacingScale: 1.0,
    showPhoto: true,
    pageSize: 'A4',
  },
  layoutHints: {
    columns: 1,
    hasSidebar: false,
    headerStyle: 'left',
  },
};
