import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError, notFound } from '@/lib/errors';
import { aiCompleteJson, logAiUsage } from '@/lib/ai';
import { enforceAiRateLimit } from '@/lib/ai/rate-limit';
import { atsCheckSchema, atsCheckAiOutputSchema } from '@/lib/schemas/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId = '';

  try {
    const authUser = await requireAuth(req);
    userId = authUser.userId;

    enforceAiRateLimit(userId, 'ats_check');

    const body = await req.json();
    const parsed = atsCheckSchema.parse(body);

    let cvData: any;
    let templateKey = 'unknown';

    if ('cvId' in parsed) {
      // Fetch CV with owner check
      const rows = await sql`
        SELECT data, template_key
        FROM cvs
        WHERE id = ${parsed.cvId} AND user_id = ${authUser.userId}
        LIMIT 1;
      `;

      if (!rows || rows.length === 0) {
        throw notFound('CV not found', 'CV_NOT_FOUND');
      }

      cvData = rows[0].data;
      templateKey = rows[0].template_key;
    } else {
      cvData = parsed.data;
    }

    // Sanitize CV data for AI prompt (PRIVACY: only send content, no user account fields)
    const sanitizedData = {
      basics: {
        fullName: cvData?.basics?.fullName,
        hasEmail: Boolean(cvData?.basics?.email),
        hasPhone: Boolean(cvData?.basics?.phone),
        hasLocation: Boolean(cvData?.basics?.location),
        hasWebsite: Boolean(cvData?.basics?.website),
        hasLinkedin: Boolean(cvData?.basics?.linkedin),
        summary: cvData?.basics?.summary || null,
        hasPhoto: Boolean(cvData?.basics?.photoUrl),
      },
      sections: (cvData?.sections || []).map((sec: any) => ({
        type: sec.type,
        title: sec.title,
        itemCount: sec.items?.length || 0,
        items: sec.items,
      })),
      templateKey,
    };

    const systemPrompt = `You are a certified Applicant Tracking System (ATS) optimization specialist.
Analyze the provided CV structure and content for ATS passability and recruitment best practices:
1. Contact information: verify presence of email, phone, location.
2. Structure: check for essential sections (experience, education, skills).
3. Impact: identify passive or vague phrases (e.g., "responsible for", "helped with", "worked on") and recommend strong action verbs and quantified achievements.
4. Format compatibility: note that two-column or photo templates may encounter parsing issues with legacy ATS systems.
5. Provide a realistic overallScore between 0 and 100.
6. Return at most 10 issues and 0-5 strengths.

Return ONLY a JSON object with this shape:
{
  "overallScore": <number 0-100>,
  "issues": [
    {
      "severity": "low" | "medium" | "high",
      "category": "contact" | "content" | "format" | "impact" | "structure",
      "message": "<specific issue explanation under 200 chars>",
      "suggestion": "<actionable fix under 200 chars>"
    }
  ],
  "strengths": [
    "<notable positive attribute of the CV under 200 chars>"
  ]
}`;

    const userPrompt = `Candidate CV Document to Evaluate:
${JSON.stringify(sanitizedData, null, 2)}`;

    const result = await aiCompleteJson(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.2 },
      atsCheckAiOutputSchema
    );

    const report = {
      overallScore: Math.min(100, Math.max(0, Math.round(result.data.overallScore))),
      issues: result.data.issues.slice(0, 10).map((i) => ({
        ...i,
        message: i.message.length > 200 ? i.message.slice(0, 197) + '...' : i.message,
        suggestion: i.suggestion.length > 200 ? i.suggestion.slice(0, 197) + '...' : i.suggestion,
      })),
      strengths: result.data.strengths.slice(0, 5).map((s) => (s.length > 200 ? s.slice(0, 197) + '...' : s)),
    };

    logAiUsage(
      userId,
      'ats_check',
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
        report,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (error: any) {
    if (userId) {
      logAiUsage(
        userId,
        'ats_check',
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
