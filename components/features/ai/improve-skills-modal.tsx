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
import { Sparkles, Plus, Check } from 'lucide-react';

interface SuggestedSkill {
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  reason?: string | null;
}

interface ImproveSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSkills: string[];
  onAddSkill: (skill: { name: string; level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null }) => void;
}

export function ImproveSkillsModal({
  isOpen,
  onClose,
  currentSkills,
  onAddSkill,
}: ImproveSkillsModalProps) {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedSkill[]>([]);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());
  const [provider, setProvider] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post<{
        suggested: SuggestedSkill[];
        provider: string;
        model: string;
      }>('/api/ai/improve-skills', {
        currentSkills,
        jobTitle: jobTitle.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      });

      if (res.data?.suggested) {
        setSuggestions(res.data.suggested);
        setProvider(res.data.provider);
        toastSuccess('Skills analyzed', 'Recommendations matching industry standards found.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to suggest skills');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (skill: SuggestedSkill) => {
    onAddSkill({
      name: skill.name,
      level: skill.level || 'intermediate',
    });
    setAddedSkills((prev) => new Set(prev).add(skill.name));
    toastSuccess(`Added "${skill.name}"`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Skill Gap Analysis & Recommendations"
      description="Identify high-demand technical and soft skills missing from your CV for targeted job openings."
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Target Role / Domain"
            placeholder="e.g. DevOps Engineer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
          <Input
            label="Current Skills Count"
            disabled
            value={`${currentSkills.length} skills listed`}
          />
        </div>

        <Textarea
          label="Target Job Description (Optional)"
          placeholder="Paste requirements section from the target job posting..."
          rows={3}
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
            {suggestions.length > 0 ? 'Regenerate Skills' : 'Analyze Skills'}
          </Button>
        </div>

        {loading && (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Spinner size="lg" className="mx-auto text-primary-600" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Scanning industry standards for matching competencies...
            </p>
          </div>
        )}

        {!loading && suggestions.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recommended Skills to Add:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto p-1">
              {suggestions.map((skill, idx) => {
                const isAdded = addedSkills.has(skill.name);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {skill.name}
                        </span>
                        {skill.level && (
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {skill.level}
                          </Badge>
                        )}
                      </div>
                      {skill.reason && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {skill.reason}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isAdded ? 'ghost' : 'outline'}
                      onClick={() => handleAdd(skill)}
                      disabled={isAdded}
                      className="shrink-0"
                      leftIcon={
                        isAdded ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )
                      }
                    >
                      {isAdded ? 'Added' : 'Add'}
                    </Button>
                  </div>
                );
              })}
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
