'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { toastError } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import {
  Sparkles,
  Search,
  Eye,
  ArrowRight,
  Filter,
  CheckCircle,
  Layers,
} from 'lucide-react';
import { TemplatePreviewFrame } from '@/components/features/cv/template-preview-frame';

interface TemplateItem {
  key: string;
  name: string;
  description: string;
  category: string;
  isAts: boolean;
  sampleUrl: string;
}

const ALL_TEMPLATES: TemplateItem[] = [
  {
    key: 'adeel-signature',
    name: 'Adeel Ul Rehman Signature',
    description:
      'Official signature CV of Adeel Ul Rehman. High-density single-column format with deep navy headings (#1F3864) strictly on one page.',
    category: 'Modern',
    isAts: true,
    sampleUrl: '/api/templates/adeel-signature/sample-preview',
  },
  {
    key: 'executive-modern-photo',
    name: 'Executive Modern Photo',
    description:
      'Distinctive two-column format with candidate photo, deep cobalt blue accents, and clean typography strictly on one page.',
    category: 'Modern',
    isAts: false,
    sampleUrl: '/api/templates/executive-modern-photo/sample-preview',
  },
  {
    key: 'creative-profile',
    name: 'Creative Profile Two-Column',
    description:
      'Vibrant two-column layout featuring emerald green accents (#00B050), photo profile sidebar, and diamond bullet points on one page.',
    category: 'Creative',
    isAts: false,
    sampleUrl: '/api/templates/creative-profile/sample-preview',
  },
  {
    key: 'teal-minimalist',
    name: 'Teal Minimalist Professional',
    description:
      'Clean modern UK/EU layout with petrol blue accents (#156082), prominent contact header, and timeline work history on one page.',
    category: 'Modern',
    isAts: true,
    sampleUrl: '/api/templates/teal-minimalist/sample-preview',
  },
  {
    key: 'navy-executive-sidebar',
    name: 'Navy Executive Sidebar',
    description:
      'Executive CV layout with a solid deep navy sidebar (#003060), crisp white typography, and structured career experience.',
    category: 'Modern',
    isAts: false,
    sampleUrl: '/api/templates/navy-executive-sidebar/sample-preview',
  },
  {
    key: 'europass',
    name: 'Europass CV',
    description: 'Official European Union standard with structured timeline and profile photo.',
    category: 'EU',
    isAts: true,
    sampleUrl: '/api/templates/europass/sample-preview',
  },
  {
    key: 'jobhire-chronological',
    name: 'JobHire Chronological',
    description: 'Classic single-column layout engineered for 100% ATS parser readability.',
    category: 'Classic',
    isAts: true,
    sampleUrl: '/api/templates/jobhire-chronological/sample-preview',
  },
  {
    key: 'jobhire-creative',
    name: 'JobHire Creative Modern',
    description: 'Distinctive two-column creative format with accent sidebar and skill ratings.',
    category: 'Creative',
    isAts: false,
    sampleUrl: '/api/templates/jobhire-creative/sample-preview',
  },
];

const CATEGORIES = ['All', 'ATS', 'Modern', 'Classic', 'EU', 'Creative'];

export default function TemplatesPage() {
  const router = useRouter();
  const [templatesList, setTemplatesList] = useState<TemplateItem[]>(ALL_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [atsOnly, setAtsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiRanking, setAiRanking] = useState<{ templateKey: string; relevance: number; reason: string }[] | null>(null);

  React.useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const json = await res.json();
          if (json?.templates && Array.isArray(json.templates)) {
            setTemplatesList(json.templates);
          }
        }
      } catch (err) {
        // Keeps fallback
      }
    }
    loadTemplates();
  }, []);

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setAiSearching(true);
    try {
      const res = await apiClient.post<{
        results: { templateKey: string; relevance: number; reason: string }[];
      }>('/api/ai/template-search', {
        query: searchQuery.trim(),
      });

      if (res.data?.results) {
        setAiRanking(res.data.results);
      }
    } catch (err: any) {
      toastError(err.message || 'AI search failed');
    } finally {
      setAiSearching(false);
    }
  };

  const clearAiSearch = () => {
    setSearchQuery('');
    setAiRanking(null);
  };

  // Filter templates
  const filteredTemplates = templatesList.filter((tpl) => {
    if (atsOnly && !tpl.isAts) return false;
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'ATS' && !tpl.isAts) return false;
      if (selectedCategory === 'Modern' && tpl.category !== 'Modern' && tpl.category !== 'Creative') return false;
      if (selectedCategory === 'Classic' && tpl.category !== 'Classic') return false;
      if (selectedCategory === 'EU' && tpl.category !== 'EU') return false;
      if (selectedCategory === 'Creative' && tpl.category !== 'Creative') return false;
    }
    return true;
  }).sort((a, b) => {
    if (aiRanking) {
      const rankA = aiRanking.find((r) => r.templateKey === a.key)?.relevance || 0;
      const rankB = aiRanking.find((r) => r.templateKey === b.key)?.relevance || 0;
      return rankB - rankA;
    }
    return 0;
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-2 sm:px-6">
      {/* Header & AI Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Resume & CV Templates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose an ATS-compliant, recruiter-approved format to launch your job search.
          </p>
        </div>

        {/* AI Matcher Search Input */}
        <form
          onSubmit={handleAiSearch}
          className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary-500/10 via-blue-500/5 to-transparent border border-primary-500/20 shadow-xs space-y-2"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
              AI Role Matcher
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Describe the job you're applying for (e.g. 'Software Engineer in Germany')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-slate-900 text-xs sm:text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={aiSearching}
                leftIcon={<Search className="h-4 w-4" />}
                className="shrink-0"
              >
                Find Best Match
              </Button>
              {aiRanking && (
                <Button variant="ghost" size="sm" onClick={clearAiSearch} className="shrink-0">
                  Reset
                </Button>
              )}
            </div>
          </div>
        </form>

        {/* Mobile Horizontal Category Pills */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAtsOnly(!atsOnly)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              atsOnly
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {atsOnly ? '✓ ATS Only' : 'ATS Only'}
          </button>
        </div>
      </div>

      {/* Main Grid with Left Filter Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Filters Panel (Desktop) */}
        <div className="hidden lg:block space-y-6 lg:border-r lg:border-slate-200 dark:lg:border-slate-800 lg:pr-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Filter className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Filter Formats
            </h3>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Category
            </h4>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <CheckCircle className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <Checkbox
              id="ats-filter"
              label="ATS-Friendly Only"
              helperText="Strictly single-column, standard headings"
              checked={atsOnly}
              onChange={(e) => setAtsOnly(e.target.checked)}
            />
          </div>
        </div>

        {/* Templates Grid: 2 Columns on Mobile, 2 on MD, 3 on XL */}
        <div className="lg:col-span-3 space-y-6">
          {filteredTemplates.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-10 w-10 text-slate-400" />}
              title="No templates match your filters"
              description="Try selecting a different category or clearing the ATS-only filter."
              action={{
                label: 'Reset Filters',
                onClick: () => {
                  setSelectedCategory('All');
                  setAtsOnly(false);
                  setAiRanking(null);
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
              {filteredTemplates.map((template) => {
                const aiMatch = aiRanking?.find((r) => r.templateKey === template.key);

                return (
                  <Card
                    key={template.key}
                    className="group relative overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl"
                  >
                    {/* Thumbnail Preview Area with Live Iframe Mini */}
                    <div className="relative aspect-[1/1.38] w-full bg-white overflow-hidden border-b border-slate-200 dark:border-slate-800">
                      <Link href={`/templates/${template.key}/preview`} className="block w-full h-full">
                        <TemplatePreviewFrame templateKey={template.key} />
                      </Link>

                      {/* Hover Overlay (Desktop) */}
                      <div className="hidden sm:flex absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex-col items-center justify-center gap-3 p-4 backdrop-blur-xs">
                        <Link href={`/templates/${template.key}/preview`}>
                          <Button variant="secondary" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                            Full Preview
                          </Button>
                        </Link>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => router.push(`/cv/new?template=${template.key}`)}
                          rightIcon={<ArrowRight className="h-4 w-4" />}
                        >
                          Use Template
                        </Button>
                      </div>

                      {/* Badges on Thumbnail */}
                      <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-wrap gap-1 pointer-events-none">
                        <Badge
                          variant="default"
                          className="bg-white/95 dark:bg-slate-900/95 text-[9px] sm:text-xs px-1.5 py-0.5 backdrop-blur-xs font-medium"
                        >
                          {template.category}
                        </Badge>
                        {template.isAts && (
                          <Badge
                            variant="success"
                            className="bg-emerald-500/90 text-white text-[9px] sm:text-xs px-1.5 py-0.5 backdrop-blur-xs hidden sm:inline-flex"
                          >
                            ATS Ready
                          </Badge>
                        )}
                        {aiMatch && (
                          <Badge variant="primary" className="bg-primary-600 text-white font-semibold text-[9px] sm:text-xs px-1.5 py-0.5">
                            {aiMatch.relevance}% Match
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Details */}
                    <div className="p-2 sm:p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-base leading-tight truncate">
                          {template.name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 hidden sm:block">
                          {template.description}
                        </p>
                        {aiMatch?.reason && (
                          <p className="text-[10px] sm:text-[11px] text-primary-600 dark:text-primary-400 font-medium italic truncate">
                            ✨ {aiMatch.reason}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 sm:pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-2 sm:mt-4 gap-1">
                        <Link
                          href={`/templates/${template.key}/preview`}
                          className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 truncate"
                        >
                          Preview
                        </Link>
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-[11px] sm:text-xs px-2 sm:px-3 h-7 sm:h-8"
                          onClick={() => router.push(`/cv/new?template=${template.key}`)}
                        >
                          Use
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
