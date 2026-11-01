import { z } from 'zod';
import crypto from 'crypto';
import { getTemplate, TEMPLATES } from '@/templates/registry';

// -------------------------------------------------------------
// Per-type Section Item Schemas
// -------------------------------------------------------------

export const experienceItemSchema = z.object({
  company: z.string().min(1, 'Company is required').max(100),
  role: z.string().min(1, 'Role is required').max(100),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  current: z.boolean().default(false),
  location: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

export const educationItemSchema = z.object({
  institution: z.string().min(1, 'Institution is required').max(100),
  degree: z.string().min(1, 'Degree is required').max(100),
  field: z.string().max(100).optional().nullable(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  current: z.boolean().default(false),
  location: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

export const skillLevelEnum = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);

export const skillItemSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(80),
  level: skillLevelEnum.optional().nullable(),
});

export const projectItemSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  url: z.string().url('Invalid project URL').optional().nullable().or(z.literal('')),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const certificationItemSchema = z.object({
  name: z.string().min(1, 'Certification name is required').max(100),
  issuer: z.string().max(100).optional().nullable(),
  date: z.string().optional().nullable(),
  url: z.string().url('Invalid certification URL').optional().nullable().or(z.literal('')),
  description: z.string().max(2000).optional().nullable(),
});

export const languageProficiencyEnum = z.enum(['basic', 'conversational', 'fluent', 'native']);

export const languageItemSchema = z.object({
  name: z.string().min(1, 'Language is required').max(80),
  proficiency: languageProficiencyEnum.optional().nullable(),
});

export const customItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(2000).optional().nullable(),
});

export const strengthItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(2000).optional().nullable(),
});

export const interestItemSchema = z.object({
  name: z.string().min(1, 'Interest is required').max(100),
  description: z.string().max(1000).optional().nullable(),
});

export const referenceItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  relationship: z.string().max(100).optional().nullable(),
  company: z.string().max(100).optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable(),
});

export const awardItemSchema = z.object({
  title: z.string().min(1, 'Award title is required').max(100),
  issuer: z.string().max(100).optional().nullable(),
  date: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

// -------------------------------------------------------------
// Discriminated Sections Schema
// -------------------------------------------------------------

const baseSectionSchema = {
  id: z.string().default(() => crypto.randomUUID()),
  title: z.string().min(1, 'Section title is required').max(80),
  visible: z.boolean().default(true),
};

export const cvSectionSchema = z.discriminatedUnion('type', [
  z.object({
    ...baseSectionSchema,
    type: z.literal('experience'),
    items: z.array(experienceItemSchema).default([]),
  }),
  z.object({
    ...baseSectionSchema,
    type: z.literal('education'),
    items: z.array(educationItemSchema).default([]),
  }),
  z.object({
    ...baseSectionSchema,
    type: z.literal('skills'),
    items: z.array(skillItemSchema).default([]),
  }),
  z.object({
    ...baseSectionSchema,
    type: z.literal('projects'),
    items: z.array(projectItemSchema).default([]),
  }),
  z.object({
    ...baseSectionSchema,
    type: z.literal('certifications'),
    items: z.array(certificationItemSchema).default([]),
  }),
  z.object({
    ...baseSectionSchema,
    type: z.literal('languages'),
    items: z.array(languageItemSchema).default([]),
  }),
  z.object({
    ...baseSectionSchema,
    type: z.literal('strengths'),
    items: z.array(strengthItemSchema).default([]),
  }),
  z.object({
    ...baseSectionSchema,
    type: z.literal('interests'),
    items: z.array(interestItemSchema).default([]),
  }),
  z.object({
    ...baseSectionSchema,
    type: z.literal('references'),
    items: z.array(referenceItemSchema).default([]),
  }),
  z.object({
    ...baseSectionSchema,
    type: z.literal('awards'),
    items: z.array(awardItemSchema).default([]),
  }),
  z.object({
    ...baseSectionSchema,
    type: z.literal('custom'),
    items: z.array(customItemSchema).default([]),
  }),
]);

export type CvSection = z.infer<typeof cvSectionSchema>;

// -------------------------------------------------------------
// CV Basics Schema
// -------------------------------------------------------------

export const cvBasicsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  summary: z.string().max(2000).optional().nullable(),
  photoUrl: z
    .string()
    .refine(
      (val) =>
        !val ||
        val === '' ||
        val.startsWith('http://') ||
        val.startsWith('https://') ||
        val.startsWith('/') ||
        val.startsWith('data:image/'),
      { message: 'Invalid photo URL or image data' }
    )
    .optional()
    .nullable()
    .or(z.literal('')),
});

export type CvBasics = z.infer<typeof cvBasicsSchema>;

// -------------------------------------------------------------
// Full CV Data Schema
// -------------------------------------------------------------

export const cvMetaSchema = z
  .object({
    wizardCompleted: z.boolean().default(false).optional(),
    wizardStep: z.number().min(1).max(10).default(1).optional(),
  })
  .optional()
  .nullable();

export const cvDataSchema = z.object({
  basics: cvBasicsSchema,
  sections: z.array(cvSectionSchema).default([]),
  meta: cvMetaSchema,
});

export type CvData = z.infer<typeof cvDataSchema>;

// -------------------------------------------------------------
// CV Config Schema
// -------------------------------------------------------------

export const cvConfigSchema = z.object({
  fontFamily: z.string().min(1),
  fontSizePt: z.number().min(8).max(16),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color'),
  spacingScale: z.number().min(0.8).max(1.2),
  showPhoto: z.boolean().default(true),
  photoPosition: z.enum(['left', 'center', 'right']).default('right').optional(),
  photoShape: z.enum(['square', 'rounded', 'circle']).default('rounded').optional(),
  lineHeight: z.number().min(1.0).max(2.2).default(1.45).optional(),
  headingStyle: z.enum(['uppercase', 'capitalize', 'underlined', 'bordered']).default('uppercase').optional(),
  pageSize: z.enum(['A4', 'LETTER']).default('A4'),
  // Step Wizard progress tracking
  wizardCompleted: z.boolean().default(false).optional(),
  wizardStep: z.number().min(1).max(10).default(1).optional(),
});

export type CvConfig = z.infer<typeof cvConfigSchema>;

// -------------------------------------------------------------
// Defaults & Helper Functions
// -------------------------------------------------------------

export function defaultConfigFor(templateKey: string): CvConfig {
  const template = getTemplate(templateKey);
  if (template) {
    return { ...template.defaultConfig };
  }
  // Default fallback from first template in registry
  return { ...TEMPLATES[0].defaultConfig };
}

export function emptyCvData(fullName?: string): CvData {
  return {
    basics: {
      fullName: (fullName && fullName.trim()) || 'Your Name',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      summary: '',
      photoUrl: '',
    },
    sections: [],
  };
}
