'use client';

import React from 'react';
import { LucideIcon, FileText } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: IconOrElement = FileText,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className,
  children,
}: EmptyStateProps) {
  const isComponent = typeof IconOrElement === 'function' || (typeof IconOrElement === 'object' && IconOrElement !== null && 'render' in (IconOrElement as any));

  const finalActionLabel = action?.label || actionLabel;
  const finalOnAction = action?.onClick || onAction;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 my-4',
        className
      )}
    >
      <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
        {isComponent ? (
          // @ts-ignore
          <IconOrElement className="h-8 w-8 stroke-[1.5]" />
        ) : (
          (IconOrElement as React.ReactNode)
        )}
      </div>
      <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
      {finalActionLabel && finalOnAction && (
        <Button variant="primary" onClick={finalOnAction}>
          {finalActionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
