import type { TemplateDefinition } from '@/types';

export const creativeProfileTemplate: TemplateDefinition = {
  key: 'creative-profile',
  name: 'Creative Profile Two-Column',
  description:
    'Vibrant two-column layout featuring an emerald green accent theme (#00B050), photo profile sidebar, diamond bullet points (❖), and dedicated sections for hobbies and interests on one single page.',
  category: 'Creative',
  sourceFile: 'downloaded_templates/Ham.docx',
  supportedSections: [
    'summary',
    'experience',
    'education',
    'skills',
    'interests',
    'strengths',
    'languages',
    'projects',
    'custom',
  ],
  defaultConfig: {
    fontFamily: 'Calibri',
    fontSizePt: 9.5,
    primaryColor: '#00B050',
    spacingScale: 1.0,
    showPhoto: true,
    pageSize: 'A4',
  },
  layoutHints: {
    columns: 2,
    hasSidebar: true,
    sidebarPosition: 'left',
    headerStyle: 'left',
  },
};
