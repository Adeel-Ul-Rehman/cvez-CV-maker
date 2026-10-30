'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toastSuccess, toastError } from '@/components/ui/toast';
import { Lock, ShieldCheck, ArrowLeft } from 'lucide-react';

import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Reset token is missing or expired. Please request a new recovery code.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', {
        resetToken: token,
        newPassword,
      });

      toastSuccess('Password updated!', 'You can now sign in with your new password.');
      router.push('/login');
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Failed to reset password. Please try again.';
      setError(msg);
      toastError('Reset failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg border-slate-200 dark:border-slate-800">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold font-display">Set New Password</CardTitle>
        <CardDescription>
          {email ? `Create a secure password for ${email}` : 'Enter your new password below'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<ShieldCheck className="h-4 w-4" />}
          />

          <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
            Update Password
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center flex justify-center"><Spinner size="lg" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
