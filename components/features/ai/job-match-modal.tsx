'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { Sparkles, Target, CheckCircle2, AlertTriangle, Plus, Copy, Check, ArrowRight } from 'lucide-react';
import { CvContext } from '@/lib/schemas/ai';

interface MissingKeyword {
  keyword: string;
  category: string;
  recommendation: string;
}

interface TailoredSuggestion {
  section: string;
  currentWeakness: string;
  suggestedFix: string;
}

interface JobMatchData {
  matchScore: number;
  summary: string;
  keywordScores?: {
    skills: number;
    experience: number;
    education: number;
  };
  matchedKeywords: string[];
  missingKeywords: MissingKeyword[];
  tailoredSuggestions: TailoredSuggestion[];
}

interface JobMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvContext?: CvContext | null;
  onAddSkill?: (skillName: string) => void;
}

export function JobMatchModal({
  isOpen,
  onClose,
  cvContext,
  onAddSkill,
}: JobMatchModalProps) {
  const [jobTitle, setJobTitle] = useState(cvContext?.headline || '');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobMatchData | null>(null);
  const [addedSkills, setAddedSkills] = useState<Record<string, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      toastError('Job Description Required', 'Please paste the job description (at least 20 characters).');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<{ data: JobMatchData }>('/api/ai/job-match', {
        jobTitle: jobTitle.trim() || undefined,
        company: company.trim() || undefined,
        jobDescription: jobDescription.trim(),
        cvContext,
      });

      if (res.data?.data) {
        setResult(res.data.data);
        toastSuccess('Match Analysis Complete!', `Scored ${res.data.data.matchScore}% ATS compatibility.`);
      }
    } catch (err: any) {
      toastError('Analysis Failed', err.message || 'Unable to scan job description.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = (kw: string) => {
    if (onAddSkill) {
      onAddSkill(kw);
      setAddedSkills((prev) => ({ ...prev, [kw]: true }));
      toastSuccess(`Added "${kw}" to Skills!`);
    }
  };

  const handleCopySuggestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toastSuccess('Copied to clipboard');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    if (score >= 60) return 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 border-primary-200 dark:border-primary-800';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Target Job ATS Scanner & Match Score"
      size="xl"
    >
      <div className="space-y-5">
        {/* Form Inputs */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Target Role / Job Title"
              placeholder="e.g. Senior Frontend Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
            <Input
              label="Company Name (Optional)"
              placeholder="e.g. Google, Stripe, Remote Co."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Description / Posting Requirements <span className="text-rose-500">*</span>
            </label>
            <Textarea
              placeholder="Paste the full job posting, key responsibilities, and required qualifications here..."
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleAnalyze}
              loading={loading}
              leftIcon={<Target className="h-4 w-4" />}
            >
              {result ? 'Re-Analyze Match' : 'Analyze ATS Match (0-100%)'}
            </Button>
          </div>
        </div>

        {/* Results View */}
        {result && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in">
            {/* Top Score Banner */}
            <div className="p-4 rounded-2xl border bg-slate-50/60 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center gap-4">
              {/* Radial / Badge Score */}
              <div
                className={`h-20 w-20 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${getScoreColor(
                  result.matchScore
                )}`}
              >
                <span className="text-2xl font-black">{result.matchScore}%</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">Match</span>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  ATS Resume Compatibility Analysis
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {result.summary}
                </p>

                {result.keywordScores && (
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Skills Match</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {result.keywordScores.skills}%
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Experience</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {result.keywordScores.experience}%
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Education</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {result.keywordScores.education}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Matched Keywords */}
            {result.matchedKeywords.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Matched Keywords in Your CV ({result.matchedKeywords.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      <Check className="h-3 w-3" />
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Critical Keywords with 1-Click Add */}
            {result.missingKeywords.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Missing Keywords from Job Posting ({result.missingKeywords.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.missingKeywords.map((m, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {m.keyword}
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold">
                            {m.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {m.recommendation}
                        </p>
                      </div>

                      {onAddSkill && (
                        <button
                          type="button"
                          onClick={() => handleAddKeyword(m.keyword)}
                          disabled={addedSkills[m.keyword]}
                          className={`shrink-0 text-xs px-2 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                            addedSkills[m.keyword]
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          {addedSkills[m.keyword] ? (
                            <>
                              <Check className="h-3 w-3" /> Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" /> Add
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concrete Tailored Suggestions */}
            {result.tailoredSuggestions.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary-500" />
                  Specific Tailoring Recommendations
                </span>
                <div className="space-y-2">
                  {result.tailoredSuggestions.map((sug, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase">
                          {sug.section}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopySuggestion(sug.suggestedFix, i)}
                          className="text-[11px] font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy Suggested Text
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Observation:</span> {sug.currentWeakness}
                      </p>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700">
                        {sug.suggestedFix}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

