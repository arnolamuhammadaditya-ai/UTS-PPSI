'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import { formatDateTime } from '@/lib/utils';
import { ReportStatus } from '@prisma/client';

interface ReportDetail {
  id: string; judul: string; deskripsi: string; alamat: string; lat: number | null; lng: number | null;
  status: ReportStatus; createdAt: string;
  user: { nama: string; };
  category: { nama: string; };
  department: { nama: string; } | null;
  photos: { id: string; url: string; jenis: string; }[];
  updates: { id: string; statusBaru: ReportStatus; statusLama: ReportStatus | null; catatan: string | null; createdAt: string; user: { nama: string; role: string; }; }[];
}

export default function PetugasLaporanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportId, setReportId] = useState('');

  // Form state
  const [status, setStatus] = useState<'Diproses' | 'Selesai'>('Diproses');
  const [catatan, setCatatan] = useState('');
  const [buktiFiles, setBuktiFiles] = useState<File[]>([]);
  const [buktiPreviews, setBuktiPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const user = { nama: '', email: '', role: 'petugas' };

  useEffect(() => {
    params.then(({ id }) => {
      setReportId(id);
      // Fetch report detail via officer endpoint
      fetch(`/api/officer/reports/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) setReport(data.data.report);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [params]);

  const handleBuktiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (buktiFiles.length + files.length > 3) return;
    const invalid = files.filter(f => f.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/jpg'].includes(f.type));
    if (invalid.length > 0) { setSubmitError('File harus JPG/PNG, maks 5 MB'); return; }
    const newFiles = [...buktiFiles, ...files].slice(0, 3);
    setBuktiFiles(newFiles);
    setBuktiPreviews(newFiles.map(f => URL.createObjectURL(f)));
    setSubmitError('');
  };

  const removeBukti = (idx: number) => {
    const newFiles = buktiFiles.filter((_, i) => i !== idx);
    setBuktiFiles(newFiles);
    setBuktiPreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId) return;
    setSubmitting(true); setSubmitError('');

    const formData = new FormData();
    formData.append('status', status);
    if (catatan) formData.append('catatan', catatan);
    buktiFiles.forEach((f, i) => formData.append(`bukti${i + 1}`, f));

    try {
      const res = await fetch(`/api/officer/reports/${reportId}/status`, { method: 'PATCH', body: formData });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error ?? 'Gagal'); return; }
      setSubmitSuccess(true);
      setReport(r => r ? { ...r, status: data.data.report.status } : r);
      setTimeout(() => router.push('/petugas'), 1500);
    } catch { setSubmitError('Terjadi kesalahan'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;
  if (!report) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-gray-500">Laporan tidak ditemukan</p><Link href="/petugas" className="btn-primary">Kembali</Link></div>;

  const canUpdate = report.status === 'Terverifikasi' || report.status === 'Diproses';

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <Link href="/petugas" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{report.judul}</h1>
              </div>
              <StatusChip status={report.status} />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info */}
              <div className="card p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{report.category.nama}</span>
                  <StatusChip status={report.status} />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{report.deskripsi}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-400 text-xs">Pelapor</p><p className="font-medium mt-0.5">{report.user.nama}</p></div>
                  <div><p className="text-gray-400 text-xs">Tanggal Laporan</p><p className="font-medium mt-0.5">{formatDateTime(report.createdAt)}</p></div>
                  <div className="col-span-2"><p className="text-gray-400 text-xs">Alamat</p><p className="font-medium mt-0.5">📍 {report.alamat}</p></div>
                  {report.lat && report.lng && (
                    <div className="col-span-2">
                      <a href={`https://www.google.com/maps?q=${report.lat},${report.lng}`} target="_blank" rel="noopener noreferrer" className="text-primary-500 text-sm hover:underline">
                        🗺️ Lihat di Google Maps ({report.lat.toFixed(5)}, {report.lng.toFixed(5)})
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Photos */}
              {report.photos.filter(p => p.jenis === 'awal').length > 0 && (
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Foto Laporan</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {report.photos.filter(p => p.jenis === 'awal').map(ph => (
                      <a key={ph.id} href={ph.url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ph.url} alt="" className="w-full h-32 object-cover rounded-lg" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Update Status Form */}
              {canUpdate && (
                <div className="card p-6 border-2 border-primary-100">
                  <h2 className="font-semibold text-gray-900 mb-4">Perbarui Status</h2>
                  {submitSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                      ✅ Status berhasil diperbarui! Mengalihkan...
                    </div>
                  )}
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{submitError}</div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="label">Status Baru *</label>
                      <select value={status} onChange={e => setStatus(e.target.value as 'Diproses' | 'Selesai')} className="input-field">
                        <option value="Diproses">Diproses</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Catatan</label>
                      <textarea value={catatan} onChange={e => setCatatan(e.target.value)} className="input-field" rows={3} placeholder="Catatan penanganan atau progress..." maxLength={1000} />
                    </div>
                    <div>
                      <label className="label">Foto Bukti (Opsional, maks 3)</label>
                      {buktiPreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {buktiPreviews.map((src, idx) => (
                            <div key={idx} className="relative group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="" className="w-full h-24 object-cover rounded-lg border-2 border-green-200" />
                              <button type="button" onClick={() => removeBukti(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {buktiFiles.length < 3 && (
                        <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:border-primary-400 transition-colors">
                          <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs text-gray-500">Pilih foto bukti ({buktiFiles.length}/3)</span>
                          <input type="file" accept="image/jpeg,image/png,image/jpg" multiple onChange={handleBuktiChange} className="hidden" />
                        </label>
                      )}
                    </div>
                    <button type="submit" disabled={submitting || submitSuccess} className="btn-primary w-full">
                      {submitting ? 'Memproses...' : `Perbarui Status → ${status}`}
                    </button>
                  </form>
                </div>
              )}

              {!canUpdate && (
                <div className="card p-5 bg-gray-50">
                  <p className="text-gray-500 text-sm text-center">Laporan ini sudah berstatus <strong>{report.status}</strong> dan tidak dapat diperbarui lagi.</p>
                </div>
              )}
            </div>

            {/* Sidebar - Timeline */}
            <div className="space-y-6">
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Riwayat Status</h2>
                <div className="space-y-4">
                  {report.updates.map((update, idx) => (
                    <div key={update.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${idx === report.updates.length - 1 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                        {idx < report.updates.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                      </div>
                      <div className="pb-4">
                        <StatusChip status={update.statusBaru} size="sm" />
                        {update.catatan && <p className="text-gray-600 text-xs mt-1 leading-relaxed">{update.catatan}</p>}
                        <p className="text-gray-400 text-xs mt-1">{update.user.nama} · {formatDateTime(update.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Photos already uploaded */}
              {report.photos.filter(p => p.jenis === 'bukti').length > 0 && (
                <div className="card p-5">
                  <h2 className="font-semibold text-gray-900 mb-3 text-sm">Foto Bukti Terunggah</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {report.photos.filter(p => p.jenis === 'bukti').map(ph => (
                      <a key={ph.id} href={ph.url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ph.url} alt="" className="w-full h-24 object-cover rounded-lg border-2 border-green-200" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

