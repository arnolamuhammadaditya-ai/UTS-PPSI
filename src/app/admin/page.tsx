import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ReportStatus } from '@prisma/client';

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { view } = await searchParams;
  const currentView = view || 'ringkasan';

  // Filter based on selected sidebar view if needed
  const statusFilter =
    currentView === 'verifikasi'
      ? 'Baru'
      : currentView === 'disposisi'
      ? 'Terverifikasi'
      : undefined;

  let byStatus: any[] = [];
  let reports: any[] = [];

  try {
    const [dbByStatus, dbReports] = await Promise.all([
      prisma.report.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.report.findMany({
        where: statusFilter ? { status: statusFilter } : {},
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          judul: true,
          status: true,
          createdAt: true,
          category: { select: { nama: true } },
        },
      }),
    ]);
    byStatus = dbByStatus;
    reports = dbReports;
  } catch {
    // fallback when database not yet connected
  }

  const statusMap = Object.fromEntries(
    byStatus.map((s) => [s.status, s._count.status])
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1">
        {/* Left Dark Sidebar (Exact match with Page 3 in PDF) */}
        <aside className="w-56 bg-[#111827] text-white flex-shrink-0 flex flex-col min-h-screen">
          {/* Logo Section */}
          <Link href="/" className="p-4 flex items-center gap-2 border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-lampung.png"
              alt="Logo Pemda Lampung"
              className="h-7 w-auto max-w-[32px] object-contain"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-teknokrat.png"
              alt="Logo Universitas Teknokrat Indonesia"
              className="h-7 w-auto max-w-[32px] object-contain"
            />
            <span className="font-bold text-sm tracking-tight ml-1 text-white">
              SiLapor
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 flex-1">
            <Link
              href="/admin?view=ringkasan"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'ringkasan'
                  ? 'bg-[#0B5CAD] text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Ringkasan
            </Link>

            <Link
              href="/admin?view=verifikasi"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'verifikasi'
                  ? 'bg-[#0B5CAD] text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Verifikasi laporan
            </Link>

            <Link
              href="/admin?view=disposisi"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'disposisi'
                  ? 'bg-[#0B5CAD] text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Disposisi
            </Link>

            <Link
              href="/admin/kategori"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Data master
            </Link>

            <Link
              href="/admin/pengguna"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Pengguna
            </Link>
          </nav>

          {/* Bottom user logout */}
          <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
            <p className="font-medium text-white truncate">{session.nama}</p>
            <p className="text-[11px] text-gray-400 capitalize mb-2">{session.role}</p>
            <Link
              href="/"
              className="text-[#5090D0] hover:underline block text-[11px]"
            >
              &larr; Lihat Portal Publik
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-x-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Dashboard Admin
          </h1>

          {/* 4 Stat Cards: Baru, Terverifikasi, Diproses, Selesai */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {statusMap['Baru'] ?? 0}
              </p>
              <p className="text-sm font-medium text-gray-500">Baru</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-3xl font-bold text-[#0B5CAD] mb-1">
                {statusMap['Terverifikasi'] ?? 0}
              </p>
              <p className="text-sm font-medium text-gray-500">Terverifikasi</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-3xl font-bold text-purple-600 mb-1">
                {statusMap['Diproses'] ?? 0}
              </p>
              <p className="text-sm font-medium text-gray-500">Diproses</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-3xl font-bold text-green-600 mb-1">
                {statusMap['Selesai'] ?? 0}
              </p>
              <p className="text-sm font-medium text-gray-500">Selesai</p>
            </div>
          </div>

          {/* Table matching Page 3: ID | Judul | Kategori | Status | Aksi */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Judul</th>
                    <th className="px-5 py-3.5">Kategori</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                        Tidak ada laporan pada kategori ini.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50/70">
                        <td className="px-5 py-4 font-mono text-xs text-gray-500">
                          #{report.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-900 max-w-xs truncate">
                          {report.judul}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {report.category.nama}
                        </td>
                        <td className="px-5 py-4">
                          <StatusChip status={report.status as ReportStatus} size="sm" />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {report.status === 'Baru' && (
                              <>
                                <Link
                                  href={`/admin/laporan/${report.id}`}
                                  className="border border-[#0B5CAD] text-[#0B5CAD] hover:bg-blue-50 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                >
                                  Verifikasi
                                </Link>
                                <Link
                                  href={`/admin/laporan/${report.id}`}
                                  className="border border-red-500 text-red-600 hover:bg-red-50 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                >
                                  Tolak
                                </Link>
                              </>
                            )}

                            {report.status === 'Terverifikasi' && (
                              <Link
                                href={`/admin/laporan/${report.id}`}
                                className="border border-[#0B5CAD] text-[#0B5CAD] hover:bg-blue-50 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                              >
                                Disposisi
                              </Link>
                            )}

                            {(report.status === 'Diproses' ||
                              report.status === 'Selesai' ||
                              report.status === 'Ditolak') && (
                              <Link
                                href={`/admin/laporan/${report.id}`}
                                className="border border-gray-400 text-gray-700 hover:bg-gray-100 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                              >
                                Detail
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
