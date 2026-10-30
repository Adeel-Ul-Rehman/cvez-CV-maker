import { z } from 'zod';

export const TEMPLATE_CATEGORIES = [
  'ATS',
  'Modern',
  'Classic',
  'EU',
  'UK',
  'USA',
  'Asian',
  'Creative',
  'Minimal',
  'Academic',
] as const;

// -------------------------------------------------------------
// Pagination & Query Schemas
// -------------------------------------------------------------
export const adminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminUsersQuerySchema = adminPaginationSchema.extend({
  search: z.string().trim().optional(),
  role: z.enum(['user', 'admin']).optional(),
  verified: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const adminUpdateUserSchema = z
  .object({
    role: z.enum(['user', 'admin']).optional(),
    emailVerified: z.boolean().optional(),
  })
  .refine(
    (data) => data.role !== undefined || data.emailVerified !== undefined,
    'At least one field (role or emailVerified) must be provided'
  );

export const adminCvsQuerySchema = adminPaginationSchema.extend({
  templateKey: z.string().trim().optional(),
  isPublic: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  userId: z.string().uuid().optional(),
});

// -------------------------------------------------------------
// Template Schemas
// -------------------------------------------------------------
export const adminCreateTemplateSchema = z.object({
  templateKey: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'templateKey must match lowercase letters, numbers, and hyphens'),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).default(''),
  category: z.enum(TEMPLATE_CATEGORIES),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const adminUpdateTemplateSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(500).optional(),
    category: z.enum(TEMPLATE_CATEGORIES).optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().int().optional(),
    thumbnailUrl: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.category !== undefined ||
      data.isActive !== undefined ||
      data.displayOrder !== undefined ||
      data.thumbnailUrl !== undefined,
    'At least one field must be provided for update'
  );

// -------------------------------------------------------------
// Audit Logs, Exports, and AI Usage Query Schemas
// -------------------------------------------------------------
export const adminAuditLogsQuerySchema = adminPaginationSchema.extend({
  action: z.string().trim().optional(),
  adminId: z.string().uuid().optional(),
  targetType: z.enum(['user', 'template', 'cv']).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export const adminExportsQuerySchema = adminPaginationSchema.extend({
  format: z.enum(['pdf', 'docx', 'png', 'jpg']).optional(),
  userId: z.string().uuid().optional(),
  success: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const adminAiUsageQuerySchema = adminPaginationSchema.extend({
  feature: z.string().trim().optional(),
  provider: z.string().trim().optional(),
  success: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});
