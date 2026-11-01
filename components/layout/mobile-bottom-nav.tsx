'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { LayoutDashboard, FileText, Plus, User, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onOpenDrawer?: () => void;
}

export function MobileBottomNav({ onOpenDrawer }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);

  // Hide bottom nav in full-screen editor and step wizard to maximize editing area and prevent button collision
  if (pathname.includes('/editor') || pathname.includes('/wizard')) {
    return null;
  }

  const isDashboardActive = pathname === '/dashboard' || pathname === '/';
  const isTemplatesActive = pathname.startsWith('/templates');
  const isNewActive = pathname.startsWith('/cv/new');
  const isAccountActive = pathname.startsWith('/account') || pathname.startsWith('/login') || pathname.startsWith('/register');

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] pb-safe transition-all"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {/* 1. Dashboard / Home */}
        <Link
          href={user ? '/dashboard' : '/'}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors select-none',
            isDashboardActive
              ? 'text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-all', isDashboardActive && 'bg-primary-50 dark:bg-primary-950/60')}>
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="mt-0.5 truncate">{user ? 'My CVs' : 'Home'}</span>
        </Link>

        {/* 2. Templates */}
        <Link
          href="/templates"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors select-none',
            isTemplatesActive
              ? 'text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-all', isTemplatesActive && 'bg-primary-50 dark:bg-primary-950/60')}>
            <FileText className="h-5 w-5" />
          </div>
          <span className="mt-0.5 truncate">Templates</span>
        </Link>

        {/* 3. Center Elevated + Action Button */}
        <div className="flex flex-col items-center justify-center flex-1 py-1 select-none">
          <Link
            href="/cv/new"
            aria-label="Create New CV"
            className={cn(
              'h-12 w-12 rounded-full -mt-5 bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 active:scale-95 transition-transform border-4 border-white dark:border-[#090d16]',
              isNewActive && 'ring-2 ring-primary-500'
            )}
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </Link>
          <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 mt-1 truncate">
            New CV
          </span>
        </div>

        {/* 4. Profile / Account */}
        <Link
          href={user ? '/account' : '/login'}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors select-none',
            isAccountActive
              ? 'text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-all', isAccountActive && 'bg-primary-50 dark:bg-primary-950/60')}>
            <User className="h-5 w-5" />
          </div>
          <span className="mt-0.5 truncate">{user ? 'Account' : 'Sign In'}</span>
        </Link>

        {/* 5. Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none cursor-pointer"
          aria-label="Open menu drawer"
        >
          <div className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Menu className="h-5 w-5" />
          </div>
          <span className="mt-0.5 truncate">Menu</span>
        </button>
      </div>
    </nav>
  );
}

