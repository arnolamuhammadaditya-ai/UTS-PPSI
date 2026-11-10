'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  nama: string;
  email: string;
  role: string;
}

interface HeaderProps {
  /** Optional pre-loaded user (e.g. passed from a parent). If omitted, Header fetches from /api/auth/me. */
  user?: UserInfo | null;
}

export default function Header({ user: initialUser }: HeaderProps = {}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(initialUser ?? null);
  const router = useRouter();

  useEffect(() => {
    // Only fetch if no initial user was provided
    if (initialUser !== undefined) return;
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && data?.data?.user) {
          setUser(data.data.user);
        }
      })
      .catch(() => {/* not logged in */});
  }, [initialUser]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const getDashboardLink = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin': return '/admin';
      case 'petugas': return '/petugas';
      case 'warga': return '/warga/laporan';
      default: return null;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            {/* Logo Pemda */}
            <div className="border border-dashed border-gray-400 rounded px-2 py-1 text-[10px] font-semibold tracking-wider text-gray-600 leading-tight text-center">
              LOGO<br />PEMDA
            </div>
            {/* Logo UTI */}
            <div className="border border-dashed border-gray-400 rounded px-2 py-1 text-[10px] font-semibold tracking-wider text-gray-600 leading-tight text-center">
              LOGO<br />UTI
            </div>
            <Link href="/" className="font-bold text-lg text-gray-900 tracking-tight ml-1">
              SiLapor Kota
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/laporan"
              className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >
              Laporan
            </Link>
            <Link
              href="/peta"
              className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >
              Peta
            </Link>

            {user ? (
              <div className="flex items-center gap-4 pl-2">
                {getDashboardLink() && (
                  <Link
                    href={getDashboardLink()!}
                    className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
                  >
                    Dashboard ({user.role})
                  </Link>
                )}
                <span className="text-gray-300">|</span>
                <span className="text-gray-700 text-sm font-medium">{user.nama}</span>
                <button
                  onClick={handleLogout}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="border border-gray-400 hover:border-gray-600 text-gray-800 px-4 py-1.5 rounded text-sm font-medium transition-colors"
              >
                Masuk
              </Link>
            )}
          </nav>

          {/* Mobile menu hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 space-y-2">
            <Link
              href="/laporan"
              onClick={() => setMenuOpen(false)}
              className="block text-primary-500 px-2 py-1 font-medium"
            >
              Laporan
            </Link>
            <Link
              href="/peta"
              onClick={() => setMenuOpen(false)}
              className="block text-primary-500 px-2 py-1 font-medium"
            >
              Peta
            </Link>
            {user ? (
              <>
                {getDashboardLink() && (
                  <Link
                    href={getDashboardLink()!}
                    onClick={() => setMenuOpen(false)}
                    className="block text-gray-700 px-2 py-1 font-medium"
                  >
                    Dashboard ({user.role})
                  </Link>
                )}
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center px-2">
                  <span className="text-sm font-medium text-gray-700">{user.nama}</span>
                  <button
                    onClick={handleLogout}
                    className="border border-gray-300 text-xs px-2.5 py-1 rounded"
                  >
                    Keluar
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 border-t border-gray-100 px-2">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center border border-gray-400 py-1.5 rounded text-sm font-medium text-gray-800"
                >
                  Masuk
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
