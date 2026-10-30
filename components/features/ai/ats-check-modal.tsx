'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { ShieldCheck, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface AtsIssue {
  severity: 'low' | 'medium' | 'high';
  category: string;
  message: string;
  suggestion: string;
}

interface AtsReport {
  overallScore: number;
  issues: AtsIssue[];
  strengths: string[];
}

interface AtsCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvId?: string;
  cvData?: any;
}

export function AtsCheckModal({ isOpen, onClose, cvId, cvData }: AtsCheckModalProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AtsReport | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  const handleRunCheck = async () => {
    setLoading(true);
    try {
      const payload = cvId ? { cvId } : { data: cvData };
      const res = await apiClient.post<{
        report: AtsReport;
        provider: string;
        model: string;
      }>('/api/ai/ats-check', payload);

      if (res.data?.report) {
        setReport(res.data.report);
        setProvider(res.data.provider);
        toastSuccess('ATS scan completed', `Overall score: ${res.data.report.overallScore}/100`);
      }
    } catch (err: any) {
      toastError(err.message || 'ATS verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
    if (score >= 60) return 'text-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-950/20';
    return 'text-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-950/20';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ATS Resume Readiness Scanner"
      description="Simulate enterprise ATS parsers to detect formatting traps, missing sections, and weak verbs."
      size="xl"
    >
      <div className="space-y-5">
        {!report && !loading && (
          <div className="text-center py-8 space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Ready to analyze your resume
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                Our algorithm tests contact visibility, section structure, keyword density, and action verbs.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleRunCheck}
              loading={loading}
              leftIcon={<ShieldCheck className="h-5 w-5" />}
            >
              Start ATS Audit
            </Button>
          </div>
        )}

        {loading && (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <Spinner size="lg" className="mx-auto text-primary-600" />
            <div>
              <p className="text-base font-medium text-slate-800 dark:text-slate-200">
                Parsing CV against ATS hiring criteria...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Evaluating layout compatibility and quantifiable achievements
              </p>
            </div>
          </div>
        )}

        {!loading && report && (
          <div className="space-y-6">
            {/* Top Score Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div
                  className={`h-16 w-16 rounded-2xl border-2 flex items-center justify-center font-bold text-2xl ${getScoreColor(
                    report.overallScore
                  )}`}
                >
                  {report.overallScore}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                    {report.overallScore >= 80
                      ? 'High ATS Pass Likelihood'
                      : report.overallScore >= 60
                      ? 'Moderate Compatibility'
                      : 'Optimization Needed'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {report.issues.length} potential issues detected · {report.strengths.length} strengths
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRunCheck}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Re-scan CV
              </Button>
            </div>

            {/* Strengths */}
            {report.strengths.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" /> Detected Strengths
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {report.strengths.map((str, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Actionable Fixes & Improvements
              </h4>
              <div className="space-y-2.5 max-h-80 overflow-y-auto p-1">
                {report.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {issue.message}
                      </span>
                      <Badge
                        variant={
                          issue.severity === 'high'
                            ? 'danger'
                            : issue.severity === 'medium'
                            ? 'warning'
                            : 'info'
                        }
                        className="text-[10px] uppercase"
                      >
                        {issue.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong className="text-primary-600 dark:text-primary-400 font-medium">Suggestion:</strong>{' '}
                      {issue.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {provider && (
              <div className="pt-2 text-right">
                <span className="text-[11px] text-slate-400 font-mono">
                  Powered by {provider.toUpperCase()} AI
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
