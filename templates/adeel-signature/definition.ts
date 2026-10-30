import type { TemplateDefinition } from '@/types';

export const adeelSignatureTemplate: TemplateDefinition = {
  key: 'adeel-signature',
  name: 'Adeel Ul Rehman Signature',
  description:
    'Official signature CV layout of Adeel Ul Rehman. High-density single-column format with deep navy headings (#1F3864), royal blue section accent rules (#2E5395), and precision alignment strictly optimized for a single-page presentation.',
  category: 'Modern',
  sourceFile: 'downloaded_templates/Adeel_Ul_Rehman_CV.docx',
  supportedSections: [
    'summary',
    'skills',
    'experience',
    'projects',
    'education',
    'strengths',
    'interests',
    'certifications',
    'languages',
    'custom',
  ],
  defaultConfig: {
    fontFamily: 'Calibri',
    fontSizePt: 9.5,
    primaryColor: '#1F3864',
    spacingScale: 1.0,
    showPhoto: false,
    pageSize: 'A4',
  },
  layoutHints: {
    columns: 1,
    hasSidebar: false,
    headerStyle: 'left',
  },
};

