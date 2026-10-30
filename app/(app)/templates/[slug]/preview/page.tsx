'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTemplate } from '@/templates/registry';
import {
  ArrowLeft,
  Sparkles,
  Maximize2,
  Minimize2,
  CheckCircle,
  Eye,
  FileText,
} from 'lucide-react';

export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAppSelector((state) => state.auth);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit');
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Look up template metadata
  const registered = getTemplate(slug);
  const info = registered
    ? {
        name: registered.name,
        category: registered.category,
        ats: registered.category === 'ATS' || registered.layoutHints?.columns === 1,
        description: registered.description,
      }
    : {
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        category: 'Modern',
        ats: true,
        description: 'Professional recruiter-approved curriculum vitae layout.',
      };

  // Measure container and scale iframe to fit viewport perfectly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const calculateScale = () => {
      const width = el.clientWidth;
      setContainerWidth(width);

      if (zoomMode === 'actual') {
        setScale(1);
      } else {
        // Standard A4 pixel width is 794px
        // Add padding margin (16px on mobile, 32px on desktop)
        const padding = width < 640 ? 16 : 48;
        const availableWidth = Math.max(260, width - padding);
        const computedScale = Math.min(1.0, availableWidth / 794);
        setScale(computedScale);
      }
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(() => {
      calculateScale();
    });

    resizeObserver.observe(el);
    window.addEventListener('resize', calculateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [zoomMode]);

  const handleUseTemplate = () => {
    const targetUrl = `/cv/new?template=${slug}`;
    if (user) {
      router.push(targetUrl);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-100 dark:bg-slate-950 pb-20 sm:pb-8">
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <Link href="/templates">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="px-2 sm:px-3">
              <span className="hidden sm:inline">Back to Catalog</span>
              <span className="sm:hidden text-xs">Catalog</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 truncate">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 font-display truncate">
              {info.name}
            </h1>
            <Badge variant="outline" className="hidden md:inline-flex text-[10px]">
              {info.category}
            </Badge>
            {info.ats && (
              <Badge variant="success" className="hidden md:inline-flex text-[10px]">
                ATS Ready
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={() => setZoomMode(zoomMode === 'fit' ? 'actual' : 'fit')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={zoomMode === 'fit' ? 'Switch to 100% actual size' : 'Fit whole page to screen'}
          >
            {zoomMode === 'fit' ? (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                <span className="hidden sm:inline">100% Size</span>
                <span className="sm:hidden">100%</span>
              </>
            ) : (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                <span className="hidden sm:inline">Fit Screen</span>
                <span className="sm:hidden">Fit</span>
              </>
            )}
          </button>

          {/* Desktop CTA Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleUseTemplate}
            leftIcon={<Sparkles className="h-4 w-4" />}
            className="hidden sm:flex"
          >
            Use This Template
          </Button>
        </div>
      </header>

      {/* Main Preview Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-2 sm:p-6 flex flex-col items-center">
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col items-center">
          {/* Information Strip */}
          <div className="w-full px-3 py-2.5 sm:px-6 sm:py-3.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="truncate">{info.description}</span>
            <span className="shrink-0 text-slate-400 hidden sm:inline flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Standard A4 Document
            </span>
          </div>

          {/* Responsive Preview Viewport */}
          <div
            ref={containerRef}
            className={`w-full p-2 sm:p-8 flex justify-center bg-slate-200/60 dark:bg-slate-950/70 ${
              zoomMode === 'actual' ? 'overflow-x-auto' : 'overflow-hidden'
            }`}
          >
            <div
              style={{
                width: `${Math.round(794 * scale)}px`,
                height: `${Math.round(1123 * scale)}px`,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                boxShadow:
                  '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                borderRadius: '4px',
                transition: 'width 0.2s ease, height 0.2s ease',
                flexShrink: 0,
              }}
            >
              <iframe
                src={`/api/templates/${slug}/sample-preview`}
                title={`${info.name} Preview`}
                style={{
                  width: '794px',
                  height: '1123px',
                  border: 'none',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  backgroundColor: '#ffffff',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Mobile Bottom Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between gap-3 shadow-2xl">
        <div className="truncate flex-1">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
            {info.name}
          </p>
          <p className="text-[10px] text-slate-500">
            {info.category} • {info.ats ? 'ATS Friendly' : 'Custom Layout'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleUseTemplate}
          leftIcon={<Sparkles className="h-4 w-4" />}
          className="shrink-0 px-4 h-9 font-semibold"
        >
          Use Template
        </Button>
      </div>
    </div>
  );
}
