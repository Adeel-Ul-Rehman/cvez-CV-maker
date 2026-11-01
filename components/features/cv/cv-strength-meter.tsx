'use client';

import React, { useState, useMemo } from 'react';
import { calculateCvStrength } from '@/lib/cv/strength-calculator';
import { Sparkles, CheckCircle2, Circle, ChevronDown, Award } from 'lucide-react';

interface CvStrengthMeterProps {
  basics: any;
  sections: any[];
  className?: string;
  onNavigateSection?: (sectionType: string) => void;
}

export function CvStrengthMeter({
  basics,
  sections,
  className = '',
  onNavigateSection,
}: CvStrengthMeterProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const strength = useMemo(() => {
    return calculateCvStrength(basics, sections);
  }, [basics, sections]);

  const incompleteTips = strength.tips.filter((t) => !t.completed);
  const completedTips = strength.tips.filter((t) => t.completed);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setPopoverOpen(!popoverOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95 shadow-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        title="Click to view CV Strength Breakdown"
      >
        {/* Mini Radial Ring */}
        <div className="relative h-4 w-4 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={
                strength.score >= 80
                  ? 'text-emerald-500'
                  : strength.score >= 60
                  ? 'text-primary-500'
                  : strength.score >= 40
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }
              strokeDasharray={`${strength.score}, 100`}
              strokeWidth="4"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
        </div>

        <span className="font-bold text-slate-800 dark:text-slate-200">
          {strength.score}%
        </span>
        <span className="text-[10px] hidden sm:inline text-slate-500">
          {strength.rating}
        </span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${popoverOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Breakdown */}
      {popoverOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
            onClick={() => setPopoverOpen(false)}
          />
          <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  CV Strength: {strength.score}% ({strength.rating})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPopoverOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Progress Bar */}
            <div className="my-3">
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    strength.score >= 80
                      ? 'bg-emerald-500'
                      : strength.score >= 60
                      ? 'bg-primary-500'
                      : strength.score >= 40
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>

            {/* Next Steps to Reach 100% */}
            {incompleteTips.length > 0 ? (
              <div className="space-y-2 mt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Recommended To Reach 100%:
                </span>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {incompleteTips.map((tip) => (
                    <div
                      key={tip.id}
                      onClick={() => {
                        if (onNavigateSection) onNavigateSection(tip.category);
                        setPopoverOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-amber-100/60 transition-colors"
                    >
                      <Circle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium leading-tight">{tip.label}</p>
                      </div>
                      <span className="shrink-0 font-bold text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded-full">
                        +{tip.points}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 font-medium text-center">
                🎉 Outstanding! Your CV has all essential ATS sections and rich quantifiable metrics.
              </div>
            )}

            {/* Completed list accordion */}
            {completedTips.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Completed Checks ({completedTips.length}/{strength.tips.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {completedTips.map((tip) => (
                    <span
                      key={tip.id}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-medium"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {tip.category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

