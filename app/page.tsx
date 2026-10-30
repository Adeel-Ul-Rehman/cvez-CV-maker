'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Download,
  History,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Eye,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TemplatePreviewFrame } from '@/components/features/cv/template-preview-frame';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const features = [
    {
      icon: FileText,
      title: '3 Professional Templates',
      description:
        'Crafted by career consultants and typography specialists: Europass, Jobhire Chronological, and Jobhire Creative.',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Writing',
      description:
        'Smart bullet improvement, tailored executive summaries, and industry skill recommendations backed by multi-model AI.',
    },
    {
      icon: FileCheck,
      title: 'ATS Optimizer',
      description:
        'Automated scoring checks your resume structure, keyword distribution, and readability for applicant tracking systems.',
    },
    {
      icon: Download,
      title: '4 High-Fidelity Formats',
      description:
        'Direct streaming export to pixel-perfect PDF, native editable Microsoft Word (.docx), high-res PNG, and JPG.',
    },
    {
      icon: History,
      title: 'Version History & Restore',
      description:
        'Automatic snapshotting on every revision. Easily review previous versions or restore changes with a single click.',
    },
    {
      icon: ShieldCheck,
      title: '100% Free Forever',
      description:
        'No credit cards, no hidden watermarks, no paywalls on export. Your data belongs strictly to you.',
    },
  ];

  const templates = [
    {
      key: 'adeel-signature',
      name: 'Adeel Ul Rehman Signature',
      category: 'Signature / Modern',
      description: 'Official signature CV of Adeel Ul Rehman. Distinctive two-column format with profile picture, blue accents, and clean typography.',
      thumbnail: '/template-thumbnails/adeel-two-column.png',
    },
    {
      key: 'europass',
      name: 'Europass Standard',
      category: 'EU Standard',
      description: 'Clean single-column European format with top-right photo and clear timeline hierarchy.',
      thumbnail: '/template-thumbnails/europass.png',
    },
    {
      key: 'jobhire-chronological',
      name: 'Jobhire Chronological',
      category: 'ATS-Friendly',
      description: 'Clean corporate layout prioritizing work experience and measurable career progression.',
      thumbnail: '/template-thumbnails/jobhire-chronological.png',
    },
    {
      key: 'jobhire-creative',
      name: 'Jobhire Creative',
      category: 'Creative Design',
      description: 'Modern two-column asymmetric layout with a 32% styled sidebar for skills and contact data.',
      thumbnail: '/template-thumbnails/jobhire-creative.png',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Select a Template',
      description: 'Choose from our curated ATS-friendly and creative templates suited for your target industry.',
    },
    {
      step: '02',
      title: 'Fill or Enhance with AI',
      description: 'Use the step-by-step guided wizard or let AI polish your experience bullets into high-impact metrics.',
    },
    {
      step: '03',
      title: 'Export & Land the Job',
      description: 'Instantly download your resume in PDF, editable Word (.docx), or high-DPI image formats.',
    },
  ];

  const faqs = [
    {
      q: 'Is CV Maker really 100% free?',
      a: 'Yes, completely free. You can create up to 5 CVs, access all 3 templates, use AI suggestions, and export to PDF, DOCX, PNG, and JPG with zero fees or watermarks.',
    },
    {
      q: 'Are the exported files ATS-friendly?',
      a: 'Absolutely. Our templates follow semantic document hierarchy, standard headings, and clean typographic grids designed to pass corporate Applicant Tracking Systems with ease.',
    },
    {
      q: 'Can I edit the exported Word (.docx) document?',
      a: 'Yes! Our export engine builds genuine native Word tables, paragraphs, and styles—not a locked or rasterized image—allowing you to freely edit text in Microsoft Word, Google Docs, or LibreOffice.',
    },
    {
      q: 'How does the AI writing assistant work?',
      a: 'Our backend uses an intelligent cascading fallback chain (Gemini → Groq → HuggingFace) to generate STAR-method bullet points, tailor your summary, and audit ATS compatibility in real time.',
    },
    {
      q: 'Can I share my CV with recruiters online?',
      a: 'Yes! Every CV includes optional one-click public sharing that generates a secure, clean URL-safe link you can add to your job applications or email signature.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 selection:bg-primary-600 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-30 dark:opacity-20">
            <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-primary-600 to-cyan-400 blur-[140px]" />
          </div>

          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100/80 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-xs font-semibold text-primary-700 dark:text-primary-300">
                  <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                  <span>Next-Gen Multi-Model AI Resume Builder</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] max-w-2xl mx-auto lg:mx-0">
                  Create a professional CV in minutes — <span className="text-primary-600 dark:text-primary-400 whitespace-nowrap">free forever.</span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Stand out to recruiters with modern ATS-compliant templates, instant AI bullet optimization, and native Word, PDF, and high-DPI export.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link href="/register" className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" fullWidth rightIcon={<ArrowRight className="h-5 w-5" />}>
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/templates" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" fullWidth leftIcon={<Eye className="h-5 w-5" />}>
                      Browse Templates
                    </Button>
                  </Link>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> No credit card needed
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> 100% Free forever
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> ATS-optimized output
                  </span>
                </div>
              </div>

              {/* Hero Visual Mockup */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md aspect-[1/1.38] rounded-2xl p-2.5 bg-gradient-to-b from-slate-200/90 to-slate-300/50 dark:from-slate-800/90 dark:to-slate-900/50 shadow-2xl border border-slate-200 dark:border-slate-800">
                  <div className="w-full h-full rounded-xl overflow-hidden bg-white shadow-inner relative border border-slate-200 dark:border-slate-700">
                    <TemplatePreviewFrame templateKey="europass" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-white dark:bg-slate-900 rounded-xl p-3 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 z-10">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      98%
                    </div>
                    <div className="text-left text-xs whitespace-nowrap">
                      <p className="font-semibold text-slate-900 dark:text-white">ATS Fit Score</p>
                      <p className="text-slate-400">Optimized for algorithms</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* TRUST STRIP */}
        <section className="py-6 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60">
          <Container>
            <p className="text-center text-xs sm:text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400">
              Trusted by job seekers worldwide · 4 professional templates · ATS-optimized · PDF, DOCX, PNG, JPG export
            </p>
          </Container>
        </section>

        {/* FEATURES GRID */}
        <section className="py-20 bg-slate-50 dark:bg-[#090d16]">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <Badge variant="primary">Everything Included</Badge>
              <h2 className="text-3xl sm:text-4xl font-display font-bold">Built for Speed, Privacy, and Results</h2>
              <p className="text-base text-slate-600 dark:text-slate-400">
                Craft a resume that clears candidate filtering bots and impresses hiring managers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* TEMPLATE PREVIEW STRIP */}
        <section className="py-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
          <Container>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
              <div>
                <Badge variant="primary" className="mb-2">Document Styles</Badge>
                <h2 className="text-3xl font-display font-bold">Curated Template Catalog</h2>
              </div>
              <Link href="/templates">
                <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  View All Templates
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {templates.map((tpl) => (
                <div
                  key={tpl.key}
                  className="group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col"
                >
                  <div className="relative aspect-[1/1.38] bg-white overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                    <TemplatePreviewFrame templateKey={tpl.key} />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px] z-10">
                      <Link href={`/templates/${tpl.key}/preview`}>
                        <Button variant="secondary" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                          Preview
                        </Button>
                      </Link>
                      <Link href={`/register?template=${tpl.key}`}>
                        <Button variant="primary" size="sm">
                          Use Template
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-semibold text-base">{tpl.name}</h4>
                        <Badge variant="outline">{tpl.category}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{tpl.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-20 bg-slate-50 dark:bg-[#090d16]">
          <Container>
            <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
              <Badge variant="primary">Simple Workflow</Badge>
              <h2 className="text-3xl font-display font-bold">How It Works in 3 Steps</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((st, i) => (
                <div
                  key={i}
                  className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative shadow-xs"
                >
                  <span className="text-4xl font-display font-extrabold text-primary-600/20 dark:text-primary-400/20 mb-4 block">
                    {st.step}
                  </span>
                  <h3 className="text-lg font-semibold mb-2">{st.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{st.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* FAQ ACCORDION */}
        <section className="py-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
          <Container>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12 space-y-2">
                <Badge variant="primary">Common Questions</Badge>
                <h2 className="text-3xl font-display font-bold">Frequently Asked Questions</h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-5 text-left flex items-center justify-between font-semibold text-slate-900 dark:text-white hover:text-primary-600 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={cn('h-5 w-5 text-slate-400 transition-transform duration-200 shrink-0', isOpen && 'rotate-180 text-primary-600')}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-3 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        {/* FINAL CTA BANNER */}
        <section className="py-20 bg-primary-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <Container>
            <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">
                Ready to accelerate your career?
              </h2>
              <p className="text-base sm:text-lg text-primary-100">
                Join thousands of candidates who build professional, recruiter-ready resumes in minutes.
              </p>
              <div className="pt-2">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-white text-primary-700 hover:bg-slate-100 shadow-lg text-base font-semibold"
                  >
                    Build My Free CV Now
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
