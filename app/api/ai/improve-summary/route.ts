import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { aiCompleteJson, logAiUsage } from '@/lib/ai';
import { enforceAiRateLimit } from '@/lib/ai/rate-limit';
import { improveSummarySchema, improveSummaryAiOutputSchema } from '@/lib/schemas/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId = '';

  try {
    const authUser = await requireAuth(req);
    userId = authUser.userId;

    enforceAiRateLimit(userId, 'improve_summary');

    const body = await req.json();
    const { currentSummary, jobTitle, jobDescription, existingCvContext } =
      improveSummarySchema.parse(body);

    const systemPrompt = `You are a professional executive resume writer.
Your task is to craft 3 distinct, compelling professional resume summaries.
Each summary must be 2-4 sentences, max 500 characters, well-punctuated, and highlight core strengths and value proposition.
You must return ONLY a JSON object with this shape:
{
  "suggestions": [
    {
      "text": "<summary text max 500 chars>",
      "style": "professional"
    },
    {
      "text": "<summary text max 500 chars>",
      "style": "concise"
    },
    {
      "text": "<summary text max 500 chars>",
      "style": "achievement-focused"
    }
  ]
}
Styles MUST be exactly: "professional", "concise", and "achievement-focused".`;

    const userPrompt = `${
      currentSummary ? `Current Summary to improve:\n${currentSummary}\n\n` : 'No current summary provided (generate from scratch).\n\n'
    }${jobTitle ? `Target Role/Title: ${jobTitle}\n` : ''}${
      jobDescription ? `Target Job Description:\n${jobDescription}\n` : ''
    }${
      existingCvContext?.sections?.length
        ? `Existing CV Sections: ${existingCvContext.sections.join(', ')}\n`
        : ''
    }`;

    const result = await aiCompleteJson(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.5 },
      improveSummaryAiOutputSchema
    );

    // Sanitize suggestions length to max 500 chars
    const cleanedSuggestions = result.data.suggestions.map((s) => ({
      ...s,
      text: s.text.length > 500 ? s.text.slice(0, 497) + '...' : s.text,
    }));

    logAiUsage(
      userId,
      'improve_summary',
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
        suggestions: cleanedSuggestions,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (error: any) {
    if (userId) {
      logAiUsage(
        userId,
        'improve_summary',
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
