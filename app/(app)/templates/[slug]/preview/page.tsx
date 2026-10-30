'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Check, Download, Layers } from 'lucide-react';

export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAppSelector((state) => state.auth);

  const getTemplateInfo = (key: string) => {
    switch (key) {
      case 'adeel-signature':
        return {
          name: 'Adeel Ul Rehman Signature',
          category: 'Signature / Modern',
          ats: true,
          description:
            'Official signature CV of Adeel Ul Rehman based on Adeel Ul Rehman.docx. Distinctive two-column format with circular profile picture, deep cobalt blue accents, and clean Times New Roman typography on 1 single page.',
        };
      case 'europass':
        return {
          name: 'Europass CV Template',
          category: 'EU Standard',
          ats: true,
          description:
            'Structured European timeline format with profile photograph, categorized skills, and bilingual layout support.',
        };
      case 'jobhire-chronological':
        return {
          name: 'JobHire Chronological',
          category: 'Classic / Corporate',
          ats: true,
          description:
            'Engineered for maximum ATS parsing accuracy. Single-column chronological layout favored by top Fortune 500 recruiters.',
        };
      case 'jobhire-creative':
        return {
          name: 'JobHire Creative Modern',
          category: 'Creative / Tech',
          ats: false,
          description:
            'Two-column modern format featuring sidebar highlights, skill rating meters, and distinguished accent typography.',
        };
      default:
        return {
          name: 'Professional CV Template',
          category: 'Modern',
          ats: true,
          description: 'Recruiter-approved curriculum vitae layout.',
        };
    }
  };

  const info = getTemplateInfo(slug);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/templates">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Catalog
            </Button>
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              {info.name}
            </h1>
            <Badge variant="outline">{info.category}</Badge>
            {info.ats && <Badge variant="success">ATS Certified</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Button
              variant="primary"
              onClick={() => router.push(`/cv/new?template=${slug}`)}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Use This Template
            </Button>
          ) : (
            <Link href={`/login?redirect=/cv/new?template=${slug}`}>
              <Button variant="primary">
                Sign In to Use Template
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Preview Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col items-center">
          {/* Information Strip */}
          <div className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>{info.description}</span>
            <span className="shrink-0 text-slate-400">Sample Candidate Document</span>
          </div>

          {/* Full Page Iframe Preview */}
          <div className="w-full p-4 sm:p-8 flex justify-center bg-slate-200/50 dark:bg-slate-950/60 overflow-x-auto">
            <div className="w-[820px] shadow-2xl rounded-sm overflow-hidden bg-white">
              <iframe
                src={`/api/templates/${slug}/sample-preview`}
                title={`${info.name} Preview`}
                className="w-full h-[1160px] border-0 bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
