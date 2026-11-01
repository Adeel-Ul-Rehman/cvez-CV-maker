import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { aiCompleteJson, logAiUsage } from '@/lib/ai';
import { enforceAiRateLimit } from '@/lib/ai/rate-limit';
import { bulletLibrarySchema, bulletLibraryAiOutputSchema } from '@/lib/schemas/ai';
import { findPrewrittenBulletsForRole } from '@/lib/cv/bullet-library-data';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId = '';

  try {
    const authUser = await requireAuth(req);
    userId = authUser.userId;

    enforceAiRateLimit(userId, 'bullet_library');

    const body = await req.json();
    const { jobTitle, category, industry } = bulletLibrarySchema.parse(body);

    const systemPrompt = `You are a world-class professional resume writer and career coach.
Generate 8-10 high-converting, metric-driven resume bullet points tailored specifically for the job title: "${jobTitle}".

Rules:
1. Every bullet point MUST start with a strong active power verb (e.g. Spearheaded, Orchestrated, Engineered, Accelerated, Streamlined, Negotiated).
2. Every bullet point MUST feature bracketed placeholders for metrics and tools so the candidate can easily personalize it (e.g., "[X%]", "[$Y]", "[Tool/Framework]", "[Team Size of Z]").
3. Group each bullet by a category (e.g., "Execution & Delivery", "Technical Innovation", "Team Leadership & Mentoring", "Revenue & Cost Optimization", "Process Improvement").
4. Include an impactType (e.g., "Revenue", "Efficiency", "Customer Satisfaction", "Quality", "Speed").

Return strictly valid JSON matching this schema:
{
  "jobTitle": "${jobTitle}",
  "bullets": [
    {
      "category": "string",
      "text": "string",
      "impactType": "string"
    }
  ]
}`;

    const userPrompt = `Job Title: ${jobTitle}
${industry ? `Industry: ${industry}\n` : ''}${category ? `Focus Category: ${category}\n` : ''}
Generate 8-10 top-tier resume bullet points.`;

    let generatedBullets: any[] = [];

    try {
      const result = await aiCompleteJson(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.5 },
        bulletLibraryAiOutputSchema
      );

      generatedBullets = result.data.bullets;

      logAiUsage(
        userId,
        'bullet_library',
        result.provider,
        result.model,
        true,
        result.tokensUsed,
        null,
        Date.now() - startTime
      );
    } catch (aiErr: any) {
      // Fallback to rich prewritten bullets
      const fallback = findPrewrittenBulletsForRole(jobTitle);
      generatedBullets = fallback;
    }

    return NextResponse.json({
      ok: true,
      data: {
        jobTitle,
        bullets: generatedBullets,
      },
    });
  } catch (error: any) {
    if (userId) {
      logAiUsage(
        userId,
        'bullet_library',
        'gemini',
        'gemini-1.5-flash',
        false,
        0,
        error.message,
        Date.now() - startTime
      );
    }
    return handleApiError(error);
  }
}

