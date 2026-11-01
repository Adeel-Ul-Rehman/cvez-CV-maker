'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from './container';
import { Logo } from '../ui/logo';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { MobileBottomNav } from './mobile-bottom-nav';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import {
  Menu,
  X,
  PlusCircle,
  LayoutDashboard,
  FileText,
  User as UserIcon,
  Shield,
  LogOut,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  const openDrawer = useCallback(() => {
    setIsClosing(false);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setDrawerOpen(false);
      setIsClosing(false);
      setDrawerMounted(false);
    }, 280);
  }, [isClosing]);

  useEffect(() => {
    if (drawerOpen && !isClosing) {
      const raf = requestAnimationFrame(() => setDrawerMounted(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [drawerOpen, isClosing]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [drawerOpen]);

  // Close menus on route change
  useEffect(() => {
    setDrawerOpen(false);
    setIsClosing(false);
    setDrawerMounted(false);
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

  const desktopNavLinks = [
    { label: 'Templates', href: '/templates' },
    { label: 'About', href: '/about' },
  ];

  if (user) {
    desktopNavLinks.unshift({ label: 'Dashboard', href: '/dashboard' });
  }

  const drawerLinks = [
    { label: 'My CVs', href: '/dashboard', icon: LayoutDashboard, requiresAuth: true },
    { label: 'Browse Templates', href: '/templates', icon: FileText, requiresAuth: false },
    { label: 'Create New CV', href: '/cv/new', icon: PlusCircle, requiresAuth: false, highlight: true },
    { label: 'Account Profile', href: '/account', icon: UserIcon, requiresAuth: true },
    { label: 'About Creator', href: '/about', icon: Info, requiresAuth: false },
  ];

  if (user?.role === 'admin') {
    drawerLinks.push({ label: 'Admin Panel', href: '/admin/dashboard', icon: Shield, requiresAuth: true });
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-200 border-b',
          scrolled
            ? 'bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md border-slate-200/80 dark:border-slate-800/80 shadow-xs'
            : 'bg-white/70 dark:bg-[#090d16]/70 backdrop-blur-sm border-transparent'
        )}
      >
        <Container>
          <div className="flex h-16 items-center justify-between">
            {/* Left: Brand Logo & Desktop Nav */}
            <div className="flex items-center gap-3 sm:gap-8">
              <Logo size="md" />

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-6">
                {desktopNavLinks.map((link) => {
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

            {/* Right: Theme Toggle + Auth Buttons + Mobile Hamburger */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />

              {/* Desktop User / Auth Controls */}
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

              {/* Mobile Hamburger Drawer Trigger (Right-aligned) */}
              <button
                type="button"
                onClick={openDrawer}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* RIGHT-TO-LEFT SLIDE-OVER DRAWER FOR MOBILE WITH SMOOTH EXIT */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Dark Backdrop Overlay with fade in/out */}
          <div
            className={cn(
              'fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 ease-in-out',
              drawerMounted && !isClosing ? 'opacity-100' : 'opacity-0'
            )}
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Sliding Drawer Container (Slide in from right, slide back to right on close) */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
            className={cn(
              'fixed inset-y-0 right-0 w-[84vw] max-w-[320px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto z-50 transform transition-transform duration-300 ease-out',
              drawerMounted && !isClosing ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            {/* Drawer Header & Profile */}
            <div>
              {/* Top Bar with Logo & Close Button */}
              <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <Logo size="md" />
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close menu drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Profile Area */}
              {user ? (
                <div className="p-4 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatarUrl} name={user.fullName} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.fullName || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {user.emailVerified ? (
                          <Badge variant="success" className="text-[9px] px-1 py-0">Verified</Badge>
                        ) : (
                          <Badge variant="warning" className="text-[9px] px-1 py-0">Unverified</Badge>
                        )}
                        {user.role === 'admin' && (
                          <Badge variant="primary" className="text-[9px] px-1 py-0">Admin</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quota Progress */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>CVs Created:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{user.cvCount || 0} / 5</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(((user.cvCount || 0) / 5) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-primary-50/60 dark:bg-primary-950/30 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Free Forever CV Builder</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    Create ATS-optimized resumes with AI bullet enhancements and export anytime.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={closeDrawer} className="w-full">
                      <Button variant="outline" size="sm" fullWidth className="text-xs">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={closeDrawer} className="w-full">
                      <Button variant="primary" size="sm" fullWidth className="text-xs">
                        Join Free
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="p-3 space-y-1">
                {drawerLinks.map((item) => {
                  if (item.requiresAuth && !user) return null;
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeDrawer}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400')} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 opacity-60" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    dispatch(logoutUser());
                  }}
                  className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM MOBILE NAVIGATION BAR */}
      <MobileBottomNav onOpenDrawer={openDrawer} />
    </>
  );
}
