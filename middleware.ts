import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ACCESS_COOKIE = 'cv_access';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const isAuthenticated = Boolean(token);

  // Exclude API routes, public assets, static files, and _next
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. Public CV route: /cv/public/[slug] NEVER requires authentication
  if (pathname.startsWith('/cv/public/')) {
    return NextResponse.next();
  }

  // 2. Auth routes: /login, /register, /verify-otp, etc.
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/verify-otp' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  if (isAuthRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // 3. Admin routes: require cv_access cookie
  if (pathname.startsWith('/admin') && pathname !== '/admin/login-redirect') {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Protected user app routes: /dashboard, /account, /cv/new, /cv/[id]/*
  const isProtectedAppRoute =
    pathname === '/dashboard' ||
    pathname === '/account' ||
    pathname === '/cv/new' ||
    (pathname.startsWith('/cv/') && !pathname.startsWith('/cv/public/'));

  if (isProtectedAppRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
