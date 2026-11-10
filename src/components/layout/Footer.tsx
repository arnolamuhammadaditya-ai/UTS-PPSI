export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
                  <circle cx="20" cy="20" r="18" fill="#0B5CAD" />
                  <path d="M20 8L24 16H28L22 20L24 28L20 24L16 28L18 20L12 16H16L20 8Z" fill="gold" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">SiLapor Kota</p>
                <p className="text-gray-400 text-xs">Portal Pengaduan Warga</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Sistem informasi pengaduan warga berbasis digital untuk mendukung tata kelola kota yang transparan dan responsif.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Tautan</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="/laporan" className="hover:text-white transition-colors">Laporan Publik</a></li>
              <li><a href="/register" className="hover:text-white transition-colors">Daftar Sebagai Warga</a></li>
              <li><a href="/login" className="hover:text-white transition-colors">Masuk</a></li>
            </ul>
          </div>

          {/* Institution */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Dikembangkan Oleh</h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-primary-500 font-black text-xs">UTI</span>
              </div>
              <p className="text-xs leading-tight">Universitas Teknokrat Indonesia</p>
            </div>
            <p className="text-gray-400 text-xs">Program Studi Informatika</p>
            <p className="text-gray-400 text-xs mt-1">Mata Kuliah: Proyek Pengembangan Sistem Informasi</p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 text-center">
          <p className="text-xs text-gray-400">
            Copyright &copy; 2026 by{' '}
            <span className="text-gray-300 font-medium">
              {process.env.NEXT_PUBLIC_STUDENT_NAME ?? '[Nama Mahasiswa]'}
            </span>{' '}
            dan{' '}
            <span className="text-gray-300 font-medium">Dr. Erliyan Redy Susanto, M.Kom</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

