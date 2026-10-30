'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from './container';
import { Logo } from '../ui/logo';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';
import { Avatar } from '../ui/avatar';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { Menu, X, PlusCircle, LayoutDashboard, FileText, User as UserIcon, Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, initialized } = useAppSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const navLinks = [
    { label: 'Templates', href: '/templates' },
    { label: 'About', href: '/about' },
  ];

  if (user) {
    navLinks.unshift({ label: 'Dashboard', href: '/dashboard' });
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-200 border-b',
        scrolled
          ? 'bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md border-slate-200/80 dark:border-slate-800/80 shadow-sm'
          : 'bg-white/60 dark:bg-[#090d16]/60 backdrop-blur-sm border-transparent'
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo size="md" />

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/cv/new">
                    <Button size="sm" variant="primary" leftIcon={<PlusCircle className="h-4 w-4" />}>
                      Create CV
                    </Button>
                  </Link>

                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-0.5 rounded-full ring-2 ring-transparent hover:ring-primary-500/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
                      aria-label="User account menu"
                    >
                      <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                    </button>

                    {userMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 text-left divide-y divide-slate-100 dark:divide-slate-800"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="px-4 py-3 flex items-center gap-3">
                          <Avatar src={user.avatarUrl} name={user.fullName} size="md" />
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {user.fullName || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            {user.provider === 'google' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded mt-1">
                                Google Account
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="py-1">
                          {user.role === 'admin' && (
                            <Link
                              href="/admin/dashboard"
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Shield className="h-4 w-4 text-primary-600" />
                              <span className="font-medium">Admin Panel</span>
                            </Link>
                          )}

                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <LayoutDashboard className="h-4 w-4 text-slate-400" />
                            <span>My Resumes</span>
                          </Link>

                          <Link
                            href="/account"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <UserIcon className="h-4 w-4 text-slate-400" />
                            <span>Account Settings</span>
                          </Link>
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => dispatch(logoutUser())}
                            className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <LogOut className="h-4 w-4" />
                            <span className="font-medium">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 min-touch-target"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3 animate-in slide-in-from-top-4 duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block px-3 py-2 rounded-xl text-base font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 mb-1">
                    <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {user.fullName || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <Link href="/cv/new" className="block w-full">
                    <Button variant="primary" fullWidth leftIcon={<PlusCircle className="h-4 w-4" />}>
                      Create CV
                    </Button>
                  </Link>
                  <Link href="/account" className="block w-full">
                    <Button variant="outline" fullWidth leftIcon={<UserIcon className="h-4 w-4" />}>
                      Account Settings
                    </Button>
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin/dashboard" className="block w-full">
                      <Button variant="secondary" fullWidth leftIcon={<Shield className="h-4 w-4" />}>
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => dispatch(logoutUser())}
                    leftIcon={<LogOut className="h-4 w-4" />}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" className="w-full">
                    <Button variant="outline" fullWidth>
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" className="w-full">
                    <Button variant="primary" fullWidth>
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
