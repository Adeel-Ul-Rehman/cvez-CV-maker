import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { aiCompleteJson, logAiUsage } from '@/lib/ai';
import { enforceAiRateLimit } from '@/lib/ai/rate-limit';
import { suggestStrengthsSchema, suggestStrengthsAiOutputSchema } from '@/lib/schemas/ai';
import { formatCvContextForPrompt } from '@/lib/ai/cv-context-helper';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId = '';

  try {
    const authUser = await requireAuth(req);
    userId = authUser.userId;

    enforceAiRateLimit(userId, 'suggest_strengths');

    const body = await req.json();
    const { currentStrengths, jobTitle, cvContext } = suggestStrengthsSchema.parse(body);

    const systemPrompt = `You are an executive resume strategist.
Your task is to recommend 4-6 distinct, high-impact key strengths and career highlights for this candidate based on their work history, skills, and background.
Each strength must have:
- title: A sharp, professional competency (e.g. "Full-Stack System Architecture", "Cross-Functional Leadership", "Cloud Infrastructure Optimization", "Strategic Problem Solving")
- description: 1 concise sentence (under 180 chars) describing their demonstrated capability or business impact.
Do NOT repeat any existing strengths: [${currentStrengths.join(', ')}].
You must return ONLY a JSON object with this shape:
{
  "suggestions": [
    {
      "title": "<competency name max 80 chars>",
      "description": "<one sentence impact description under 180 chars>"
    }
  ]
}`;

    const cvContextText = formatCvContextForPrompt(cvContext);

    const userPrompt = `${cvContextText}${jobTitle ? `Target Role/Headline: ${jobTitle}\n` : ''}${
      currentStrengths.length > 0 ? `Existing Strengths (do not duplicate): ${currentStrengths.join(', ')}\n` : ''
    }Suggest 4-6 top strengths that distinguish this candidate.`;

    const result = await aiCompleteJson(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.4 },
      suggestStrengthsAiOutputSchema
    );

    const cleaned = result.data.suggestions.slice(0, 6).map((s) => ({
      title: s.title.trim().slice(0, 80),
      description: s.description.trim().slice(0, 180),
    }));

    logAiUsage(
      userId,
      'suggest_strengths',
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
        suggestions: cleaned,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (error: any) {
    if (userId) {
      logAiUsage(
        userId,
        'suggest_strengths',
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

