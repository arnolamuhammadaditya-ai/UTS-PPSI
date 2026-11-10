import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { ReportStatus } from '@prisma/client';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    categoryId?: string;
    q?: string;
  }>;
}

export default async function AdminLaporanPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) return null;
  const user = { nama: session.nama, email: session.email, role: session.role };

  const params = await searchParams;
  const page = parseInt(params.page ?? '1');
  const limit = 15;
  const skip = (page - 1) * limit;
  const statusFilter = params.status as ReportStatus | undefined;
  const categoryId = params.categoryId;
  const q = params.q;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
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
          status: true,
          createdAt: true,
          category: { select: { nama: true } },
          department: { select: { nama: true } },
          user: { select: { nama: true } },
          assignedUser: { select: { nama: true } },
          _count: { select: { photos: true } },
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
    const qs = Object.entries(p).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
    return `/admin/laporan${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 bg-white border-r flex-col flex-shrink-0">
          <div className="p-4 border-b">
            <p className="font-semibold text-gray-900 text-sm">Dashboard Admin</p>
          </div>
          <nav className="p-3 space-y-1 flex-1">
            {[
              { href: '/admin', label: 'Dashboard', icon: '📊' },
              { href: '/admin/laporan', label: 'Semua Laporan', icon: '📋', active: true },
              { href: '/admin/kategori', label: 'Kategori', icon: '🏷️' },
              { href: '/admin/dinas', label: 'Dinas', icon: '🏢' },
              { href: '/admin/pengguna', label: 'Pengguna', icon: '👥' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${item.active ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'}`}>
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Semua Laporan</h1>
              <span className="text-gray-500 text-sm">{total} laporan</span>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6">
              <form method="GET" action="/admin/laporan" className="flex flex-wrap gap-3">
                <input name="q" type="text" defaultValue={q} className="input-field flex-1 min-w-48 text-sm" placeholder="Cari judul..." />
                <select name="categoryId" defaultValue={categoryId} className="input-field w-44 text-sm">
                  <option value="">Semua Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
                </select>
                <select name="status" defaultValue={statusFilter} className="input-field w-44 text-sm">
                  <option value="">Semua Status</option>
                  {(['Baru','Terverifikasi','Diproses','Selesai','Ditolak'] as ReportStatus[]).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button type="submit" className="btn-primary text-sm">Filter</button>
                <Link href="/admin/laporan" className="btn-secondary text-sm">Reset</Link>
              </form>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Laporan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pelapor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dinas</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-400">Tidak ada laporan</td></tr>
                    ) : reports.map(report => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 truncate max-w-xs">{report.judul}</p>
                          <p className="text-xs text-gray-400">{report._count.photos} foto</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{report.category.nama}</td>
                        <td className="px-4 py-3 text-gray-600">{report.user.nama}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{report.department?.nama ?? '-'}</td>
                        <td className="px-4 py-3"><StatusChip status={report.status} size="sm" /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(report.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/laporan/${report.id}`} className="text-primary-500 hover:text-primary-700 font-medium text-xs">
                            Detail →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <span className="text-sm text-gray-500">Halaman {page} dari {totalPages}</span>
                  <div className="flex gap-2">
                    {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="btn-secondary text-sm px-3 py-1.5">← Prev</Link>}
                    {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="btn-secondary text-sm px-3 py-1.5">Next →</Link>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

