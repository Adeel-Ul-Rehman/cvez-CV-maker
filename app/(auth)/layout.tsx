import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 dark:from-[#090d16] dark:via-[#090d16] dark:to-slate-950 transition-colors p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <Logo size="md" />
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center my-8">
        <div className="w-full max-w-md">{children}</div>
      </div>

      <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-4">
        <p>© {new Date().getFullYear()} CV Maker · 100% Free Forever · No credit card required</p>
      </div>
    </div>
  );
}
