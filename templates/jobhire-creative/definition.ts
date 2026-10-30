import type { TemplateDefinition } from '@/types';

export const jobhireCreativeTemplate: TemplateDefinition = {
  key: 'jobhire-creative',
  name: 'Creative Resume',
  description: 'Modern two-column creative resume layout with left sidebar and banner header',
  category: 'Creative',
  sourceFile: 'downloaded_templates/jobhire_creative_resume.docx',
  supportedSections: [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
  ],
  defaultConfig: {
    fontFamily: 'Helvetica',
    fontSizePt: 10,
    primaryColor: '#2563EB',
    spacingScale: 1.0,
    showPhoto: true,
    pageSize: 'A4',
  },
  layoutHints: {
    columns: 2,
    hasSidebar: true,
    sidebarPosition: 'left',
    headerStyle: 'banner',
  },
};
