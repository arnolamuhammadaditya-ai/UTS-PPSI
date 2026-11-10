import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { ReportStatus } from '@prisma/client';

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; }>;
}

export default async function PetugasDashboard({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) return null;
  const user = { nama: session.nama, email: session.email, role: session.role };

  const params = await searchParams;
  const page = parseInt(params.page ?? '1');
  const limit = 10;
  const skip = (page - 1) * limit;
  const statusFilter = params.status as ReportStatus | undefined;

  const where = {
    assignedTo: session.userId,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  let reports: any[] = [];
  let total = 0;
  let counts: any[] = [];

  try {
    const [dbReports, dbTotal, dbCounts] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          judul: true,
          alamat: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { nama: true } },
          user: { select: { nama: true } },
          photos: { where: { jenis: 'awal' }, take: 1, select: { url: true } },
        },
      }),
      prisma.report.count({ where }),
      prisma.report.groupBy({ by: ['status'], where: { assignedTo: session.userId }, _count: { status: true } }),
    ]);
    reports = dbReports;
    total = dbTotal;
    counts = dbCounts;
  } catch (error) {
    console.warn('Prisma query failed in petugas page:', error);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const statusMap = Object.fromEntries(counts.map(c => [c.status, c._count.status]));

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = { ...params, ...overrides };
    const qs = Object.entries(p).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
    return `/petugas${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Panel Petugas</h1>
            <p className="text-gray-500 text-sm mt-1">Halo, {session.nama}! Berikut laporan yang ditugaskan kepada Anda.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Ditugaskan', value: Object.values(statusMap).reduce((a, b) => a + b, 0), color: 'text-primary-500' },
              { label: 'Terverifikasi', value: statusMap['Terverifikasi'] ?? 0, color: 'text-blue-600' },
              { label: 'Diproses', value: statusMap['Diproses'] ?? 0, color: 'text-purple-600' },
              { label: 'Selesai', value: statusMap['Selesai'] ?? 0, color: 'text-green-600' },
            ].map(stat => (
              <div key={stat.label} className="card p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['', 'Terverifikasi', 'Diproses', 'Selesai'] as const).map(s => (
              <Link
                key={s}
                href={buildUrl({ status: s || undefined, page: '1' })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === (s || undefined) || (!statusFilter && !s) ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {s || 'Semua'}
              </Link>
            ))}
          </div>

          {/* Reports */}
          {reports.length === 0 ? (
            <div className="card p-12 text-center">
              <span className="text-5xl mb-4 block">📭</span>
              <p className="text-gray-500">Tidak ada laporan yang ditugaskan kepada Anda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <Link href={`/petugas/laporan/${report.id}`} key={report.id}>
                  <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer flex gap-4">
                    <div className="w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {report.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={report.photos[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📋</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs text-blue-600 font-medium">{report.category.nama}</span>
                        <StatusChip status={report.status} size="sm" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{report.judul}</h3>
                      <p className="text-gray-400 text-xs mt-0.5 truncate">📍 {report.alamat}</p>
                      <p className="text-gray-400 text-xs mt-0.5">Pelapor: {report.user.nama} · {formatDate(report.createdAt)}</p>
                    </div>
                    <div className="flex-shrink-0 self-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="btn-secondary text-sm px-3 py-2">← Sebelumnya</Link>}
              <span className="text-sm text-gray-500">Halaman {page} dari {totalPages}</span>
              {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="btn-secondary text-sm px-3 py-2">Berikutnya →</Link>}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

