'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { LayoutDashboard, FileText, User, LogOut, PlusCircle, Shield, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const links = [
    { label: 'My CVs', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Browse Templates', href: '/templates', icon: FileText },
    { label: 'Account Profile', href: '/account', icon: User },
    { label: 'About Creator', href: '/about', icon: Info },
  ];

  if (user?.role === 'admin') {
    links.push({ label: 'Admin Panel', href: '/admin/dashboard', icon: Shield });
  }

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 min-h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <Link href="/cv/new">
          <Button variant="primary" fullWidth leftIcon={<PlusCircle className="h-4 w-4" />}>
            New CV Document
          </Button>
        </Link>
      </div>

      <nav className="space-y-1.5 flex-1">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>CV Quota</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{user.cvCount || 0} / 5</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(((user.cvCount || 0) / 5) * 100, 100)}%` }}
            />
          </div>

          <Button
            variant="ghost"
            fullWidth
            onClick={() => dispatch(logoutUser())}
            className="justify-start text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign Out
          </Button>
        </div>
      )}
    </aside>
  );
}
