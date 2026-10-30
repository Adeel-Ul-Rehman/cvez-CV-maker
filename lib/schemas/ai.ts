import { z } from 'zod';
import { cvDataSchema } from '@/lib/cv/schema';

// -------------------------------------------------------------
// Request Body Schemas
// -------------------------------------------------------------

export const templateRecommendSchema = z.object({
  jobDescription: z
    .string()
    .min(20, 'Job description must be at least 20 characters')
    .max(5000, 'Job description cannot exceed 5000 characters'),
});

export const improveSummarySchema = z.object({
  currentSummary: z.string().max(2000).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  jobDescription: z.string().max(5000).optional().nullable(),
  existingCvContext: z
    .object({
      sections: z.array(z.string()).optional(),
    })
    .optional()
    .nullable(),
});

export const improveBulletsSchema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  role: z.string().max(100).optional().nullable(),
  company: z.string().max(100).optional().nullable(),
  jobDescription: z.string().max(5000).optional().nullable(),
});

export const improveSkillsSchema = z.object({
  currentSkills: z.array(z.string()).max(50).default([]),
  jobTitle: z.string().max(100).optional().nullable(),
  jobDescription: z.string().max(5000).optional().nullable(),
});

export const atsCheckSchema = z.union([
  z.object({
    cvId: z.string().uuid('Invalid CV ID'),
  }),
  z.object({
    data: cvDataSchema,
  }),
]);

export const templateSearchSchema = z.object({
  query: z
    .string()
    .min(2, 'Query must be at least 2 characters')
    .max(200, 'Query cannot exceed 200 characters'),
});

// -------------------------------------------------------------
// Model Response Validation Schemas
// -------------------------------------------------------------

export const templateRecommendAiOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      templateKey: z.string(),
      reason: z.string(),
      fitScore: z.number().min(0).max(100),
    })
  ),
  notes: z.string().optional().nullable(),
});

export const improveSummaryAiOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      text: z.string(),
      style: z.enum(['professional', 'concise', 'achievement-focused']),
    })
  ),
});

export const improveBulletsAiOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      text: z.string(),
      rationale: z.string().optional().nullable(),
    })
  ),
});

export const improveSkillsAiOutputSchema = z.object({
  suggested: z.array(
    z.object({
      name: z.string(),
      level: z.string().optional().nullable(),
      reason: z.string().optional().nullable(),
    })
  ),
});

export const atsCheckAiOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  issues: z
    .array(
      z.object({
        severity: z.enum(['low', 'medium', 'high']),
        category: z.string(),
        message: z.string(),
        suggestion: z.string(),
      })
    )
    .max(10),
  strengths: z.array(z.string()).max(5),
});

export const templateSearchAiOutputSchema = z.object({
  results: z.array(
    z.object({
      templateKey: z.string(),
      relevance: z.number().min(0).max(100),
      reason: z.string(),
    })
  ),
});
