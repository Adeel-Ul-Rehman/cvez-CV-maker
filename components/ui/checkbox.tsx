import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  helperText?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, helperText, id, checked, ...props }, ref) => {
    const checkId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const descText = description || helperText;

    return (
      <div className="flex items-start space-x-3 text-left">
        <div className="flex items-center h-5">
          <input
            id={checkId}
            ref={ref}
            type="checkbox"
            checked={checked}
            className={cn(
              'h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 focus:ring-offset-0 dark:bg-slate-900 cursor-pointer transition-colors',
              className
            )}
            {...props}
          />
        </div>
        {(label || descText) && (
          <div className="text-sm select-none">
            {label && (
              <label htmlFor={checkId} className="font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                {label}
              </label>
            )}
            {descText && <p className="text-xs text-slate-500 dark:text-slate-400">{descText}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
