'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Login gagal');
        return;
      }

      const role = data.data?.user?.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'petugas') router.push('/petugas');
      else router.push('/warga/laporan');
      
      router.refresh();
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header minimal */}
      <header className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-lampung.png"
              alt="Logo Pemda Lampung"
              className="h-9 w-auto max-w-[36px] object-contain"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-teknokrat.png"
              alt="Logo UTI"
              className="h-9 w-auto max-w-[36px] object-contain"
            />
            <span className="text-gray-900 font-bold text-lg ml-1">SiLapor Kota</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Masuk ke Akun</h1>
              <p className="text-gray-500 text-sm mt-1">Portal Pengaduan Warga SiLapor Kota</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="email@contoh.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Belum punya akun?{' '}
              <Link href="/register" className="text-primary-500 font-medium hover:text-primary-700">
                Daftar sebagai warga
              </Link>
            </p>

            {/* Quick Demo Accounts Fill */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 text-center">
                Akun Demo Pengujian (Klik untuk Isi):
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ email: 'admin@silaporkota.go.id', password: 'admin123' })}
                  className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 py-2 px-2 rounded-lg border border-purple-200 transition-colors font-medium text-center flex flex-col items-center gap-0.5"
                >
                  <span className="text-sm">👑</span>
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ email: 'petugas@silaporkota.go.id', password: 'petugas123' })}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-2 rounded-lg border border-blue-200 transition-colors font-medium text-center flex flex-col items-center gap-0.5"
                >
                  <span className="text-sm">👷</span>
                  <span>Petugas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ email: 'warga@example.com', password: 'warga123' })}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-700 py-2 px-2 rounded-lg border border-green-200 transition-colors font-medium text-center flex flex-col items-center gap-0.5"
                >
                  <span className="text-sm">👤</span>
                  <span>Warga</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

