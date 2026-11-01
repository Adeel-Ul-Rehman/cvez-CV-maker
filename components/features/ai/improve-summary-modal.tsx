'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { Sparkles, Check, RefreshCw, Layers } from 'lucide-react';
import { CvContext } from '@/lib/schemas/ai';

interface Suggestion {
  text: string;
  style: 'professional' | 'concise' | 'achievement-focused';
}

interface ImproveSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSummary: string;
  cvContext?: CvContext | null;
  onApply: (text: string) => void;
}

export function ImproveSummaryModal({
  isOpen,
  onClose,
  currentSummary,
  cvContext,
  onApply,
}: ImproveSummaryModalProps) {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [provider, setProvider] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && !jobTitle && cvContext?.headline) {
      setJobTitle(cvContext.headline);
    }
  }, [isOpen, cvContext?.headline, jobTitle]);

  const hasContext = Boolean(
    (cvContext?.experiences && cvContext.experiences.length > 0) ||
    (cvContext?.education && cvContext.education.length > 0) ||
    (cvContext?.skills && cvContext.skills.length > 0)
  );

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post<{
        suggestions: Suggestion[];
        provider: string;
        model: string;
      }>('/api/ai/improve-summary', {
        currentSummary: currentSummary || undefined,
        jobTitle: jobTitle.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
        cvContext: cvContext || undefined,
      });

      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
        setProvider(res.data.provider);
        toastSuccess('Generated suggestions', 'Pick the summary that best highlights your value.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (text: string) => {
    onApply(text);
    toastSuccess('Summary updated');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Professional Summary Optimizer"
      description="Refine or craft a high-impact executive summary tailored to your target role."
      size="lg"
    >
      <div className="space-y-4">
        {hasContext && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-xs text-primary-800 dark:text-primary-300">
            <Layers className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
            <span>
              <strong>Smart CV Context active:</strong> AI will automatically synthesize your{' '}
              {cvContext?.experiences?.length ? `${cvContext.experiences.length} experience(s)` : ''}
              {cvContext?.education?.length ? `, ${cvContext.education.length} degree(s)` : ''}
              {cvContext?.skills?.length ? `, ${cvContext.skills.length} skill(s)` : ''} into tailored summaries.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <Input
            label="Target Job Title (Optional)"
            placeholder="e.g. Senior Full Stack Engineer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
          <Textarea
            label="Target Job Description (Optional)"
            placeholder="Paste job posting snippet to tailor keywords and skills..."
            rows={3}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="primary"
            onClick={handleGenerate}
            loading={loading}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            {suggestions.length > 0 ? 'Regenerate Suggestions' : 'Generate Suggestions'}
          </Button>
          {suggestions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={loading}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Retry
            </Button>
          )}
        </div>

        {loading && (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Spinner size="lg" className="mx-auto text-primary-600" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              AI is crafting your tailored summaries...
            </p>
          </div>
        )}

        {!loading && suggestions.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select a summary style:
            </h4>
            <div className="space-y-3">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-500 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        item.style === 'achievement-focused'
                          ? 'success'
                          : item.style === 'concise'
                          ? 'info'
                          : 'primary'
                      }
                    >
                      {item.style}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelect(item.text)}
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                    >
                      Use this
                    </Button>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.text}
                  </p>
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
