import type { TemplateDefinition } from '@/types';

export const tealMinimalistTemplate: TemplateDefinition = {
  key: 'teal-minimalist',
  name: 'Teal Minimalist Professional',
  description:
    'Clean, modern UK/EU-inspired layout with petrol blue accents (#156082), prominent structured contact header, timeline work history, and crisp single-page hierarchy.',
  category: 'Modern',
  sourceFile: 'downloaded_templates/Muhammad Aneeb Ulaah.docx',
  supportedSections: [
    'summary',
    'skills',
    'experience',
    'education',
    'projects',
    'strengths',
    'languages',
    'custom',
  ],
  defaultConfig: {
    fontFamily: 'Calibri',
    fontSizePt: 9.5,
    primaryColor: '#156082',
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
