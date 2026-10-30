'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { fetchMe } from '@/store/slices/authSlice';

export function AuthInitializer() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  useEffect(() => {
    // Avoid calling /api/auth/me on unauthenticated auth forms to prevent red 401 logs
    const isAuthPage =
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/verify-otp' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password';

    if (!isAuthPage) {
      dispatch(fetchMe());
    }
  }, [dispatch, pathname]);

  return null;
}
