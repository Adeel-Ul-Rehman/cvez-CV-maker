'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CvRenderer } from '@/lib/renderer/CvRenderer';
import { apiClient } from '@/lib/api-client';
import { Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface PublicCvData {
  cv: {
    title: string;
    template_key: string;
    data: any;
    config: any;
    template_name: string;
  };
  user: {
    fullName: string;
    avatarUrl: string | null;
  };
}

export default function PublicCvPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cvInfo, setCvInfo] = useState<PublicCvData | null>(null);

  useEffect(() => {
    async function loadPublicCv() {
      try {
        const res = await apiClient<PublicCvData>(`/api/cv/public/${slug}`);
        if (res?.cv) {
          setCvInfo(res);
        } else {
          setError('This CV is private or no longer available.');
        }
      } catch (err: any) {
        setError(err.message || 'CV not found or link has expired.');
      } finally {
        setLoading(false);
      }
    }
    loadPublicCv();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 space-y-4">
        <Spinner size="lg" className="text-primary-600" />
        <p className="text-sm font-medium text-slate-500">Loading CV document...</p>
      </div>
    );
  }

  if (error || !cvInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Document Not Found
        </h1>
        <p className="text-sm text-slate-500 max-w-md">
          {error || 'This CV may have been unpublished by its owner or the URL is invalid.'}
        </p>
        <Link href="/">
          <Button variant="primary">Go to CV Maker Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900">
      {/* Top Banner Header */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" href="/" />
          <span className="hidden sm:inline text-xs text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800">
            Shared Document
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/register">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Create Your Free CV
            </Button>
          </Link>
        </div>
      </header>

      {/* Main CV View Area */}
      <main className="flex-1 p-4 sm:p-8 flex justify-center items-start overflow-x-auto">
        <div className="w-[820px] max-w-full bg-white shadow-2xl rounded-sm overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
          <CvRenderer
            templateKey={cvInfo.cv.template_key}
            data={cvInfo.cv.data}
            config={cvInfo.cv.config}
          />
        </div>
      </main>

      {/* Subtle Bottom Footer */}
      <footer className="py-4 text-center border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-500">
        Created with <strong className="text-slate-800 dark:text-slate-200">CV Maker</strong> — Professional resumes in minutes, 100% free.
      </footer>
    </div>
  );
}
