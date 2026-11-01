import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/errors';
import { aiCompleteJson, logAiUsage } from '@/lib/ai';
import { enforceAiRateLimit } from '@/lib/ai/rate-limit';
import { jobMatchSchema, jobMatchAiOutputSchema } from '@/lib/schemas/ai';
import { formatCvContextForPrompt } from '@/lib/ai/cv-context-helper';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId = '';

  try {
    const authUser = await requireAuth(req);
    userId = authUser.userId;

    enforceAiRateLimit(userId, 'job_match');

    const body = await req.json();
    const { jobDescription, jobTitle, company, cvContext } = jobMatchSchema.parse(body);

    const systemPrompt = `You are a Principal Technical Recruiter and modern ATS (Applicant Tracking System) parsing engine.
Your task is to thoroughly analyze the candidate's CV background against the provided Job Description.

Perform a detailed match analysis:
1. matchScore: A realistic ATS match score integer from 0 to 100 based on keyword overlap, role alignment, and required qualifications.
2. summary: A crisp 2-3 sentence executive breakdown of how strong the match is and the primary gap or strength.
3. keywordScores:
   - skills: 0-100 score for hard/soft skill matches
   - experience: 0-100 score for seniority and relevant responsibilities
   - education: 0-100 score for degree and academic background
4. matchedKeywords: Array of 5-10 core skills/terms from the job description that ARE present in the candidate's CV.
5. missingKeywords: Array of 4-8 critical skills, frameworks, certifications, or competencies from the job description that are NOT found in the candidate's CV. Each item must have:
   - keyword: string
   - category: string ("Hard Skill", "Tool / Tech", "Domain Knowledge", "Soft Skill", or "Certification")
   - recommendation: 1 actionable sentence on where/how the candidate can add this.
6. tailoredSuggestions: Array of 2-4 concrete, high-impact edits the candidate can make to their CV right now to increase their match rate.
   - section: e.g. "Work Experience", "Skills", "Professional Summary"
   - currentWeakness: what is currently missing or weak
   - suggestedFix: exact wording or bullet point to incorporate

Return strictly valid JSON conforming to the schema.`;

    const cvContextText = formatCvContextForPrompt(cvContext);

    const userPrompt = `Target Job Title: ${jobTitle || 'Unspecified'}
Company: ${company || 'Unspecified'}

=== JOB DESCRIPTION ===
${jobDescription}

=== CANDIDATE CV BACKGROUND ===
${cvContextText}

Analyze this candidate against the job description now.`;

    let matchResult: any;

    try {
      const result = await aiCompleteJson(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.3 },
        jobMatchAiOutputSchema
      );

      matchResult = result.data;

      logAiUsage(
        userId,
        'job_match',
        result.provider,
        result.model,
        true,
        result.tokensUsed,
        null,
        Date.now() - startTime
      );
    } catch (aiErr: any) {
      // Fallback rule-based matching if AI is unreachable
      const lowerJob = jobDescription.toLowerCase();
      const lowerCv = (
        (cvContext?.skills?.join(' ') || '') +
        ' ' +
        (cvContext?.summary || '') +
        ' ' +
        (cvContext?.experiences?.map((e) => `${e.role} ${e.description}`).join(' ') || '')
      ).toLowerCase();

      const commonTechKeywords = [
        'react', 'next.js', 'typescript', 'javascript', 'python', 'node.js', 'sql', 'postgres',
        'mongodb', 'docker', 'kubernetes', 'aws', 'ci/cd', 'git', 'rest api', 'graphql',
        'leadership', 'agile', 'scrum', 'problem solving', 'communication', 'project management'
      ];

      const matched: string[] = [];
      const missing: any[] = [];

      commonTechKeywords.forEach((kw) => {
        if (lowerJob.includes(kw)) {
          if (lowerCv.includes(kw)) {
            matched.push(kw.toUpperCase());
          } else {
            missing.push({
              keyword: kw.toUpperCase(),
              category: 'Hard Skill',
              recommendation: `Incorporate experience or familiarity with ${kw.toUpperCase()} in your skills or project bullets.`,
            });
          }
        }
      });

      const totalChecked = matched.length + missing.length;
      const score = totalChecked > 0 ? Math.round((matched.length / totalChecked) * 100) : 70;

      matchResult = {
        matchScore: Math.max(45, Math.min(95, score)),
        summary: `Your profile matches approximately ${score}% of the core keywords found in this job posting. Adding the missing technical terms will notably improve your ATS pass rate.`,
        keywordScores: {
          skills: score,
          experience: Math.max(50, score - 5),
          education: 85,
        },
        matchedKeywords: matched.slice(0, 8),
        missingKeywords: missing.slice(0, 6),
        tailoredSuggestions: [
          {
            section: 'Work Experience',
            currentWeakness: 'Metrics and direct tool mentions could be sharper.',
            suggestedFix: 'Incorporate 1-2 bullet points quantifying your results with the specific tech stack listed in the job description.',
          },
          {
            section: 'Skills',
            currentWeakness: 'Some keywords from the job description are missing.',
            suggestedFix: 'Add the missing identified tools directly to your Skills section.',
          },
        ],
      };
    }

    return NextResponse.json({
      ok: true,
      data: matchResult,
    });
  } catch (error: any) {
    if (userId) {
      logAiUsage(
        userId,
        'job_match',
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

