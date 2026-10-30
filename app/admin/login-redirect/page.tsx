'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Spinner } from '@/components/ui/spinner';

export default function AdminLoginRedirectPage() {
  const router = useRouter();
  const { user, initialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (initialized) {
      if (user?.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, initialized, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 space-y-4">
      <Spinner size="lg" className="text-primary-500" />
      <p className="text-sm font-medium text-slate-400">Verifying administrative credentials...</p>
    </div>
  );
}
