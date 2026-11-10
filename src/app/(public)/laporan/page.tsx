import Link from 'next/link';
import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ReportStatus } from '@prisma/client';
import { formatDate } from '@/lib/utils';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    categoryId?: string;
    q?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function LaporanPublikPage({ searchParams }: PageProps) {
  const session = await getSession();
  const user = session ? { nama: session.nama, email: session.email, role: session.role } : null;
  
  const params = await searchParams;
  const page = parseInt(params.page ?? '1');
  const limit = 10;
  const skip = (page - 1) * limit;

  const statusFilter = params.status as ReportStatus | undefined;
  const categoryId = params.categoryId;
  const q = params.q;

  const where = {
    status: statusFilter
      ? { equals: statusFilter }
      : { in: ['Terverifikasi', 'Diproses', 'Selesai'] as ReportStatus[] },
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { judul: { contains: q, mode: 'insensitive' as const } } : {}),
  };

  let reports: any[] = [];
  let total = 0;
  let categories: any[] = [];

  try {
    const [dbReports, dbTotal, dbCategories] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          judul: true,
          deskripsi: true,
          alamat: true,
          status: true,
          createdAt: true,
          category: { select: { id: true, nama: true } },
          department: { select: { nama: true } },
          user: { select: { nama: true } },
          photos: { where: { jenis: 'awal' }, take: 1, select: { url: true } },
        },
      }),
      prisma.report.count({ where }),
      prisma.category.findMany({ orderBy: { nama: 'asc' } }),
    ]);
    reports = dbReports;
    total = dbTotal;
    categories = dbCategories;
  } catch {
    // fallback when database not yet connected
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = { ...params, ...overrides };
    const qs = Object.entries(p)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join('&');
    return `/laporan${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Laporan Publik</h1>
            <p className="text-gray-500 text-sm mt-1">
              {total} laporan ditemukan
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="card p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Filter Laporan</h2>
                <form method="GET" action="/laporan" className="space-y-4">
                  {/* Search */}
                  <div>
                    <label className="label text-xs">Cari Judul</label>
                    <input
                      name="q"
                      type="text"
                      defaultValue={q}
                      className="input-field text-sm"
                      placeholder="Kata kunci..."
                    />
                  </div>
                  {/* Category */}
                  <div>
                    <label className="label text-xs">Kategori</label>
                    <select name="categoryId" defaultValue={categoryId} className="input-field text-sm">
                      <option value="">Semua Kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nama}</option>
                      ))}
                    </select>
                  </div>
                  {/* Status */}
                  <div>
                    <label className="label text-xs">Status</label>
                    <select name="status" defaultValue={statusFilter} className="input-field text-sm">
                      <option value="">Semua Status</option>
                      <option value="Terverifikasi">Terverifikasi</option>
                      <option value="Diproses">Diproses</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary w-full text-sm">
                    Terapkan Filter
                  </button>
                  <Link href="/laporan" className="btn-secondary w-full text-sm text-center block">
                    Reset
                  </Link>
                </form>
              </div>
            </aside>

            {/* Report List */}
            <div className="flex-1">
              {reports.length === 0 ? (
                <div className="card p-12 text-center">
                  <span className="text-5xl mb-4 block">📭</span>
                  <p className="text-gray-500">Tidak ada laporan yang ditemukan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Link href={`/laporan/${report.id}`} key={report.id}>
                      <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer flex gap-4">
                        {/* Thumbnail */}
                        <div className="w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {report.photos[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={report.photos[0].url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">📋</div>
                          )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              {report.category.nama}
                            </span>
                            <StatusChip status={report.status} size="sm" />
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                            {report.judul}
                          </h3>
                          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{report.deskripsi}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {report.alamat}
                            </span>
                            <span>{formatDate(report.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {page > 1 && (
                    <Link href={buildUrl({ page: String(page - 1) })} className="btn-secondary px-3 py-2 text-sm">
                      ← Sebelumnya
                    </Link>
                  )}
                  <span className="text-sm text-gray-500">
                    Halaman {page} dari {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={buildUrl({ page: String(page + 1) })} className="btn-secondary px-3 py-2 text-sm">
                      Berikutnya →
                    </Link>
                  )}
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

