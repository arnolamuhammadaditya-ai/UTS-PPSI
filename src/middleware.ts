import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — always allow
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/reports') ||
    pathname.startsWith('/api/admin/categories') || // GET categories is public
    pathname === '/' ||
    pathname.startsWith('/laporan') ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  // Protected: warga routes
  if (pathname.startsWith('/warga')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (session.role !== 'warga') return NextResponse.redirect(new URL('/', request.url));
  }

  // Protected: admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (session.role !== 'admin') return NextResponse.redirect(new URL('/', request.url));
  }

  // Protected: petugas routes
  if (pathname.startsWith('/petugas') || pathname.startsWith('/api/officer')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (session.role !== 'petugas') return NextResponse.redirect(new URL('/', request.url));
  }

  // Protected: me routes
  if (pathname.startsWith('/api/me')) {
    if (!session) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

