import { z } from 'zod';
import { TEMPLATE_KEYS } from '@/templates/registry';
import { cvConfigSchema, cvDataSchema } from '@/lib/cv/schema';

export const templateKeyEnum = z.string().min(1, 'Template key is required');

export const createCvSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title cannot exceed 100 characters')
    .trim(),
  templateKey: templateKeyEnum,
  data: cvDataSchema.partial().optional(),
  config: cvConfigSchema.partial().optional(),
});

export const updateCvSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title cannot exceed 100 characters')
    .trim()
    .optional(),
  templateKey: templateKeyEnum.optional(),
  data: cvDataSchema.partial().optional(),
  config: cvConfigSchema.partial().optional(),
  is_public: z.boolean().optional(),
});
