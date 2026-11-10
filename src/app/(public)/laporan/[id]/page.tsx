import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import StarRating from '@/components/ui/StarRating';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { ReportStatus } from '@prisma/client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LaporanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  const user = session ? { nama: session.nama, email: session.email, role: session.role } : null;

  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      judul: true,
      deskripsi: true,
      alamat: true,
      lat: true,
      lng: true,
      status: true,
      alasanTolak: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      category: { select: { id: true, nama: true } },
      department: { select: { id: true, nama: true, kontak: true } },
      user: { select: { nama: true } },
      photos: { select: { id: true, url: true, jenis: true }, orderBy: { createdAt: 'asc' } },
      updates: {
        select: {
          id: true,
          statusLama: true,
          statusBaru: true,
          catatan: true,
          createdAt: true,
          user: { select: { nama: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      rating: { select: { skor: true, komentar: true, createdAt: true } },
    },
  });

  // Public can't see Baru/Ditolak reports
  if (!report || report.status === 'Baru' || report.status === 'Ditolak') {
    notFound();
  }

  const isOwner = session?.userId === report.userId;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-primary-500">Beranda</Link>
            <span>/</span>
            <Link href="/laporan" className="hover:text-primary-500">Laporan Publik</Link>
            <span>/</span>
            <span className="text-gray-700 truncate max-w-xs">{report.judul}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Report Header */}
              <div className="card p-6">
                <div className="flex flex-wrap items-start gap-3 mb-4">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                    {report.category.nama}
                  </span>
                  <StatusChip status={report.status} />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-3">{report.judul}</h1>
                <p className="text-gray-600 leading-relaxed mb-4">{report.deskripsi}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {report.alamat}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDateTime(report.createdAt)}
                  </span>
                  <span>Oleh: {report.user.nama}</span>
                </div>
              </div>

              {/* Photos */}
              {report.photos.filter(p => p.jenis === 'awal').length > 0 && (
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Foto Laporan</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {report.photos.filter(p => p.jenis === 'awal').map((photo) => (
                      <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt="Foto laporan"
                          className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Photos */}
              {report.photos.filter(p => p.jenis === 'bukti').length > 0 && (
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Foto Bukti Penanganan</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {report.photos.filter(p => p.jenis === 'bukti').map((photo) => (
                      <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt="Foto bukti"
                          className="w-full h-40 object-cover rounded-lg border-2 border-green-200 hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating */}
              {report.rating && (
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-3">Penilaian Warga</h2>
                  <div className="flex items-center gap-3">
                    <StarRating value={report.rating.skor} readOnly />
                    <span className="text-gray-900 font-semibold">{report.rating.skor}/5</span>
                  </div>
                  {report.rating.komentar && (
                    <p className="text-gray-600 text-sm mt-3 italic">&ldquo;{report.rating.komentar}&rdquo;</p>
                  )}
                </div>
              )}

              {/* Rating form for owner */}
              {isOwner && report.status === 'Selesai' && !report.rating && (
                <div className="card p-6 border-2 border-primary-100">
                  <h2 className="font-semibold text-gray-900 mb-2">Beri Penilaian</h2>
                  <p className="text-gray-500 text-sm mb-4">Bagaimana kepuasan Anda dengan penanganan laporan ini?</p>
                  <Link
                    href={`/warga/laporan/${report.id}`}
                    className="btn-primary text-sm"
                  >
                    Beri Rating →
                  </Link>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Info Card */}
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Informasi Laporan</h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500 text-xs">Status</dt>
                    <dd className="mt-1"><StatusChip status={report.status} size="sm" /></dd>
                  </div>
                  {report.department && (
                    <div>
                      <dt className="text-gray-500 text-xs">Dinas Penanggung Jawab</dt>
                      <dd className="text-gray-900 font-medium mt-1">{report.department.nama}</dd>
                      {report.department.kontak && (
                        <dd className="text-gray-500 text-xs">{report.department.kontak}</dd>
                      )}
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500 text-xs">Tanggal Laporan</dt>
                    <dd className="text-gray-900 mt-1">{formatDateTime(report.createdAt)}</dd>
                  </div>
                </dl>
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
                        <div className="flex items-center gap-2 mb-1">
                          <StatusChip status={update.statusBaru as ReportStatus} size="sm" />
                        </div>
                        {update.catatan && (
                          <p className="text-gray-600 text-xs leading-relaxed">{update.catatan}</p>
                        )}
                        <p className="text-gray-400 text-xs mt-1">
                          {update.user.nama} · {formatDateTime(update.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map placeholder */}
              {report.lat && report.lng && (
                <div className="card p-5">
                  <h2 className="font-semibold text-gray-900 mb-3 text-sm">Lokasi</h2>
                  <a
                    href={`https://www.google.com/maps?q=${report.lat},${report.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="bg-blue-50 rounded-lg p-4 text-center hover:bg-blue-100 transition-colors">
                      <svg className="w-8 h-8 text-primary-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-xs text-primary-600 font-medium">Lihat di Google Maps</p>
                      <p className="text-xs text-gray-400 mt-1">{report.lat.toFixed(6)}, {report.lng.toFixed(6)}</p>
                    </div>
                  </a>
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

