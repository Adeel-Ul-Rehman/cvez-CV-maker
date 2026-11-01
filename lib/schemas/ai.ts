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

export const cvContextSchema = z
  .object({
    fullName: z.string().optional().nullable(),
    headline: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    experiences: z
      .array(
        z.object({
          role: z.string().optional().nullable(),
          company: z.string().optional().nullable(),
          description: z.string().optional().nullable(),
          startDate: z.string().optional().nullable(),
          endDate: z.string().optional().nullable(),
        })
      )
      .optional()
      .nullable(),
    education: z
      .array(
        z.object({
          degree: z.string().optional().nullable(),
          institution: z.string().optional().nullable(),
          field: z.string().optional().nullable(),
          graduationDate: z.string().optional().nullable(),
        })
      )
      .optional()
      .nullable(),
    skills: z.array(z.string()).optional().nullable(),
    strengths: z.array(z.string()).optional().nullable(),
    certifications: z.array(z.string()).optional().nullable(),
  })
  .optional()
  .nullable();

export type CvContext = z.infer<typeof cvContextSchema>;

export const improveSummarySchema = z.object({
  currentSummary: z.string().max(2000).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  jobDescription: z.string().max(5000).optional().nullable(),
  cvContext: cvContextSchema,
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
  cvContext: cvContextSchema,
});

export const improveSkillsSchema = z.object({
  currentSkills: z.array(z.string()).max(50).default([]),
  jobTitle: z.string().max(100).optional().nullable(),
  jobDescription: z.string().max(5000).optional().nullable(),
  cvContext: cvContextSchema,
});

export const suggestStrengthsSchema = z.object({
  currentStrengths: z.array(z.string()).max(30).default([]),
  jobTitle: z.string().max(100).optional().nullable(),
  cvContext: cvContextSchema,
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

export const suggestStrengthsAiOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().max(80),
      description: z.string().max(200),
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

export const jobMatchSchema = z.object({
  jobDescription: z.string().min(20, 'Job description must be at least 20 characters').max(10000),
  jobTitle: z.string().max(120).optional().nullable(),
  company: z.string().max(120).optional().nullable(),
  cvContext: cvContextSchema,
});
export type JobMatchInput = z.infer<typeof jobMatchSchema>;

export const jobMatchAiOutputSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string(),
  keywordScores: z
    .object({
      skills: z.number().min(0).max(100),
      experience: z.number().min(0).max(100),
      education: z.number().min(0).max(100),
    })
    .optional(),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(
    z.object({
      keyword: z.string(),
      category: z.string(),
      recommendation: z.string(),
    })
  ),
  tailoredSuggestions: z.array(
    z.object({
      section: z.string(),
      currentWeakness: z.string(),
      suggestedFix: z.string(),
    })
  ),
});

export const bulletLibrarySchema = z.object({
  jobTitle: z.string().min(2, 'Job title is required').max(120),
  category: z.string().max(80).optional().nullable(),
  industry: z.string().max(80).optional().nullable(),
});
export type BulletLibraryInput = z.infer<typeof bulletLibrarySchema>;

export const bulletLibraryAiOutputSchema = z.object({
  jobTitle: z.string(),
  bullets: z.array(
    z.object({
      category: z.string(),
      text: z.string(),
      impactType: z.string().optional().nullable(),
    })
  ),
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
