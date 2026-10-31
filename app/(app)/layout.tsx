import React from 'react';
import { Navbar } from '@/components/layout/navbar';
import { AppSidebar } from '@/components/layout/sidebar';
import { Footer } from '@/components/layout/footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <div className="flex-1 flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden p-3 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
