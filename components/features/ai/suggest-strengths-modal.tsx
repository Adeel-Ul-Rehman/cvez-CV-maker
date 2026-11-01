'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { Sparkles, Plus, Check, Layers } from 'lucide-react';
import { CvContext } from '@/lib/schemas/ai';

interface SuggestedStrength {
  title: string;
  description: string;
}

interface SuggestStrengthsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStrengths?: string[];
  cvContext?: CvContext | null;
  onAddStrength: (strength: { title: string; description: string }) => void;
}

export function SuggestStrengthsModal({
  isOpen,
  onClose,
  currentStrengths = [],
  cvContext,
  onAddStrength,
}: SuggestStrengthsModalProps) {
  const [targetTitle, setTargetTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedStrength[]>([]);
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());
  const [provider, setProvider] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && !targetTitle) {
      if (cvContext?.headline) {
        setTargetTitle(cvContext.headline);
      } else if (cvContext?.experiences && cvContext.experiences.length > 0 && cvContext.experiences[0].role) {
        setTargetTitle(cvContext.experiences[0].role);
      }
    }
  }, [isOpen, cvContext, targetTitle]);

  const hasContext = Boolean(
    (cvContext?.experiences && cvContext.experiences.length > 0) ||
    (cvContext?.skills && cvContext.skills.length > 0)
  );

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post<{
        suggestions: SuggestedStrength[];
        provider: string;
        model: string;
      }>('/api/ai/suggest-strengths', {
        currentStrengths,
        jobTitle: targetTitle.trim() || undefined,
        cvContext: cvContext || undefined,
      });

      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
        setProvider(res.data.provider);
        toastSuccess('Strengths analyzed', 'Select strengths to add to your CV.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to suggest strengths');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (item: SuggestedStrength) => {
    onAddStrength(item);
    setAddedTitles((prev) => new Set(prev).add(item.title));
    toastSuccess(`Added "${item.title}"`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Strengths & Highlights Generator"
      description="Extract compelling professional strengths tailored to your career history and skills."
      size="lg"
    >
      <div className="space-y-4">
        {hasContext && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-xs text-primary-800 dark:text-primary-300">
            <Layers className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
            <span>
              <strong>Smart CV Context active:</strong> AI will generate strengths based on your{' '}
              {cvContext?.experiences?.length ? `${cvContext.experiences.length} experience(s)` : ''}
              {cvContext?.skills?.length ? ` and ${cvContext.skills.length} listed skill(s)` : ''}.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Target Role / Domain (Optional)"
            placeholder="e.g. Lead Software Architect"
            value={targetTitle}
            onChange={(e) => setTargetTitle(e.target.value)}
          />
          <Input
            label="Current Strengths Count"
            disabled
            value={`${currentStrengths.length} strengths listed`}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="primary"
            onClick={handleGenerate}
            loading={loading}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            {suggestions.length > 0 ? 'Generate More Strengths' : 'Generate Key Strengths'}
          </Button>
          {provider && (
            <span className="text-[11px] text-slate-400">
              Powered by <strong className="capitalize">{provider}</strong>
            </span>
          )}
        </div>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recommended Strengths
            </h4>
            <div className="grid grid-cols-1 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {suggestions.map((item, idx) => {
                const isAdded = addedTitles.has(item.title);
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isAdded
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-primary-400 bg-white dark:bg-slate-900 shadow-xs'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {item.title}
                        </span>
                        {isAdded && (
                          <Badge variant="success" className="text-[9px] px-1.5 py-0">
                            Added
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={isAdded ? 'secondary' : 'outline'}
                      onClick={() => handleAdd(item)}
                      disabled={isAdded}
                      className="shrink-0 h-8 text-xs font-semibold"
                    >
                      {isAdded ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Plus className="h-3.5 w-3.5" />}
                      <span className="ml-1">{isAdded ? 'Added' : 'Add'}</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
