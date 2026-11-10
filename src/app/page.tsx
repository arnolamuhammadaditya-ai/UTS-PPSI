import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export default async function HomePage() {
  const session = await getSession();

  let laporanMasuk = 0;
  let sedangDiproses = 0;
  let selesaiDitangani = 0;
  let recentReports: Array<{
    id: string;
    judul: string;
    alamat: string;
    status: any;
    createdAt: Date;
    category: { nama: string };
  }> = [];
  let dbConnected = true;

  try {
    const [counts, reports] = await Promise.all([
      Promise.all([
        prisma.report.count({ where: { status: { notIn: ['Ditolak'] } } }),
        prisma.report.count({ where: { status: 'Diproses' } }),
        prisma.report.count({ where: { status: 'Selesai' } }),
      ]),
      prisma.report.findMany({
        where: { status: { in: ['Terverifikasi', 'Diproses', 'Selesai'] } },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          judul: true,
          alamat: true,
          status: true,
          createdAt: true,
          category: { select: { nama: true } },
        },
      }),
    ]);

    laporanMasuk = counts[0];
    sedangDiproses = counts[1];
    selesaiDitangani = counts[2];
    recentReports = reports;
  } catch (error) {
    dbConnected = false;
    console.warn('Database query skipped or not connected:', error);
  }

  const user = session ? { nama: session.nama, email: session.email, role: session.role } : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        {!dbConnected && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Database Belum Terhubung</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Aplikasi berjalan dalam mode pratinjau. Pastikan file <code className="bg-amber-100 px-1 py-0.5 rounded">.env</code> memiliki koneksi PostgreSQL yang aktif dan jalankan migrasi database (<code className="bg-amber-100 px-1 py-0.5 rounded">npx prisma migrate dev</code>) untuk mengaktifkan seluruh fitur.
              </p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            Laporkan masalah kota, pantau sampai selesai
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mb-6 max-w-2xl">
            Foto, tandai lokasi, dan ikuti status penanganan laporanmu secara transparan.
          </p>
          <div>
            <Link
              href={session ? '/warga/laporan/buat' : '/login'}
              className="inline-block bg-[#0B5CAD] hover:bg-[#094d92] text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-colors"
            >
              Buat Laporan
            </Link>
          </div>
        </div>

        {/* 3 Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {/* Card 1: Laporan masuk */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-bold text-[#0B5CAD] mb-1">
              {laporanMasuk.toLocaleString('id-ID')}
            </p>
            <p className="text-gray-600 text-sm font-medium">Laporan masuk</p>
          </div>

          {/* Card 2: Sedang diproses */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-bold text-[#0B5CAD] mb-1">
              {sedangDiproses.toLocaleString('id-ID')}
            </p>
            <p className="text-gray-600 text-sm font-medium">Sedang diproses</p>
          </div>

          {/* Card 3: Selesai ditangani */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-bold text-[#0B5CAD] mb-1">
              {selesaiDitangani.toLocaleString('id-ID')}
            </p>
            <p className="text-gray-600 text-sm font-medium">Selesai ditangani</p>
          </div>
        </div>

        {/* Laporan Terbaru Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Laporan terbaru
            </h2>
            <Link
              href="/laporan"
              className="text-sm font-medium text-[#0B5CAD] hover:underline"
            >
              Lihat semua &rarr;
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
              Belum ada laporan yang dipublikasikan.
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/laporan/${report.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">
                        {report.judul}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        <span className="font-medium text-gray-700">{report.category.nama}</span>
                        {' · '}
                        <span>{report.alamat}</span>
                        {' · '}
                        <span>{formatDate(report.createdAt)}</span>
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <StatusChip status={report.status} />
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
