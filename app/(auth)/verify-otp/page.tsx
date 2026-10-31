'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { fetchMe } from '@/store/slices/authSlice';
import { api, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toastSuccess, toastError, toastInfo } from '@/components/ui/toast';
import { KeyRound, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const email = searchParams.get('email') || '';
  const purpose = searchParams.get('purpose') || 'email_verify';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [shaking, setShaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().slice(0, 6);
    if (/^\d+$/.test(pasted)) {
      const newDigits = pasted.split('').concat(Array(6 - pasted.length).fill(''));
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.post<{ resetToken?: string }>('/api/auth/verify-otp', {
        email,
        code,
        purpose,
      });

      if (purpose === 'password_reset') {
        toastSuccess('Code verified', 'Please enter your new password.');
        router.push(
          `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(
            data?.resetToken || ''
          )}`
        );
      } else {
        toastSuccess('Email verified!', 'Your account is ready.');

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('temp_reg_auth');
        }

        const meAction = await dispatch(fetchMe());
        const user = meAction.payload as any;
        if (user?.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Invalid verification code. Please try again.';
      setError(msg);
      triggerShake();
      toastError('Verification failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError(null);

    try {
      await api.post('/api/auth/resend-otp', { email, purpose });
      toastInfo('New code sent', 'Check your email inbox.');
      setCountdown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toastError('Failed to resend', err?.message || 'Please wait before requesting again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full shadow-lg border-slate-200 dark:border-slate-800">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold font-display">Verify Your Code</CardTitle>
        <CardDescription>
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{email || 'your email'}</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={cn('flex justify-center gap-2 sm:gap-3', shaking && 'animate-shake')}
            onPaste={handlePaste}
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`Digit ${i + 1}`}
                className="h-12 w-11 sm:h-14 sm:w-12 text-center text-xl font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-xs"
              />
            ))}
          </div>

          <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
            Verify Code
          </Button>

          <div className="flex items-center justify-center text-xs text-slate-500 pt-2">
            {countdown > 0 ? (
              <span>Resend available in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', resending && 'animate-spin')} />
                <span>Resend verification code</span>
              </button>
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        Entered the wrong email?{' '}
        <Link href="/register" className="ml-1 text-primary-600 dark:text-primary-400 font-semibold hover:underline">
          Start over
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center flex justify-center"><Spinner size="lg" /></div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
