import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { aiCompleteJson, logAiUsage } from '@/lib/ai';
import { enforceAiRateLimit } from '@/lib/ai/rate-limit';
import { improveSkillsSchema, improveSkillsAiOutputSchema } from '@/lib/schemas/ai';
import { formatCvContextForPrompt } from '@/lib/ai/cv-context-helper';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId = '';

  try {
    const authUser = await requireAuth(req);
    userId = authUser.userId;

    enforceAiRateLimit(userId, 'improve_skills');

    const body = await req.json();
    const { currentSkills, jobTitle, jobDescription, cvContext } = improveSkillsSchema.parse(body);

    const existingNormalized = new Set(
      (currentSkills || []).map((s) => s.trim().toLowerCase())
    );

    const systemPrompt = `You are a technical talent assessor and resume optimization specialist.
Your task is to recommend 5-10 relevant skills, tools, frameworks, or competencies that would strengthen this candidate's profile for their target role.
Guidelines:
1. Do NOT suggest any skills that the user already possesses.
2. Select high-value, contemporary hard/technical and domain skills aligned with industry standards and the candidate's actual work experience and background.
3. You must return ONLY a JSON object with this shape:
{
  "suggested": [
    {
      "name": "Skill Name",
      "level": "beginner" | "intermediate" | "advanced" | "expert",
      "reason": "Brief reason under 120 chars why this skill is valuable"
    }
  ]
}`;

    const cvContextText = formatCvContextForPrompt(cvContext);

    const userPrompt = `${cvContextText}${jobTitle ? `Target Role/Title: ${jobTitle}\n` : ''}${
      jobDescription ? `Target Job Description:\n${jobDescription}\n` : ''
    }Current Skills (DO NOT SUGGEST THESE):
${currentSkills.join(', ') || 'None provided'}`;

    const result = await aiCompleteJson(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3 },
      improveSkillsAiOutputSchema
    );

    // Strictly filter out any skill already in currentSkills (case-insensitive)
    const newSuggested = result.data.suggested
      .filter((s) => !existingNormalized.has(s.name.trim().toLowerCase()))
      .slice(0, 10)
      .map((s) => ({
        name: s.name.trim(),
        level: s.level || undefined,
        reason: s.reason && s.reason.length > 120 ? s.reason.slice(0, 117) + '...' : s.reason,
      }));

    logAiUsage(
      userId,
      'improve_skills',
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
        suggested: newSuggested,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (error: any) {
    if (userId) {
      logAiUsage(
        userId,
        'improve_skills',
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
