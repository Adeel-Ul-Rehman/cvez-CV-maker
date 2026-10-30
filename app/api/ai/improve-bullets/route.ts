import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { aiCompleteJson, logAiUsage } from '@/lib/ai';
import { enforceAiRateLimit } from '@/lib/ai/rate-limit';
import { improveBulletsSchema, improveBulletsAiOutputSchema } from '@/lib/schemas/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId = '';

  try {
    const authUser = await requireAuth(req);
    userId = authUser.userId;

    enforceAiRateLimit(userId, 'improve_bullets');

    const body = await req.json();
    const { description, role, company, jobDescription } = improveBulletsSchema.parse(body);

    const systemPrompt = `You are a high-level technical resume writer and career coach.
Your task is to transform work experience descriptions into 3-5 impactful resume bullet points.
Guidelines:
1. Each bullet point must begin with a strong, active past-tense action verb (e.g., "Architected", "Spearheaded", "Engineered", "Reduced", "Accelerated").
2. Follow the STAR / Action-Result framework, emphasizing quantifiable impact, metrics, or technologies where possible.
3. Keep each bullet under 300 characters.
4. Provide a brief rationale (under 120 characters) explaining the improvement.
You must return ONLY a JSON object with this shape:
{
  "suggestions": [
    {
      "text": "<action-oriented bullet under 300 chars>",
      "rationale": "<brief rationale under 120 chars>"
    }
  ]
}`;

    const userPrompt = `Role: ${role || 'Not specified'}
Company: ${company || 'Not specified'}
${jobDescription ? `Target Job Description:\n${jobDescription}\n` : ''}
Current Description / Notes:
${description}`;

    const result = await aiCompleteJson(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.4 },
      improveBulletsAiOutputSchema
    );

    const cleanedSuggestions = result.data.suggestions.slice(0, 5).map((s) => ({
      text: s.text.length > 300 ? s.text.slice(0, 297) + '...' : s.text,
      rationale: s.rationale && s.rationale.length > 120 ? s.rationale.slice(0, 117) + '...' : s.rationale,
    }));

    logAiUsage(
      userId,
      'improve_bullets',
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
        'improve_bullets',
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
