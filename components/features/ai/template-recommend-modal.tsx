'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

interface Recommendation {
  templateKey: string;
  reason: string;
  fitScore: number;
}

interface TemplateRecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateKey: string) => void;
}

export function TemplateRecommendModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateRecommendModalProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [notes, setNotes] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  const handleRecommend = async () => {
    if (!jobDescription || jobDescription.trim().length < 20) {
      toastError('Input too short', 'Please paste at least 20 characters of the target job description.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<{
        recommendations: Recommendation[];
        notes?: string | null;
        provider: string;
        model: string;
      }>('/api/ai/template-recommend', {
        jobDescription: jobDescription.trim(),
      });

      if (res.data?.recommendations) {
        setRecommendations(res.data.recommendations);
        setNotes(res.data.notes || null);
        setProvider(res.data.provider);
        toastSuccess('Recommendations ready');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to recommend template');
    } finally {
      setLoading(false);
    }
  };

  const getTemplateFriendlyName = (key: string) => {
    switch (key) {
      case 'adeel-signature':
        return 'Adeel Ul Rehman Signature';
      case 'europass':
        return 'Europass CV';
      case 'jobhire-chronological':
        return 'JobHire Chronological';
      case 'jobhire-creative':
        return 'JobHire Creative Modern';
      default:
        return key;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Template Matchmaker"
      description="Paste the target job description to get AI-curated template recommendations based on company culture and layout standards."
      size="lg"
    >
      <div className="space-y-4">
        <Textarea
          label="Job Description or Requirements"
          placeholder="Paste job posting details here (e.g. role requirements, industry type, key qualifications)..."
          rows={4}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          helperText="At least 20 characters required"
        />

        <div className="pt-2">
          <Button
            variant="primary"
            onClick={handleRecommend}
            loading={loading}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            {recommendations.length > 0 ? 'Re-analyze Role' : 'Analyze & Recommend Template'}
          </Button>
        </div>

        {loading && (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Spinner size="lg" className="mx-auto text-primary-600" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Matching role expectations with optimal resume formats...
            </p>
          </div>
        )}

        {!loading && recommendations.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {notes && (
              <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                💡 <span className="font-medium text-slate-700 dark:text-slate-300">{notes}</span>
              </p>
            )}

            <div className="space-y-2.5">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {getTemplateFriendlyName(rec.templateKey)}
                      </h4>
                      <Badge
                        variant={rec.fitScore >= 80 ? 'success' : rec.fitScore >= 60 ? 'primary' : 'warning'}
                      >
                        {rec.fitScore}% Fit
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                      {rec.reason}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      onSelectTemplate(rec.templateKey);
                      onClose();
                    }}
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    className="shrink-0"
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {provider && (
          <div className="pt-2 text-right">
            <span className="text-[11px] text-slate-400 font-mono">
              Powered by {provider.toUpperCase()} AI
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
