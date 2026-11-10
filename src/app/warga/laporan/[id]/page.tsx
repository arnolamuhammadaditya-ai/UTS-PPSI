'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import StarRating from '@/components/ui/StarRating';
import { formatDateTime } from '@/lib/utils';
import { ReportStatus } from '@prisma/client';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ReportDetail {
  id: string;
  judul: string;
  deskripsi: string;
  alamat: string;
  lat: number | null;
  lng: number | null;
  status: ReportStatus;
  alasanTolak: string | null;
  createdAt: string;
  category: { nama: string };
  department: { nama: string; kontak?: string } | null;
  assignedUser: { nama: string } | null;
  photos: { id: string; url: string; jenis: string }[];
  updates: {
    id: string;
    statusBaru: ReportStatus;
    catatan: string | null;
    createdAt: string;
    user: { nama: string; role: string };
  }[];
  rating: { skor: number; komentar: string | null } | null;
}

export default function WargaLaporanDetailPage({ params }: PageProps) {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState({ skor: 0, komentar: '' });
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [ratingError, setRatingError] = useState('');

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/me/reports/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) setReport(data.data.report);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [params]);

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || rating.skor === 0) return;
    setRatingSubmitting(true);
    setRatingError('');

    try {
      const res = await fetch(`/api/reports/${report.id}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rating),
      });
      const data = await res.json();
      if (!res.ok) {
        setRatingError(data.error ?? 'Gagal mengirim rating');
      } else {
        setRatingSuccess(true);
        setReport(r => r ? { ...r, rating: { skor: rating.skor, komentar: rating.komentar } } : r);
      }
    } catch {
      setRatingError('Terjadi kesalahan');
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Laporan tidak ditemukan</p>
        <Link href="/warga/laporan" className="btn-primary">Kembali</Link>
      </div>
    );
  }

  const user = { nama: '', email: '', role: 'warga' };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <Link href="/warga/laporan" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900 truncate">{report.judul}</h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                    {report.category.nama}
                  </span>
                  <StatusChip status={report.status} />
                </div>
                <h2 className="font-bold text-gray-900 mb-2">{report.judul}</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{report.deskripsi}</p>
                <div className="text-sm text-gray-500">
                  <p>📍 {report.alamat}</p>
                  <p className="mt-1">📅 {formatDateTime(report.createdAt)}</p>
                </div>
                {report.status === 'Ditolak' && report.alasanTolak && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm font-medium">Alasan Penolakan:</p>
                    <p className="text-red-600 text-sm mt-1">{report.alasanTolak}</p>
                  </div>
                )}
              </div>

              {/* Photos */}
              {report.photos.filter(p => p.jenis === 'awal').length > 0 && (
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Foto Laporan</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {report.photos.filter(p => p.jenis === 'awal').map(photo => (
                      <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt="" className="w-full h-32 object-cover rounded-lg" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence */}
              {report.photos.filter(p => p.jenis === 'bukti').length > 0 && (
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Foto Bukti Penanganan</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {report.photos.filter(p => p.jenis === 'bukti').map(photo => (
                      <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt="" className="w-full h-32 object-cover rounded-lg border-2 border-green-200" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating Form */}
              {report.status === 'Selesai' && !report.rating && !ratingSuccess && (
                <div className="card p-6 border-2 border-primary-100">
                  <h2 className="font-semibold text-gray-900 mb-1">Beri Penilaian</h2>
                  <p className="text-gray-500 text-sm mb-4">Bagaimana kepuasan Anda dengan penanganan laporan ini?</p>
                  {ratingError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
                      {ratingError}
                    </div>
                  )}
                  <form onSubmit={handleRatingSubmit} className="space-y-4">
                    <div>
                      <label className="label">Rating</label>
                      <StarRating value={rating.skor} onChange={v => setRating(r => ({...r, skor: v}))} size="lg" />
                    </div>
                    <div>
                      <label className="label">Komentar (Opsional)</label>
                      <textarea
                        value={rating.komentar}
                        onChange={e => setRating(r => ({...r, komentar: e.target.value}))}
                        className="input-field"
                        placeholder="Ceritakan pengalaman Anda..."
                        maxLength={500}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={ratingSubmitting || rating.skor === 0}
                      className="btn-primary"
                    >
                      {ratingSubmitting ? 'Mengirim...' : 'Kirim Penilaian'}
                    </button>
                  </form>
                </div>
              )}

              {/* Rating Display */}
              {report.rating && (
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-3">Penilaian Anda</h2>
                  <div className="flex items-center gap-3">
                    <StarRating value={report.rating.skor} readOnly size="lg" />
                    <span className="font-bold text-gray-900">{report.rating.skor}/5</span>
                  </div>
                  {report.rating.komentar && (
                    <p className="text-gray-600 text-sm mt-3 italic">&ldquo;{report.rating.komentar}&rdquo;</p>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Info */}
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Status & Info</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Status Saat Ini</p>
                    <div className="mt-1"><StatusChip status={report.status} size="sm" /></div>
                  </div>
                  {report.department && (
                    <div>
                      <p className="text-gray-500 text-xs">Dinas Penanggung Jawab</p>
                      <p className="text-gray-900 font-medium mt-1">{report.department.nama}</p>
                    </div>
                  )}
                  {report.assignedUser && (
                    <div>
                      <p className="text-gray-500 text-xs">Petugas yang Ditugaskan</p>
                      <p className="text-gray-900 mt-1">{report.assignedUser.nama}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Riwayat Status</h2>
                <div className="space-y-4">
                  {report.updates.map((update, idx) => (
                    <div key={update.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${
                          idx === report.updates.length - 1 ? 'bg-primary-500' : 'bg-gray-300'
                        }`} />
                        {idx < report.updates.length - 1 && (
                          <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <StatusChip status={update.statusBaru} size="sm" />
                        {update.catatan && (
                          <p className="text-gray-600 text-xs mt-1">{update.catatan}</p>
                        )}
                        <p className="text-gray-400 text-xs mt-1">
                          {update.user.nama} · {formatDateTime(update.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

