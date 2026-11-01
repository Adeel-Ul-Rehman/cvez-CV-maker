export interface StrengthImprovementTip {
  id: string;
  points: number;
  label: string;
  category: 'basics' | 'summary' | 'experience' | 'skills' | 'education' | 'extra';
  completed: boolean;
}

export interface CvStrengthResult {
  score: number; // 0 to 100
  rating: 'Needs Work' | 'Good' | 'Strong' | 'Exceptional';
  color: string;
  tips: StrengthImprovementTip[];
}

export function calculateCvStrength(basics: any, sections: any[]): CvStrengthResult {
  const tips: StrengthImprovementTip[] = [];
  let score = 0;

  // 1. Basics: Full Name, Email, Phone
  const hasContact = Boolean(basics?.fullName && basics?.email && basics?.phone);
  if (hasContact) score += 10;
  tips.push({
    id: 'contact_info',
    points: 10,
    label: 'Fill in full name, email, and phone number',
    category: 'basics',
    completed: hasContact,
  });

  // 1b. Location or Web/LinkedIn
  const hasLinks = Boolean(basics?.location || basics?.linkedin || basics?.website);
  if (hasLinks) score += 5;
  tips.push({
    id: 'location_links',
    points: 5,
    label: 'Add your location and LinkedIn or portfolio link',
    category: 'basics',
    completed: hasLinks,
  });

  // 2. Summary
  const summaryWords = (basics?.summary || '').split(/\s+/).filter(Boolean).length;
  const hasGoodSummary = summaryWords >= 35;
  if (hasGoodSummary) {
    score += 15;
  } else if (summaryWords > 0) {
    score += 5;
  }
  tips.push({
    id: 'summary_depth',
    points: 15,
    label: 'Add a compelling professional summary (at least 35 words)',
    category: 'summary',
    completed: hasGoodSummary,
  });

  // 3. Work Experience
  const expSection = sections?.find((s) => s.type === 'experience');
  const expItems = expSection?.items || [];
  const hasExp = expItems.length > 0;
  if (hasExp) score += 10;
  tips.push({
    id: 'has_experience',
    points: 10,
    label: 'List at least one relevant work experience',
    category: 'experience',
    completed: hasExp,
  });

  // 3b. Bullets count
  const allExpText = expItems.map((e: any) => e.description || '').join('\n');
  const bulletCount = allExpText.split('\n').filter((l: string) => l.trim().length > 5).length;
  const hasSufficientBullets = bulletCount >= 3;
  if (hasSufficientBullets) score += 10;
  tips.push({
    id: 'exp_bullets',
    points: 10,
    label: 'Add at least 3 detailed bullet points across your roles',
    category: 'experience',
    completed: hasSufficientBullets,
  });

  // 3c. Metrics & Quantifiable Impact
  const hasMetrics = /([0-9]+%|\$[0-9]+|[0-9]+k|[0-9]+\+|increased|decreased|scaled|reduced)/i.test(allExpText);
  if (hasMetrics) score += 10;
  tips.push({
    id: 'exp_metrics',
    points: 10,
    label: 'Quantify achievements with metrics (e.g. 20%, $50K, 10+ users)',
    category: 'experience',
    completed: hasMetrics,
  });

  // 4. Education
  const eduSection = sections?.find((s) => s.type === 'education');
  const eduItems = eduSection?.items || [];
  const hasEdu = eduItems.length > 0 && Boolean(eduItems[0]?.institution || eduItems[0]?.degree);
  if (hasEdu) score += 15;
  tips.push({
    id: 'has_education',
    points: 15,
    label: 'Add your highest degree and university / institution',
    category: 'education',
    completed: hasEdu,
  });

  // 5. Skills
  const skillSection = sections?.find((s) => s.type === 'skills');
  const skillItems = skillSection?.items || [];
  const hasSkills = skillItems.length >= 5;
  if (hasSkills) {
    score += 15;
  } else if (skillItems.length >= 2) {
    score += 7;
  }
  tips.push({
    id: 'has_skills',
    points: 15,
    label: 'Include at least 5 core technical or soft skills',
    category: 'skills',
    completed: hasSkills,
  });

  // 6. Strengths, Certifications, or Projects
  const hasBonusSection = sections?.some(
    (s) => ['strengths', 'certifications', 'projects'].includes(s.type) && (s.items?.length || 0) > 0
  );
  if (hasBonusSection) score += 10;
  tips.push({
    id: 'bonus_section',
    points: 10,
    label: 'Add Key Strengths, Certifications, or Projects',
    category: 'extra',
    completed: hasBonusSection,
  });

  const finalScore = Math.min(100, Math.max(0, score));

  let rating: CvStrengthResult['rating'] = 'Needs Work';
  let color = 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900';

  if (finalScore >= 85) {
    rating = 'Exceptional';
    color = 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900';
  } else if (finalScore >= 70) {
    rating = 'Strong';
    color = 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900';
  } else if (finalScore >= 50) {
    rating = 'Good';
    color = 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900';
  }

  return {
    score: finalScore,
    rating,
    color,
    tips,
  };
}

