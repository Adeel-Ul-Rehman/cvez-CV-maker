'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { Sparkles, Check, RefreshCw, Layers } from 'lucide-react';
import { CvContext } from '@/lib/schemas/ai';

interface BulletSuggestion {
  text: string;
  rationale?: string | null;
}

interface ImproveBulletsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: string | null;
  company?: string | null;
  currentDescription: string;
  cvContext?: CvContext | null;
  onApply: (bulletText: string) => void;
}

export function ImproveBulletsModal({
  isOpen,
  onClose,
  role,
  company,
  currentDescription,
  cvContext,
  onApply,
}: ImproveBulletsModalProps) {
  const [descriptionInput, setDescriptionInput] = useState(
    currentDescription || 'Led key project deliverables, improved team productivity, and optimized core systems.'
  );
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<BulletSuggestion[]>([]);
  const [provider, setProvider] = useState<string | null>(null);

  const hasSkillsOrStrengths = Boolean(
    (cvContext?.skills && cvContext.skills.length > 0) ||
    (cvContext?.strengths && cvContext.strengths.length > 0)
  );

  const handleGenerate = async () => {
    if (!descriptionInput.trim() || descriptionInput.trim().length < 10) {
      toastError('Description too short', 'Please provide at least 10 characters describing your work.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<{
        suggestions: BulletSuggestion[];
        provider: string;
        model: string;
      }>('/api/ai/improve-bullets', {
        description: descriptionInput.trim(),
        role: role || undefined,
        company: company || undefined,
        jobDescription: jobDescription.trim() || undefined,
        cvContext: cvContext || undefined,
      });

      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
        setProvider(res.data.provider);
        toastSuccess('Bullet suggestions ready');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to generate bullets');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (bullet: string) => {
    onApply(bullet);
    toastSuccess('Bullet inserted');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Impact Bullet Points"
      description="Turn simple job duties into quantified, high-impact bullet points with strong action verbs."
      size="lg"
    >
      <div className="space-y-4">
        {hasSkillsOrStrengths && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-xs text-primary-800 dark:text-primary-300">
            <Layers className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
            <span>
              <strong>Smart CV Context active:</strong> AI will tailor bullets using your skills (
              {cvContext?.skills?.slice(0, 5).join(', ') || 'skills'}
              {cvContext?.skills && cvContext.skills.length > 5 ? '...' : ''}).
            </span>
          </div>
        )}

        <div className="text-xs text-slate-500 flex gap-4">
          {role && (
            <span>
              Role: <strong className="text-slate-700 dark:text-slate-300">{role}</strong>
            </span>
          )}
          {company && (
            <span>
              Company: <strong className="text-slate-700 dark:text-slate-300">{company}</strong>
            </span>
          )}
        </div>

        <Textarea
          label="Rough Notes / What you worked on"
          placeholder="e.g. worked on fixing bugs and made the site load 20% faster..."
          rows={3}
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
          helperText="Minimum 10 characters required"
        />

        <Input
          label="Target Job Keywords (Optional)"
          placeholder="e.g. Next.js, Kubernetes, CI/CD, React"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="primary"
            onClick={handleGenerate}
            loading={loading}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            {suggestions.length > 0 ? 'Regenerate Bullets' : 'Generate Bullets'}
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
              Transforming your tasks into achievement-driven bullets...
            </p>
          </div>
        )}

        {!loading && suggestions.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select bullet to insert:
            </h4>
            <div className="space-y-3">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-500 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      • {item.text}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelect(item.text)}
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                      className="shrink-0"
                    >
                      Insert
                    </Button>
                  </div>
                  {item.rationale && (
                    <p className="text-xs text-slate-500 italic">
                      Why: {item.rationale}
                    </p>
                  )}
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
