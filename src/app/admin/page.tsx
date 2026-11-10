import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { ReportStatus } from '@prisma/client';

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) return null;

  const user = { nama: session.nama, email: session.email, role: session.role };

  const [totalReports, byStatus, recentReports, totalUsers, avgRating] = await Promise.all([
    prisma.report.count(),
    prisma.report.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.report.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        judul: true,
        status: true,
        createdAt: true,
        category: { select: { nama: true } },
        user: { select: { nama: true } },
        department: { select: { nama: true } },
      },
    }),
    prisma.user.count(),
    prisma.rating.aggregate({ _avg: { skor: true }, _count: { skor: true } }),
  ]);

  const statusMap = Object.fromEntries(byStatus.map(s => [s.status, s._count.status]));

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 bg-white border-r flex-col">
          <div className="p-4 border-b">
            <p className="font-semibold text-gray-900 text-sm">Dashboard Admin</p>
            <p className="text-gray-500 text-xs">{session.nama}</p>
          </div>
          <nav className="p-3 space-y-1 flex-1">
            {[
              { href: '/admin', label: 'Dashboard', icon: '📊' },
              { href: '/admin/laporan', label: 'Semua Laporan', icon: '📋' },
              { href: '/admin/kategori', label: 'Kategori', icon: '🏷️' },
              { href: '/admin/dinas', label: 'Dinas', icon: '🏢' },
              { href: '/admin/pengguna', label: 'Pengguna', icon: '👥' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card p-5">
                <p className="text-3xl font-bold text-primary-500">{totalReports}</p>
                <p className="text-gray-500 text-sm mt-1">Total Laporan</p>
              </div>
              <div className="card p-5">
                <p className="text-3xl font-bold text-yellow-600">{statusMap['Baru'] ?? 0}</p>
                <p className="text-gray-500 text-sm mt-1">Baru (Perlu Verifikasi)</p>
              </div>
              <div className="card p-5">
                <p className="text-3xl font-bold text-green-600">{statusMap['Selesai'] ?? 0}</p>
                <p className="text-gray-500 text-sm mt-1">Selesai</p>
              </div>
              <div className="card p-5">
                <p className="text-3xl font-bold text-purple-600">{statusMap['Diproses'] ?? 0}</p>
                <p className="text-gray-500 text-sm mt-1">Sedang Diproses</p>
              </div>
            </div>

            {/* More Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card p-5">
                <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
                <p className="text-gray-500 text-sm mt-1">Total Pengguna</p>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-yellow-500">
                    {avgRating._avg.skor?.toFixed(1) ?? 'N/A'}
                  </span>
                  <span className="text-yellow-400 text-xl">★</span>
                </div>
                <p className="text-gray-500 text-sm mt-1">Rata-rata Rating ({avgRating._count.skor} penilaian)</p>
              </div>
              <div className="card p-5">
                <p className="text-2xl font-bold text-red-600">{statusMap['Ditolak'] ?? 0}</p>
                <p className="text-gray-500 text-sm mt-1">Laporan Ditolak</p>
              </div>
            </div>

            {/* Status Overview */}
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Distribusi Status Laporan</h2>
              <div className="space-y-3">
                {[
                  { status: 'Baru' as ReportStatus, color: 'bg-yellow-400' },
                  { status: 'Terverifikasi' as ReportStatus, color: 'bg-blue-400' },
                  { status: 'Diproses' as ReportStatus, color: 'bg-purple-400' },
                  { status: 'Selesai' as ReportStatus, color: 'bg-green-400' },
                  { status: 'Ditolak' as ReportStatus, color: 'bg-red-400' },
                ].map(({ status, color }) => {
                  const count = statusMap[status] ?? 0;
                  const pct = totalReports > 0 ? (count / totalReports) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <StatusChip status={status} size="sm" />
                        <span className="text-gray-600 font-medium">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Reports */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="font-semibold text-gray-900">Laporan Terkini</h2>
                <Link href="/admin/laporan" className="text-primary-500 hover:text-primary-700 text-sm font-medium">
                  Lihat Semua →
                </Link>
              </div>
              <div className="divide-y">
                {recentReports.map((report) => (
                  <Link href={`/admin/laporan/${report.id}`} key={report.id}>
                    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{report.judul}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{report.category.nama}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-500">{report.user.nama}</span>
                          {report.department && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="text-xs text-gray-500">{report.department.nama}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <StatusChip status={report.status} size="sm" />
                        <span className="text-xs text-gray-400">{formatDate(report.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

