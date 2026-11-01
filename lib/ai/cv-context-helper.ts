import { CvContext } from '@/lib/schemas/ai';

/**
 * Formats structured CV context into a clean text prompt block for Gemini / LLMs.
 */
export function formatCvContextForPrompt(cvContext?: CvContext | null): string {
  if (!cvContext) return '';

  const parts: string[] = [];

  // Basics / Target
  if (cvContext.fullName || cvContext.headline) {
    const candidateParts = [];
    if (cvContext.fullName) candidateParts.push(`Name: ${cvContext.fullName}`);
    if (cvContext.headline) candidateParts.push(`Professional Headline: ${cvContext.headline}`);
    parts.push(candidateParts.join(' | '));
  }

  // Work Experience
  if (cvContext.experiences && cvContext.experiences.length > 0) {
    const expLines = cvContext.experiences
      .slice(0, 5)
      .map((e) => {
        const title = `${e.role || 'Role'} at ${e.company || 'Company'}`;
        const dates = e.startDate ? ` (${e.startDate} - ${e.endDate || 'Present'})` : '';
        const desc = e.description ? `\n    Details: ${e.description.replace(/\n+/g, ' ').slice(0, 160)}...` : '';
        return `  * ${title}${dates}${desc}`;
      })
      .join('\n');
    parts.push(`Recent Work Experience:\n${expLines}`);
  }

  // Education
  if (cvContext.education && cvContext.education.length > 0) {
    const eduLines = cvContext.education
      .slice(0, 3)
      .map((ed) => {
        const degree = `${ed.degree || 'Degree'}${ed.field ? ` in ${ed.field}` : ''}`;
        const school = ed.institution ? ` from ${ed.institution}` : '';
        const grad = ed.graduationDate ? ` (${ed.graduationDate})` : '';
        return `  * ${degree}${school}${grad}`;
      })
      .join('\n');
    parts.push(`Education Background:\n${eduLines}`);
  }

  // Skills
  if (cvContext.skills && cvContext.skills.length > 0) {
    parts.push(`Current Skills: ${cvContext.skills.slice(0, 25).join(', ')}`);
  }

  // Key Strengths
  if (cvContext.strengths && cvContext.strengths.length > 0) {
    parts.push(`Core Strengths & Highlights: ${cvContext.strengths.slice(0, 10).join(', ')}`);
  }

  // Certifications
  if (cvContext.certifications && cvContext.certifications.length > 0) {
    parts.push(`Certifications: ${cvContext.certifications.slice(0, 8).join(', ')}`);
  }

  if (parts.length === 0) return '';

  return `Candidate CV Background & Context (use this to generate highly accurate, personalized content):\n${parts.join('\n\n')}\n\n`;
}

