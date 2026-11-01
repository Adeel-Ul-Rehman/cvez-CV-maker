export interface CvContentMetrics {
  summaryLength: number;
  experienceCount: number;
  experienceBulletsCount: number;
  educationCount: number;
  skillsCount: number;
  strengthsCount: number;
  otherSectionsCount: number;
}

export function analyzeCvDensity(basics: any, sections: any[]): CvContentMetrics {
  const summaryLength = basics?.summary ? basics.summary.split(/\s+/).filter(Boolean).length : 0;
  
  const expSection = sections.find((s) => s.type === 'experience');
  const experienceCount = expSection?.items?.length || 0;
  const experienceBulletsCount = (expSection?.items || []).reduce((acc: number, item: any) => {
    const lines = (item.description || '').split('\n').filter((l: string) => l.trim().length > 0).length;
    return acc + Math.max(1, lines);
  }, 0);

  const eduSection = sections.find((s) => s.type === 'education');
  const educationCount = eduSection?.items?.length || 0;

  const skillsSection = sections.find((s) => s.type === 'skills');
  const skillsCount = skillsSection?.items?.length || 0;

  const strengthsSection = sections.find((s) => s.type === 'strengths');
  const strengthsCount = strengthsSection?.items?.length || 0;

  const otherSections = sections.filter(
    (s) => !['experience', 'education', 'skills', 'strengths'].includes(s.type) && s.visible !== false
  );
  const otherSectionsCount = otherSections.reduce((acc, s) => acc + (s.items?.length || 1), 0);

  return {
    summaryLength,
    experienceCount,
    experienceBulletsCount,
    educationCount,
    skillsCount,
    strengthsCount,
    otherSectionsCount,
  };
}

export interface OnePageOptimizationResult {
  optimizedConfig: {
    fontSizePt: number;
    spacingScale: number;
    lineHeight: number;
  };
  densityLevel: 'sparse' | 'optimal' | 'moderate_overflow' | 'heavy_overflow';
  explanation: string;
}

/**
 * Calculates the mathematical layout parameters needed to fit the CV content on exactly 1 page.
 */
export function optimizeForOnePage(
  currentConfig: any,
  basics: any,
  sections: any[]
): OnePageOptimizationResult {
  const metrics = analyzeCvDensity(basics, sections);

  // Approximate vertical content units:
  // Each experience bullet = ~2.5 units
  // Each experience entry header = ~2 units
  // Each education entry = ~2 units
  // Each 25 words of summary = ~1.5 units
  // Every 5 skills = ~1.5 units
  // Each extra section = ~3 units
  const totalEstimatedUnits =
    (metrics.summaryLength / 25) * 1.5 +
    metrics.experienceCount * 2 +
    metrics.experienceBulletsCount * 2.2 +
    metrics.educationCount * 2.2 +
    (metrics.skillsCount / 5) * 1.5 +
    metrics.strengthsCount * 1.8 +
    metrics.otherSectionsCount * 2.0;

  // Standard 1 page budget is approximately 32 to 38 vertical units at default 10pt / 1.0 spacing
  if (totalEstimatedUnits <= 28) {
    // Sparse content - give it breathing room
    return {
      optimizedConfig: {
        ...currentConfig,
        fontSizePt: 10.5,
        spacingScale: 1.1,
        lineHeight: 1.5,
      },
      densityLevel: 'sparse',
      explanation: 'Content is brief. Expanded spacing and font to 10.5pt for balanced 1-page visual weight.',
    };
  } else if (totalEstimatedUnits <= 36) {
    // Already near optimal
    return {
      optimizedConfig: {
        ...currentConfig,
        fontSizePt: 10,
        spacingScale: 0.95,
        lineHeight: 1.4,
      },
      densityLevel: 'optimal',
      explanation: 'Optimized margins and spacing to 95% for crisp single-page presentation.',
    };
  } else if (totalEstimatedUnits <= 48) {
    // Moderate overflow (e.g. 1.2 pages) - perfect for tightening
    return {
      optimizedConfig: {
        ...currentConfig,
        fontSizePt: 9.5,
        spacingScale: 0.82,
        lineHeight: 1.35,
      },
      densityLevel: 'moderate_overflow',
      explanation: 'Trimmed font size to 9.5pt and tightened section spacing by 18% to pull all content onto 1 page.',
    };
  } else {
    // Heavy overflow - compact mode
    return {
      optimizedConfig: {
        ...currentConfig,
        fontSizePt: 9.0,
        spacingScale: 0.75,
        lineHeight: 1.3,
      },
      densityLevel: 'heavy_overflow',
      explanation: 'Switched to compact format (9pt font, 75% spacing) to compress substantial career content onto 1 page.',
    };
  }
}

