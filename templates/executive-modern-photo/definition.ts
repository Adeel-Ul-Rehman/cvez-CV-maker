import type { TemplateDefinition } from '@/types';

export const executiveModernPhotoTemplate: TemplateDefinition = {
  key: 'executive-modern-photo',
  name: 'Executive Modern Photo',
  description:
    'Distinctive two-column format with candidate photo, deep cobalt blue accents, and clean Times New Roman typography strictly on one page.',
  category: 'Modern',
  sourceFile: 'downloaded_templates/Adeel Ul Rehman.docx',
  supportedSections: [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'strengths',
    'interests',
    'certifications',
    'languages',
    'custom',
  ],
  defaultConfig: {
    fontFamily: 'Times New Roman',
    fontSizePt: 10,
    primaryColor: '#0070C0',
    spacingScale: 1.0,
    showPhoto: true,
    pageSize: 'A4',
  },
  layoutHints: {
    columns: 2,
    hasSidebar: true,
    sidebarPosition: 'right',
    headerStyle: 'left',
  },
};
