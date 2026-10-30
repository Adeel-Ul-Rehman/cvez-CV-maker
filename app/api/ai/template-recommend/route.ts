import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { aiCompleteJson, logAiUsage } from '@/lib/ai';
import { enforceAiRateLimit } from '@/lib/ai/rate-limit';
import { templateRecommendSchema, templateRecommendAiOutputSchema } from '@/lib/schemas/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId = '';

  try {
    const authUser = await requireAuth(req);
    userId = authUser.userId;

    enforceAiRateLimit(userId, 'template_recommend');

    const body = await req.json();
    const { jobDescription } = templateRecommendSchema.parse(body);

    // Fetch active templates from DB
    const templates = await sql`
      SELECT template_key, name, description, category, definition
      FROM templates
      WHERE is_active = TRUE
      ORDER BY display_order;
    `;

    const knownKeys = templates.map((t) => t.template_key);
    const templateSummaries = templates.map((t) => ({
      key: t.template_key,
      name: t.name,
      description: t.description,
      category: t.category,
      columns: t.definition?.layoutHints?.columns || 1,
      supportedSections: t.definition?.supportedSections || [],
    }));

    const systemPrompt = `You are an expert career consultant and resume strategist.
Your task is to analyze the provided job description and recommend the best resume/CV template from the available templates.
You must return ONLY a JSON object with this exact shape:
{
  "recommendations": [
    {
      "templateKey": "<one of: ${knownKeys.join(', ')}>",
      "reason": "1-2 sentences explaining why this layout fits the role",
      "fitScore": <number 0-100>
    }
  ],
  "notes": "1-3 sentences with key insights about the job requirements"
}
Ensure all recommendations use valid templateKey values from: [${knownKeys.join(', ')}].
Order recommendations by fitScore descending.`;

    const userPrompt = `Available Templates:
${JSON.stringify(templateSummaries, null, 2)}

Job Description:
${jobDescription}`;

    let result;
    try {
      result = await aiCompleteJson(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.3 },
        templateRecommendAiOutputSchema
      );
    } catch (aiErr) {
      // Fallback keyword scoring if AI fails
      const jdLower = jobDescription.toLowerCase();
      const scored = knownKeys.map((key) => {
        let score = 70;
        let reason = 'A well-rounded professional template.';
        if (key === 'adeel-signature' && (jdLower.includes('software') || jdLower.includes('ai') || jdLower.includes('developer') || jdLower.includes('full stack') || jdLower.includes('engineer') || jdLower.includes('python'))) {
          score = 96;
          reason = 'Signature engineering format with high-impact two-column structure and clean single-page presentation.';
        } else if (key === 'jobhire-creative' && (jdLower.includes('creative') || jdLower.includes('design') || jdLower.includes('marketing') || jdLower.includes('ui') || jdLower.includes('ux'))) {
          score = 92;
          reason = 'Strong visual flair with modern sidebar layout suitable for creative and design-oriented roles.';
        } else if (key === 'europass' && (jdLower.includes('europe') || jdLower.includes('academic') || jdLower.includes('research') || jdLower.includes('international'))) {
          score = 90;
          reason = 'Standardized structured format widely recognized for European and academic roles.';
        } else if (key === 'jobhire-chronological' && (jdLower.includes('software') || jdLower.includes('engineer') || jdLower.includes('finance') || jdLower.includes('corporate') || jdLower.includes('ats'))) {
          score = 95;
          reason = 'Clean, ATS-optimized chronological layout ideal for automated parsing and traditional hiring pipelines.';
        }
        return { templateKey: key, reason, fitScore: score };
      });
      scored.sort((a, b) => b.fitScore - a.fitScore);

      result = {
        data: {
          recommendations: scored,
          notes: 'Recommendations determined via keyword compatibility heuristic.',
        },
        provider: 'fallback' as any,
        model: 'heuristic-rules',
        tokensUsed: 0,
      };
    }

    // Filter to ensure only known template keys are returned and sorted
    const validRecs = result.data.recommendations
      .filter((r) => knownKeys.includes(r.templateKey))
      .sort((a, b) => b.fitScore - a.fitScore);

    logAiUsage(
      userId,
      'template_recommend',
      result.provider,
      result.model,
      true,
      result.tokensUsed,
      null,
      Date.now() - startTime
    );

    return NextResponse.json({
      ok: true,
      data: {
        recommendations: validRecs,
        notes: result.data.notes,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (error: any) {
    if (userId) {
      logAiUsage(
        userId,
        'template_recommend',
        'unknown',
        'unknown',
        false,
        null,
        error?.code || 'ERROR',
        Date.now() - startTime
      );
    }
    return handleApiError(error);
  }
}
