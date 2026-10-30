'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TemplateRecommendModal } from '@/components/features/ai/template-recommend-modal';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { TemplatePreviewFrame } from '@/components/features/cv/template-preview-frame';
import { Spinner } from '@/components/ui/spinner';

interface TemplateOption {
  key: string;
  name: string;
  category: string;
  ats: boolean;
  description: string;
  sampleUrl: string;
}

const DEFAULT_TEMPLATES: TemplateOption[] = [
  {
    key: 'adeel-signature',
    name: 'Adeel Ul Rehman Signature',
    category: 'Signature',
    ats: true,
    description: 'Official single-column layout with deep navy headers and structured projects.',
    sampleUrl: '/api/templates/adeel-signature/sample-preview',
  },
  {
    key: 'executive-modern-photo',
    name: 'Executive Modern Photo',
    category: 'Modern',
    ats: false,
    description: 'Two-column format with candidate photo, cobalt blue accents, and typography.',
    sampleUrl: '/api/templates/executive-modern-photo/sample-preview',
  },
  {
    key: 'creative-profile',
    name: 'Creative Profile Two-Column',
    category: 'Creative',
    ats: false,
    description: 'Vibrant layout with emerald green accents (#00B050), photo sidebar, and diamond bullets.',
    sampleUrl: '/api/templates/creative-profile/sample-preview',
  },
  {
    key: 'teal-minimalist',
    name: 'Teal Minimalist Professional',
    category: 'Modern',
    ats: true,
    description: 'Clean UK/EU layout with petrol blue accents (#156082) and timeline work history.',
    sampleUrl: '/api/templates/teal-minimalist/sample-preview',
  },
  {
    key: 'navy-executive-sidebar',
    name: 'Navy Executive Sidebar',
    category: 'Executive',
    ats: false,
    description: 'Solid deep navy sidebar (#003060), crisp white typography, and executive focus.',
    sampleUrl: '/api/templates/navy-executive-sidebar/sample-preview',
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
    category: 'ATS Friendly',
    ats: true,
    description: 'Single-column chronological layout engineered for 100% ATS readability.',
    sampleUrl: '/api/templates/jobhire-chronological/sample-preview',
  },
  {
    key: 'jobhire-creative',
    name: 'JobHire Creative Modern',
    category: 'Creative',
    ats: false,
    description: 'Modern two-column design with sidebar metrics and distinctive typography.',
    sampleUrl: '/api/templates/jobhire-creative/sample-preview',
  },
];

function NewCvForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplate = searchParams.get('template');
  const { user } = useAppSelector((state) => state.auth);

  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    preselectedTemplate || 'adeel-signature'
  );
  const [cvTitle, setCvTitle] = useState('My CV');
  const [loading, setLoading] = useState(false);
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const json = await res.json();
          if (json?.templates && Array.isArray(json.templates)) {
            const mapped = json.templates.map((t: any) => ({
              key: t.key,
              name: t.name,
              category: t.category,
              ats: t.isAts,
              description: t.description,
              sampleUrl: t.sampleUrl,
            }));
            setTemplateOptions(mapped);
          }
        }
      } catch {
        // Fallback to DEFAULT_TEMPLATES
      }
    }
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (preselectedTemplate) {
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
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 py-4 sm:py-6 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Create a New CV
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pick a template and give your resume a title to get started.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setRecommendModalOpen(true)}
          leftIcon={<Sparkles className="h-4 w-4 text-primary-600" />}
          className="self-start sm:self-auto text-xs sm:text-sm"
        >
          AI Template Advisor
        </Button>
      </div>

      <form onSubmit={handleCreate} className="space-y-6 sm:space-y-8">
        {/* Step 1: Template Selection (2 columns on mobile, 3 on md) */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white font-bold text-xs">
              1
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Select Your Template
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6">
            {templateOptions.map((tpl) => {
              const isSelected = selectedTemplate === tpl.key;

              return (
                <div
                  key={tpl.key}
                  onClick={() => setSelectedTemplate(tpl.key)}
                  className={`group relative rounded-xl sm:rounded-2xl cursor-pointer border-2 transition-all p-2 sm:p-3 flex flex-col justify-between bg-white dark:bg-slate-900 ${
                    isSelected
                      ? 'border-primary-600 ring-2 ring-primary-500/20 shadow-md sm:shadow-lg'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="relative aspect-[1/1.38] w-full rounded-lg sm:rounded-xl overflow-hidden bg-white mb-2 sm:mb-3 border border-slate-100 dark:border-slate-800">
                    <TemplatePreviewFrame templateKey={tpl.key} />

                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md">
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                        {tpl.name}
                      </h3>
                      {tpl.ats && (
                        <Badge variant="success" className="text-[9px] py-0 px-1 hidden sm:inline-flex shrink-0">
                          ATS
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-tight line-clamp-1 sm:line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Document Title */}
        <div className="space-y-3 sm:space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white font-bold text-xs">
              2
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
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
        <div className="pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
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
          setRecommendModalOpen(false);
          toastSuccess('Template Selected', `Selected template: ${key}`);
        }}
      />
    </div>
  );
}

export default function NewCvPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <NewCvForm />
    </Suspense>
  );
}
