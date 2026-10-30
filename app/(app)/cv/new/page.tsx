'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TemplateRecommendModal } from '@/components/features/ai/template-recommend-modal';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { Sparkles, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { TemplatePreviewFrame } from '@/components/features/cv/template-preview-frame';

const TEMPLATE_OPTIONS = [
  {
    key: 'adeel-signature',
    name: 'Adeel Ul Rehman Signature',
    category: 'Signature / Modern',
    ats: true,
    description: 'Official signature CV of Adeel Ul Rehman with circular profile image and clean two-column layout on 1 page.',
    sampleUrl: '/api/templates/adeel-signature/sample-preview',
  },
  {
    key: 'europass',
    name: 'Europass CV',
    category: 'EU Standard',
    ats: true,
    description: 'Structured EU format with timeline milestones and photo support.',
    sampleUrl: '/api/templates/europass/sample-preview',
  },
  {
    key: 'jobhire-chronological',
    name: 'JobHire Chronological',
    category: 'Corporate / ATS',
    ats: true,
    description: 'Single-column chronological layout engineered for 100% ATS readability.',
    sampleUrl: '/api/templates/jobhire-chronological/sample-preview',
  },
  {
    key: 'jobhire-creative',
    name: 'JobHire Creative Modern',
    category: 'Tech / Creative',
    ats: false,
    description: 'Modern two-column design with sidebar metrics and distinctive typography.',
    sampleUrl: '/api/templates/jobhire-creative/sample-preview',
  },
];

import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';

function NewCvForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplate = searchParams.get('template');
  const { user } = useAppSelector((state) => state.auth);

  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    preselectedTemplate || 'jobhire-chronological'
  );
  const [cvTitle, setCvTitle] = useState('My CV');
  const [loading, setLoading] = useState(false);
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);

  useEffect(() => {
    if (preselectedTemplate && TEMPLATE_OPTIONS.some((t) => t.key === preselectedTemplate)) {
      setSelectedTemplate(preselectedTemplate);
    }
  }, [preselectedTemplate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvTitle.trim()) {
      toastError('Title required', 'Please provide a name for your CV document.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<{ cv: { id: string } }>('/api/cv', {
        title: cvTitle.trim(),
        templateKey: selectedTemplate,
      });

      if (res.data?.cv?.id) {
        toastSuccess('CV Document Initialized', 'Let’s enter your details step by step.');
        router.push(`/cv/${res.data.cv.id}/wizard`);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to create CV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
            Create a New CV Document
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pick a foundation layout and start filling in your career milestones.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setRecommendModalOpen(true)}
          leftIcon={<Sparkles className="h-4 w-4 text-primary-600" />}
        >
          AI Match Template
        </Button>
      </div>

      <form onSubmit={handleCreate} className="space-y-8">
        {/* Step 1: Template Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white font-bold text-xs">
              1
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Select Your Template
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEMPLATE_OPTIONS.map((tpl) => {
              const isSelected = selectedTemplate === tpl.key;

              return (
                <div
                  key={tpl.key}
                  onClick={() => setSelectedTemplate(tpl.key)}
                  className={`group relative rounded-2xl cursor-pointer border-2 transition-all p-3 flex flex-col justify-between bg-white dark:bg-slate-900 ${
                    isSelected
                      ? 'border-primary-600 ring-2 ring-primary-500/20 shadow-lg'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="relative aspect-[1/1.38] w-full rounded-xl overflow-hidden bg-white mb-3 border border-slate-100 dark:border-slate-800">
                    <TemplatePreviewFrame templateKey={tpl.key} />

                    {isSelected && (
                      <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {tpl.name}
                      </h3>
                      {tpl.ats && (
                        <Badge variant="success" className="text-[10px] py-0 px-1.5">
                          ATS Ready
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-tight">
                      {tpl.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Document Title */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white font-bold text-xs">
              2
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Name Your CV
            </h2>
          </div>

          <div className="max-w-md">
            <Input
              label="CV Title"
              placeholder="e.g. Software Engineer CV - Google"
              value={cvTitle}
              onChange={(e) => setCvTitle(e.target.value)}
              helperText="You can customize or duplicate this anytime"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Continue to Wizard
          </Button>
        </div>
      </form>

      {/* AI Recommend Modal */}
      <TemplateRecommendModal
        isOpen={recommendModalOpen}
        onClose={() => setRecommendModalOpen(false)}
        onSelectTemplate={(key) => {
          setSelectedTemplate(key);
          toastSuccess('Template matched!');
        }}
      />
    </div>
  );
}

export default function NewCvPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center flex justify-center"><Spinner size="lg" /></div>}>
      <NewCvForm />
    </Suspense>
  );
}
