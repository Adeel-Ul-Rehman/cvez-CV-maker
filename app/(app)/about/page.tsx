'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Heart,
  ShieldCheck,
  Code2,
  Sparkles,
  Mail,
  ExternalLink,
  Lock,
  Globe,
  Phone,
  CheckCircle2,
  FileText,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 px-3 sm:px-0">
      {/* Hero Intro */}
      <div className="text-center space-y-3">
        <Badge variant="primary" className="mx-auto text-xs px-3 py-1 font-semibold">
          About the Creator &amp; Mission
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 font-display tracking-tight">
          Crafted with care to make resume building free, fair &amp; powerful.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          CVez was born from a simple belief: landing your dream job shouldn&apos;t start with a paywall
          or deceptive subscriptions.
        </p>
      </div>

      {/* Creator Profile Card */}
      <Card className="p-6 sm:p-10 rounded-3xl border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          {/* Creator Photo Container */}
          <div className="relative shrink-0">
            <div className="p-1 rounded-3xl bg-gradient-to-tr from-primary-600 via-indigo-500 to-emerald-400 shadow-xl">
              <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-[22px] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src="/me.png"
                  alt="Adeel Ul Rehman"
                  className="h-full w-full object-cover object-top hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            <div
              className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-3 border-white dark:border-slate-900 shadow-md flex items-center justify-center"
              title="Verified Creator"
            >
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          {/* Creator Information Details */}
          <div className="space-y-4 text-center md:text-left flex-1">
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 justify-center md:justify-start">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
                  Adeel Ul Rehman
                </h2>
                <span className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full w-fit mx-auto md:mx-0">
                  <CheckCircle2 className="h-3 w-3" /> Author &amp; Creator
                </span>
              </div>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
                Founder &amp; Software Engineer | Creator of CVez
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Computer Science Undergraduate @ UET Lahore
              </p>
            </div>

            {/* About Me Story */}
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              <p>
                Hi, I&apos;m <strong>Adeel</strong>! I am a Computer Science student at UET Lahore and a passionate software engineer specializing in full-stack web applications, AI/ML pipelines, mobile apps, and intelligent automation.
              </p>
              <p>
                <strong>Why I built this tool:</strong> Like many job seekers, I was tired of resume websites that trick you into spending an hour building a CV, only to lock your download behind an expensive monthly subscription or ugly watermarks.
              </p>
              <p>
                I built <strong>CVez</strong> to fix that frustration once and for all. It is <strong>100% free forever</strong> — providing students, fresh graduates, and professionals with modern ATS-friendly templates, smart AI assistance, and instant vector PDF downloads without hidden paywalls.
              </p>
            </div>

            {/* Connect & Social Links */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Connect With Me:
              </span>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {/* Portfolio */}
                <a
                  href="https://adeel-portfolio-eight.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/50 dark:hover:text-primary-400 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Globe className="h-3.5 w-3.5 text-primary-500" />
                  <span>Portfolio</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com/in/adeel-ul-rehman-73a088294"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors border border-blue-200 dark:border-blue-800"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span>LinkedIn</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>

                {/* GitHub */}
                <a
                  href="https://github.com/Adeel-Ul-Rehman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-800"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>

                {/* Email */}
                <a
                  href="mailto:ajadeel229@gmail.com"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200 dark:border-emerald-800"
                >
                  <Mail className="h-3.5 w-3.5 text-emerald-600" />
                  <span>ajadeel229@gmail.com</span>
                </a>

                {/* Phone / WhatsApp */}
                <a
                  href="https://wa.me/923090005634"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors border border-teal-200 dark:border-teal-800"
                >
                  <Phone className="h-3.5 w-3.5 text-teal-600" />
                  <span>+92 309 0005634</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Core Principles Grid */}
      <div className="space-y-4">
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
            Built on Clear Principles
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Why CVez is different from typical subscription-locked CV builders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-6 space-y-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
              100% Free Forever
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No trial traps, no watermarks, and no paywalls. Every template, export format (PDF, DOCX, PNG, JPG), and AI assistant is open and free.
            </p>
          </Card>

          <Card className="p-6 space-y-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
              ATS-Optimized Architecture
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Designed according to real hiring systems standards: clean semantic single-column hierarchy, parseable text layers, and zero formatting clutter.
            </p>
          </Card>

          <Card className="p-6 space-y-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Privacy First
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your resume data is strictly yours. Stored with PostgreSQL encryption, with zero data-selling to recruiters and zero tracking scripts.
            </p>
          </Card>
        </div>
      </div>

      {/* Tech Stack Highlights */}
      <Card className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary-600" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Engineered with Modern Technologies
          </h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          CVez is built using Next.js 14 App Router, TypeScript, Tailwind CSS, Google Gemini AI, PostgreSQL, and a headless Chromium vector export pipeline to deliver instant rendering and pixel-perfect document fidelity on mobile and desktop.
        </p>
      </Card>

      {/* Call to Action */}
      <div className="text-center p-8 rounded-3xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white space-y-4 shadow-xl">
        <h3 className="text-2xl font-extrabold font-display">
          Ready to create your job-winning resume?
        </h3>
        <p className="text-xs sm:text-sm text-primary-100 max-w-md mx-auto">
          Start building your ATS-friendly resume in under 5 minutes — completely free.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/cv/new">
            <Button
              variant="secondary"
              className="bg-white text-primary-700 hover:bg-slate-100 font-bold shadow-md"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Create My Free CV
            </Button>
          </Link>
          <Link href="/templates">
            <Button
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10 font-medium"
            >
              Browse Templates
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
