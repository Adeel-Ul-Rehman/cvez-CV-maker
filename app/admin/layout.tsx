'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { toastError } from '@/components/ui/toast';
import { Menu, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, initialized } = useAppSelector((state) => state.auth);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (initialized) {
      if (!user) {
        router.push('/login?redirect=/admin/dashboard');
      } else if (user.role !== 'admin') {
        toastError('Forbidden', 'Admin access required');
        router.push('/dashboard');
      }
    }
  }, [user, initialized, router]);

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Desktop Permanent Sidebar */}
      <div className="hidden lg:block shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[80vw]">
            <AdminSidebar />
          </div>
        </div>
      )}

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Admin Topbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Open admin navigation menu"
            >
              {mobileDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="lg:hidden">
              <Logo size="sm" asLink={false} />
            </div>
            <h2 className="hidden sm:block text-sm font-semibold tracking-wide uppercase text-slate-400">
              Control Plane
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                User App
              </Button>
            </Link>
            <ThemeToggle />
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                <div className="hidden md:block text-left text-xs">
                  <p className="font-medium text-slate-200">{user.fullName}</p>
                  <p className="text-[10px] text-amber-400 font-mono">Administrator</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Admin Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#090d16]">
          {children}
        </main>
      </div>
    </div>
  );
}
