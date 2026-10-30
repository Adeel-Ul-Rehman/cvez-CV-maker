import type { TemplateDefinition } from '@/types';

export const navyExecutiveSidebarTemplate: TemplateDefinition = {
  key: 'navy-executive-sidebar',
  name: 'Navy Executive Sidebar',
  description:
    'Executive CV template with a bold deep navy sidebar (#003060), crisp white typography, high-impact career objective, and structured professional experience on one single page.',
  category: 'Modern',
  sourceFile: 'downloaded_templates/Navy_Sidebar_CV_Template.docx',
  supportedSections: [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'strengths',
    'languages',
    'custom',
  ],
  defaultConfig: {
    fontFamily: 'Century Gothic',
    fontSizePt: 10,
    primaryColor: '#003060',
    spacingScale: 1.0,
    showPhoto: false,
    pageSize: 'A4',
  },
  layoutHints: {
    columns: 2,
    hasSidebar: true,
    sidebarPosition: 'left',
    headerStyle: 'left',
  },
};
