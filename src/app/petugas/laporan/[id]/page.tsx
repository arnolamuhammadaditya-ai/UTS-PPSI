'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import { ReportStatus } from '@prisma/client';

interface ReportDetail {
  id: string;
  judul: string;
  deskripsi: string;
  alamat: string;
  status: ReportStatus;
  createdAt: string;
  category: { nama: string };
  photos: { id: string; url: string; jenis: string }[];
}

export default function PetugasTugasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportId, setReportId] = useState('');

  // Form State matching Page 4
  const [status, setStatus] = useState<'Diproses' | 'Selesai'>('Diproses');
  const [catatan, setCatatan] = useState('');
  const [buktiFiles, setBuktiFiles] = useState<File[]>([]);
  const [buktiPreviews, setBuktiPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setReportId(id);
      fetch(`/api/officer/reports/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setReport(data.data.report);
            if (data.data.report.status === 'Selesai') {
              setStatus('Selesai');
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [params]);

  const handleBuktiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (buktiFiles.length + files.length > 3) {
      setError('Maksimal 3 foto bukti');
      return;
    }
    const invalid = files.filter(
      (f) =>
        f.size > 5 * 1024 * 1024 ||
        !['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)
    );
    if (invalid.length > 0) {
      setError('File harus JPG/PNG, maksimal 5 MB');
      return;
    }
    const newFiles = [...buktiFiles, ...files].slice(0, 3);
    setBuktiFiles(newFiles);
    setBuktiPreviews(newFiles.map((f) => URL.createObjectURL(f)));
    setError('');
  };

  const removeBukti = (idx: number) => {
    const newFiles = buktiFiles.filter((_, i) => i !== idx);
    setBuktiFiles(newFiles);
    setBuktiPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId) return;
    setSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('status', status);
    if (catatan) formData.append('catatan', catatan);
    buktiFiles.forEach((f, i) => formData.append(`bukti${i + 1}`, f));

    try {
      const res = await fetch(`/api/officer/reports/${reportId}/status`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal memperbarui status');
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push('/petugas');
        router.refresh();
      }, 1200);
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B5CAD]" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 p-4">
        <p className="text-gray-500">Laporan tidak ditemukan atau tidak ditugaskan ke Anda.</p>
        <Link
          href="/petugas"
          className="bg-[#0B5CAD] text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Kembali ke Tugas
        </Link>
      </div>
    );
  }

  const initialPhoto = report.photos.find((p) => p.jenis === 'awal')?.url;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex justify-center py-6 px-4">
        <div className="w-full max-w-md">
          {/* Back link */}
          <Link
            href="/petugas"
            className="inline-flex items-center gap-1 text-sm text-[#0B5CAD] hover:underline mb-4 font-medium"
          >
            &larr; Kembali ke Tugas
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-5">
            Tugas Saya
          </h1>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
              &#10003; Pembaruan berhasil disimpan! Kembali ke daftar tugas...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Report Card (Exact Page 4 Layout) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="font-bold text-gray-900 text-lg leading-snug">
                {report.judul}
              </h2>
              <StatusChip status={report.status} size="sm" />
            </div>

            <p className="text-xs text-gray-500 mb-4">
              <span>{report.category.nama}</span>
              {' · '}
              <span>{report.alamat}</span>
            </p>

            {/* Photo box */}
            <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mb-2 flex items-center justify-center">
              {initialPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={initialPhoto}
                  alt={report.judul}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">[Foto laporan]</span>
              )}
            </div>

            <p className="text-xs text-gray-600 mt-2 line-clamp-3">
              {report.deskripsi}
            </p>
          </div>

          {/* Form Actions */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ubah status */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Ubah status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Diproses' | 'Selesai')}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5CAD]/30 focus:border-[#0B5CAD]"
              >
                <option value="Diproses">Diproses</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            {/* Catatan penanganan */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Catatan penanganan
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#0B5CAD]/30 focus:border-[#0B5CAD]"
                placeholder="Tuliskan catatan progres atau bukti penanganan..."
                maxLength={1000}
              />
            </div>

            {/* Unggah foto bukti */}
            <div>
              {buktiPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {buktiPreviews.map((src, idx) => (
                    <div key={idx} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Bukti ${idx + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-green-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeBukti(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {buktiFiles.length < 3 && (
                <label className="w-full border border-dashed border-[#0B5CAD] rounded-lg py-3.5 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 transition-colors">
                  <span className="text-sm font-medium text-[#0B5CAD]">
                    Unggah foto bukti
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    ({buktiFiles.length}/3 foto terpilih)
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    multiple
                    onChange={handleBuktiChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Simpan Pembaruan button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || success}
                className="w-full bg-[#0B5CAD] hover:bg-[#094d92] disabled:opacity-50 text-white font-medium py-3 rounded-lg text-base shadow-sm transition-colors"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Pembaruan'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
