'use client';

import React from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isDanger?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant,
  isDanger = true,
  loading = false,
}: ConfirmDialogProps) {
  const isDangerAction = variant ? variant === 'danger' : isDanger;
  const isWarningAction = variant === 'warning';
  const descText = description || message;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" showCloseButton={!loading}>
      <div className="flex flex-col items-center text-center p-2">
        {isDangerAction && (
          <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
        )}
        {isWarningAction && (
          <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
        )}
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
        {descText && <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{descText}</p>}
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={loading} fullWidth>
            {cancelLabel}
          </Button>
          <Button
            variant={isDangerAction ? 'danger' : isWarningAction ? 'primary' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            fullWidth
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
