import React from 'react';
import Link from 'next/link';
import { Container } from './container';
import { Logo } from '../ui/logo';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-10 transition-colors">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Logo size="sm" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Create a professional CV in minutes — free forever.
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/templates" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Templates
            </Link>
            <Link href="/about" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              About
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} CV Maker. All rights reserved. Zero tracking, zero hidden fees.</p>
          <div className="flex items-center gap-4">
            <span>ATS-Optimized</span>
            <span>·</span>
            <span>4 Export Formats</span>
            <span>·</span>
            <span>100% Free Forever</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
