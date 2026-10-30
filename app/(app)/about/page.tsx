'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import {
  Heart,
  ShieldCheck,
  Code2,
  Sparkles,
  Mail,
  ExternalLink,
  Lock,
  Layers,
  Zap,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-4">
      {/* Hero Intro */}
      <div className="text-center space-y-4">
        <Badge variant="primary" className="mx-auto">
          About the Creator & Mission
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 font-display tracking-tight">
          Crafted with care for job seekers everywhere.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          CV Maker is an open, modern resume engineering platform designed to level the playing field
          with enterprise-grade ATS optimization and AI career tools — 100% free forever.
        </p>
      </div>

      {/* Creator Card */}
      <Card className="p-8 sm:p-10 rounded-3xl border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          {/* Creator Photo Container */}
          <div className="relative shrink-0">
            {/* 
              USER TO REPLACE PHOTO:
              Place your image at /public/creator.jpg.
              If /public/creator.jpg is not yet added, the img element below falls back gracefully.
            */}
            <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-primary-500 shadow-lg flex items-center justify-center">
              <img
                src="/creator.jpg"
                alt="Creator Portrait"
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback if /public/creator.jpg is not yet provided by the user
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-2xl font-bold text-slate-400 font-display select-none">
                Photo
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900 shadow">
              <Heart className="h-4 w-4 fill-current" />
            </div>
          </div>

          {/* Creator Information Details */}
          <div className="space-y-4 text-center sm:text-left flex-1">
            <div>
              {/* USER TO REPLACE: Put your real name here */}
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
                [CREATOR_NAME — USER TO REPLACE]
              </h2>
              {/* USER TO REPLACE: Put your professional title here */}
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-0.5">
                [CREATOR_ROLE — USER TO REPLACE: e.g. Full-Stack Systems Engineer & Product Builder]
              </p>
            </div>

            {/* USER TO REPLACE: Put your personal bio here */}
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              [CREATOR_BIO — USER TO REPLACE: I built CV Maker because landing an interview shouldn’t
              require expensive recurring subscriptions or clunky document editors. This platform combines
              modern typography, strict ATS compliance, and intelligent AI assistance to give candidates the best possible advantage.]
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-primary-500" />
                {/* TODO: USER TO REPLACE WITH YOUR REAL CONTACT EMAIL */}
                <a
                  href="mailto:contact@example.com"
                  className="hover:text-primary-600 underline font-medium"
                >
                  contact@example.com
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Verified Project Author</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Mission & Philosophy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-3 border-slate-200 dark:border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Heart className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            100% Free Forever
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            No trial periods, no watermarks, no paywalled export buttons. Every template and feature is open and accessible to all job seekers without hidden costs.
          </p>
        </Card>

        <Card className="p-6 space-y-3 border-slate-200 dark:border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Privacy First
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your personal resume data is encrypted and stored in PostgreSQL. We never sell candidate databases or track sensitive career information.
          </p>
        </Card>

        <Card className="p-6 space-y-3 border-slate-200 dark:border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Code2 className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Built with Modern Tech
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Engineered with Next.js 14 App Router, Tailwind CSS, Chromium puppeteer export rendering, and multi-provider AI fallback architecture.
          </p>
        </Card>
      </div>
    </div>
  );
}
