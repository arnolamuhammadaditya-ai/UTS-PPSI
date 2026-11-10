'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  user?: {
    nama: string;
    email: string;
    role: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
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
    <header className="bg-primary-500 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            {/* Pemda Logo */}
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow">
              <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
                <circle cx="20" cy="20" r="18" fill="#0B5CAD" />
                <path d="M20 8L24 16H28L22 20L24 28L20 24L16 28L18 20L12 16H16L20 8Z" fill="gold" />
                <path d="M12 30H28" stroke="gold" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            {/* UTI Logo */}
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-primary-500 font-black text-xs leading-none text-center">UTI</span>
              </div>
            </div>
            <Link href="/" className="flex flex-col leading-none">
              <span className="text-white font-bold text-lg leading-tight">SiLapor Kota</span>
              <span className="text-blue-200 text-xs">Portal Pengaduan Warga</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/laporan" className="text-blue-100 hover:text-white text-sm font-medium transition-colors">
              Laporan Publik
            </Link>
            {user ? (
              <>
                {getDashboardLink() && (
                  <Link href={getDashboardLink()!} className="text-blue-100 hover:text-white text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                )}
                <div className="flex items-center gap-3 pl-3 border-l border-blue-400">
                  <div className="text-right">
                    <p className="text-white text-sm font-medium leading-tight">{user.nama}</p>
                    <p className="text-blue-200 text-xs capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Keluar
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-blue-100 hover:text-white text-sm font-medium transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-primary-500 hover:bg-blue-50 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Daftar
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
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

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-blue-400 py-3 space-y-2">
            <Link href="/laporan" className="block text-blue-100 hover:text-white px-2 py-2 text-sm" onClick={() => setMenuOpen(false)}>
              Laporan Publik
            </Link>
            {user ? (
              <>
                {getDashboardLink() && (
                  <Link href={getDashboardLink()!} className="block text-blue-100 hover:text-white px-2 py-2 text-sm" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </Link>
                )}
                <div className="px-2 pt-2 border-t border-blue-400">
                  <p className="text-white text-sm font-medium">{user.nama}</p>
                  <p className="text-blue-200 text-xs capitalize mb-2">{user.role}</p>
                  <button onClick={handleLogout} className="text-white bg-white/10 px-3 py-1.5 rounded-lg text-sm w-full text-left">
                    Keluar
                  </button>
                </div>
              </>
            ) : (
              <div className="px-2 pt-2 border-t border-blue-400 flex gap-2">
                <Link href="/login" className="text-blue-100 hover:text-white px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>
                  Masuk
                </Link>
                <Link href="/register" className="bg-white text-primary-500 px-3 py-2 rounded-lg text-sm font-medium" onClick={() => setMenuOpen(false)}>
                  Daftar
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

