import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export default async function WargaLaporanPage() {
  const session = await getSession();
  if (!session) return null;
  
  const user = { nama: session.nama, email: session.email, role: session.role };

  let reports: any[] = [];
  let counts: any[] = [];

  try {
    const [dbReports, dbCounts] = await Promise.all([
      prisma.report.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          judul: true,
          alamat: true,
          status: true,
          alasanTolak: true,
          createdAt: true,
          category: { select: { nama: true } },
          photos: { where: { jenis: 'awal' }, take: 1, select: { url: true } },
          rating: { select: { skor: true } },
        },
      }),
      prisma.report.groupBy({
        by: ['status'],
        where: { userId: session.userId },
        _count: { status: true },
      }),
    ]);
    reports = dbReports;
    counts = dbCounts;
  } catch (error) {
    console.warn('Prisma query failed in warga laporan page:', error);
  }

  const totalReports = counts.reduce((acc, c) => acc + c._count.status, 0);
  const selesaiCount = counts.find(c => c.status === 'Selesai')?._count.status ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Laporan Saya</h1>
                <p className="text-gray-500 text-sm mt-1">Halo, {session.nama}!</p>
              </div>
              <Link href="/warga/laporan/buat" className="btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Buat Laporan
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Laporan', value: totalReports, color: 'text-gray-900' },
              { label: 'Selesai', value: selesaiCount, color: 'text-green-600' },
              { label: 'Diproses', value: counts.find(c => c.status === 'Diproses')?._count.status ?? 0, color: 'text-purple-600' },
              { label: 'Menunggu', value: counts.find(c => c.status === 'Baru')?._count.status ?? 0, color: 'text-yellow-600' },
            ].map((stat) => (
              <div key={stat.label} className="card p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Reports List */}
          {reports.length === 0 ? (
            <div className="card p-12 text-center">
              <span className="text-5xl mb-4 block">📋</span>
              <h2 className="font-semibold text-gray-900 mb-2">Belum Ada Laporan</h2>
              <p className="text-gray-500 text-sm mb-6">
                Anda belum pernah membuat laporan. Yuk laporkan masalah di sekitar Anda!
              </p>
              <Link href="/warga/laporan/buat" className="btn-primary">
                Buat Laporan Pertama
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Link href={`/warga/laporan/${report.id}`} key={report.id}>
                  <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer flex gap-4">
                    <div className="w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {report.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={report.photos[0].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📋</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs text-blue-600 font-medium">{report.category.nama}</span>
                        <StatusChip status={report.status} size="sm" />
                        {report.rating && (
                          <span className="text-xs text-yellow-600">⭐ {report.rating.skor}/5</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{report.judul}</h3>
                      <p className="text-gray-400 text-xs mt-1 flex items-center gap-1 truncate">
                        📍 {report.alamat}
                      </p>
                      {report.status === 'Ditolak' && report.alasanTolak && (
                        <p className="text-red-500 text-xs mt-1">Alasan: {report.alasanTolak}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">{formatDate(report.createdAt)}</p>
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

