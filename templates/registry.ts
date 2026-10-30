import type { TemplateDefinition } from '@/types';
import { europassTemplate } from './europass/definition';
import { jobhireChronologicalTemplate } from './jobhire-chronological/definition';
import { jobhireCreativeTemplate } from './jobhire-creative/definition';
import { adeelSignatureTemplate } from './adeel-signature/definition';
import { executiveModernPhotoTemplate } from './executive-modern-photo/definition';
import { creativeProfileTemplate } from './creative-profile/definition';
import { tealMinimalistTemplate } from './teal-minimalist/definition';
import { navyExecutiveSidebarTemplate } from './navy-executive-sidebar/definition';

export const TEMPLATES: TemplateDefinition[] = [
  europassTemplate,
  jobhireChronologicalTemplate,
  jobhireCreativeTemplate,
  adeelSignatureTemplate,
  executiveModernPhotoTemplate,
  creativeProfileTemplate,
  tealMinimalistTemplate,
  navyExecutiveSidebarTemplate,
];

export const TEMPLATE_KEYS = [
  'europass',
  'jobhire-chronological',
  'jobhire-creative',
  'adeel-signature',
  'executive-modern-photo',
  'creative-profile',
  'teal-minimalist',
  'navy-executive-sidebar',
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export function getTemplate(key: string): TemplateDefinition | undefined {
  return TEMPLATES.find((template) => template.key === key);
}
