'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nama: '', email: '', password: '', noHp: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) setFieldErrors(data.details);
        else setError(data.error ?? 'Registrasi gagal');
        return;
      }

      router.push('/warga/laporan');
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
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Daftar Sebagai Warga</h1>
              <p className="text-gray-500 text-sm mt-1">Bergabung dan laporkan masalah kota Anda</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="input-field"
                  placeholder="Nama lengkap Anda"
                  required
                />
                {fieldErrors.nama && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.nama[0]}</p>
                )}
              </div>
              <div>
                <label className="label">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="email@contoh.com"
                  required
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.email[0]}</p>
                )}
              </div>
              <div>
                <label className="label">Nomor HP</label>
                <input
                  type="tel"
                  value={form.noHp}
                  onChange={(e) => setForm({ ...form, noHp: e.target.value })}
                  className="input-field"
                  placeholder="08xxxxxxxxxx"
                />
                {fieldErrors.noHp && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.noHp[0]}</p>
                )}
              </div>
              <div>
                <label className="label">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  placeholder="Minimal 8 karakter"
                  required
                  autoComplete="new-password"
                />
                {fieldErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.password[0]}</p>
                )}
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
                    Mendaftar...
                  </>
                ) : (
                  'Daftar Sekarang'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-primary-500 font-medium hover:text-primary-700">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

