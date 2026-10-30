import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withLogo?: boolean;
  className?: string;
  label?: string;
}

export function Spinner({ size = 'md', withLogo = false, className, label }: SpinnerProps) {
  if (withLogo) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 gap-4', className)}>
        <Logo size="lg" pulse asLink={false} withText={false} />
        {label && <p className="text-sm font-medium text-slate-500 animate-pulse">{label}</p>}
      </div>
    );
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center justify-center gap-2 text-primary-600', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {label && <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>}
    </div>
  );
}
