import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  const session = await getSession();
  
  // Get quick stats
  const [totalReports, selesai, diproses] = await Promise.all([
    prisma.report.count({ where: { status: { notIn: ['Baru'] } } }),
    prisma.report.count({ where: { status: 'Selesai' } }),
    prisma.report.count({ where: { status: 'Diproses' } }),
  ]);

  // Get recent reports for display
  const recentReports = await prisma.report.findMany({
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
      photos: { where: { jenis: 'awal' }, take: 1, select: { url: true } },
    },
  });

  const user = session ? { nama: session.nama, email: session.email, role: session.role } : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Sistem aktif dan transparan
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Laporkan Masalah Kota,{' '}
              <span className="text-yellow-300">Bersama Wujudkan</span>{' '}
              Kota yang Lebih Baik
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              SiLapor Kota memudahkan warga melaporkan masalah fasilitas publik — jalan rusak, lampu mati, 
              sampah menumpuk — dan memantau perkembangannya secara real-time.
            </p>
            <div className="flex flex-wrap gap-3">
              {session ? (
                <Link href="/warga/laporan/buat" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3 rounded-xl text-base transition-colors">
                  Buat Laporan
                </Link>
              ) : (
                <>
                  <Link href="/register" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3 rounded-xl text-base transition-colors">
                    Mulai Melapor
                  </Link>
                  <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors border border-white/30">
                    Sudah Punya Akun
                  </Link>
                </>
              )}
              <Link href="/laporan" className="bg-transparent hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors border border-white/40">
                Lihat Laporan Publik
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary-500">{totalReports.toLocaleString('id-ID')}</p>
              <p className="text-gray-500 text-sm mt-1">Total Laporan</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{selesai.toLocaleString('id-ID')}</p>
              <p className="text-gray-500 text-sm mt-1">Laporan Selesai</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">{diproses.toLocaleString('id-ID')}</p>
              <p className="text-gray-500 text-sm mt-1">Sedang Diproses</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Cara Kerja SiLapor Kota</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', icon: '📸', title: 'Buat Laporan', desc: 'Foto masalah, isi deskripsi dan lokasi. Proses kurang dari 2 menit.' },
              { step: '2', icon: '✅', title: 'Admin Verifikasi', desc: 'Admin Pemda memverifikasi dan mendisposisikan ke dinas terkait.' },
              { step: '3', icon: '🔧', title: 'Petugas Menangani', desc: 'Petugas dinas menindaklanjuti dan mengunggah bukti penyelesaian.' },
              { step: '4', icon: '⭐', title: 'Beri Penilaian', desc: 'Setelah selesai, warga memberikan rating untuk evaluasi layanan.' },
            ].map((item) => (
              <div key={item.step} className="text-center card p-6">
                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-2xl mx-auto mb-3">
                  {item.icon}
                </div>
                <div className="inline-block bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                  Langkah {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Laporan Terkini</h2>
              <Link href="/laporan" className="text-primary-500 hover:text-primary-700 text-sm font-medium">
                Lihat Semua →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentReports.map((report) => (
                <Link href={`/laporan/${report.id}`} key={report.id}>
                  <div className="card overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                    {report.photos[0] ? (
                      <div className="relative h-48 bg-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={report.photos[0].url}
                          alt={report.judul}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-4xl">📋</span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {report.category.nama}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          report.status === 'Selesai' ? 'bg-green-100 text-green-700' :
                          report.status === 'Diproses' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                        {report.judul}
                      </h3>
                      <p className="text-gray-400 text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {report.alamat}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

