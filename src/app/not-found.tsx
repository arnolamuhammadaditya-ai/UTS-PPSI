import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary">Ke Beranda</Link>
          <Link href="/laporan" className="btn-secondary">Lihat Laporan</Link>
        </div>
      </div>
    </div>
  );
}

