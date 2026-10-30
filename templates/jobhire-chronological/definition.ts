import type { TemplateDefinition } from '@/types';

export const jobhireChronologicalTemplate: TemplateDefinition = {
  key: 'jobhire-chronological',
  name: 'Chronological Resume',
  description: 'Traditional single-column chronological resume optimized for ATS scanning',
  category: 'ATS',
  sourceFile: 'downloaded_templates/jobhire_chronological_resume.docx',
  supportedSections: [
    'summary',
    'experience',
    'education',
    'skills',
  ],
  defaultConfig: {
    fontFamily: 'Calibri',
    fontSizePt: 11,
    primaryColor: '#111827',
    spacingScale: 1.0,
    showPhoto: false,
    pageSize: 'A4',
  },
  layoutHints: {
    columns: 1,
    hasSidebar: false,
    headerStyle: 'centered',
  },
};
