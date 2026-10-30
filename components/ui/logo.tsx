'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  pulse?: boolean;
  withText?: boolean;
  className?: string;
  asLink?: boolean;
  href?: string;
}

export function Logo({
  size = 'md',
  pulse = false,
  withText = false,
  className,
  asLink = true,
  href = '/',
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 w-auto',
  };

  const isDark = mounted && resolvedTheme === 'dark';

  const logoImg = (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <img
        src="/logo.png"
        alt="CV Maker Logo"
        className={cn(
          sizeClasses[size],
          'object-contain transition-all duration-200',
          isDark && 'dark:brightness-0 dark:invert',
          pulse && 'animate-pulse-subtle'
        )}
      />
      {withText && (
        <span className="font-display font-bold tracking-tight text-slate-900 dark:text-white flex items-center text-lg md:text-xl">
          CV<span className="text-primary-600 dark:text-primary-400">Maker</span>
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md">
        {logoImg}
      </Link>
    );
  }

  return logoImg;
}
