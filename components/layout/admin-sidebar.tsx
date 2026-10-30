'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../ui/logo';
import {
  LayoutDashboard,
  Users,
  FileText,
  Layers,
  History,
  DownloadCloud,
  Sparkles,
  Settings,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'CV Documents', href: '/admin/cvs', icon: FileText },
    { label: 'Templates Catalog', href: '/admin/templates', icon: Layers },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
    { label: 'Export Telemetry', href: '/admin/exports', icon: DownloadCloud },
    { label: 'AI Usage Logs', href: '/admin/ai-usage', icon: Sparkles },
    { label: 'System Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-950 text-slate-300 border-r border-slate-800 p-6 flex flex-col min-h-screen">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
        <Logo size="md" href="/admin/dashboard" />
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
          <ShieldAlert className="h-3 w-3" /> ADMIN
        </span>
      </div>

      <nav className="space-y-1.5 flex-1">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-500')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit to User App</span>
        </Link>
      </div>
    </aside>
  );
}
