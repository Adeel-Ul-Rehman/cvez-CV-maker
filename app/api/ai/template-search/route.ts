import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { aiCompleteJson, logAiUsage } from '@/lib/ai';
import { enforceAiRateLimit } from '@/lib/ai/rate-limit';
import { templateSearchSchema, templateSearchAiOutputSchema } from '@/lib/schemas/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId = '';

  try {
    const authUser = await requireAuth(req);
    userId = authUser.userId;

    enforceAiRateLimit(userId, 'template_search');

    const body = await req.json();
    const { query } = templateSearchSchema.parse(body);

    // Fetch active templates
    const templates = await sql`
      SELECT template_key, name, description, category, definition
      FROM templates
      WHERE is_active = TRUE
      ORDER BY display_order;
    `;

    const knownKeys = templates.map((t) => t.template_key);
    const templateCatalog = templates.map((t) => ({
      key: t.template_key,
      name: t.name,
      description: t.description,
      category: t.category,
      tags: [t.category, ...(t.definition?.supportedSections || [])],
    }));

    const systemPrompt = `You are a semantic search specialist for a resume template catalog.
Analyze the user's search query and evaluate its relevance to each template in the catalog.
Consider career domain, styling preferences, modern vs classic aesthetics, and format constraints.
You must return ONLY a JSON object with this shape:
{
  "results": [
    {
      "templateKey": "<one of: ${knownKeys.join(', ')}>",
      "relevance": <number 0-100>,
      "reason": "<reason under 100 chars>"
    }
  ]
}
Ensure all results have a valid templateKey and are ordered by relevance descending.`;

    const userPrompt = `Template Catalog:
${JSON.stringify(templateCatalog, null, 2)}

User Search Query:
"${query}"`;

    let result;
    try {
      result = await aiCompleteJson(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.3 },
        templateSearchAiOutputSchema
      );
    } catch {
      result = null;
    }

    let finalResults = (result?.data?.results || [])
      .filter((r) => knownKeys.includes(r.templateKey))
      .sort((a, b) => b.relevance - a.relevance);

    // If AI failed or highest relevance <= 20, fallback to keyword substring matching
    const maxRelevance = finalResults.length > 0 ? Math.max(...finalResults.map((r) => r.relevance)) : 0;

    if (!result || maxRelevance <= 20) {
      const qLower = query.toLowerCase();
      finalResults = templateCatalog.map((t) => {
        let score = 30;
        const matchesName = t.name.toLowerCase().includes(qLower);
        const matchesCat = t.category.toLowerCase().includes(qLower);
        const matchesDesc = t.description.toLowerCase().includes(qLower);
        const matchesTags = (t.tags || []).some((tag: string) => tag.toLowerCase().includes(qLower));

        if (matchesName) score += 40;
        if (matchesCat) score += 30;
        if (matchesTags) score += 25;
        if (matchesDesc) score += 15;

        return {
          templateKey: t.key,
          relevance: Math.min(100, score),
          reason: `Matched template metadata for query term.`,
        };
      });
      finalResults.sort((a, b) => b.relevance - a.relevance);
    }

    const cleanedResults = finalResults.map((r) => ({
      templateKey: r.templateKey,
      relevance: Math.round(r.relevance),
      reason: r.reason.length > 100 ? r.reason.slice(0, 97) + '...' : r.reason,
    }));

    const provider = result?.provider || 'fallback';
    const model = result?.model || 'keyword-matcher';
    const tokensUsed = result?.tokensUsed;

    logAiUsage(
      userId,
      'template_search',
      provider,
      model,
      true,
      tokensUsed,
      null,
      Date.now() - startTime
    );

    return NextResponse.json({
      ok: true,
      data: {
        results: cleanedResults,
        provider,
        model,
      },
    });
  } catch (error: any) {
    if (userId) {
      logAiUsage(
        userId,
        'template_search',
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
