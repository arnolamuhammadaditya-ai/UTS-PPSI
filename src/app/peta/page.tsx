'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import { formatDate } from '@/lib/utils';
import { ReportStatus } from '@prisma/client';

interface PublicReport {
  id: string;
  judul: string;
  status: ReportStatus;
  alamat: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  category: { nama: string };
}

export default function PetaPage() {
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PublicReport | null>(null);

  useEffect(() => {
    fetch('/api/reports?limit=100')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setReports(data.data.reports.filter((r: PublicReport) => r.lat && r.lng));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const withCoords = reports.filter(r => r.lat && r.lng);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Peta Laporan</h1>
            <p className="text-gray-500 text-sm mt-1">
              Sebaran laporan warga yang masuk di seluruh wilayah kota.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map placeholder */}
            <div className="lg:col-span-2">
              <div className="card overflow-hidden">
                {/* Map embed via OpenStreetMap iframe */}
                <div className="relative bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center"
                     style={{ height: '480px' }}>
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h2 className="text-xl font-bold text-blue-800 mb-2">Peta Interaktif</h2>
                    <p className="text-blue-600 text-sm mb-4 max-w-xs">
                      Integrasi peta interaktif tersedia setelah konfigurasi API Maps.
                      Klik koordinat laporan di panel kanan untuk melihat di Google Maps.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      {loading ? 'Memuat data...' : `${withCoords.length} laporan dengan koordinat`}
                    </div>
                  </div>

                  {/* Dot indicators to simulate pins */}
                  {!loading && withCoords.slice(0, 15).map((r, i) => (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      title={r.judul}
                      style={{
                        position: 'absolute',
                        left: `${10 + (i * 6) % 80}%`,
                        top: `${15 + (i * 11) % 70}%`,
                      }}
                      className="w-5 h-5 rounded-full border-2 border-white shadow-md bg-primary-500 hover:scale-125 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Report list */}
            <div className="space-y-4">
              <div className="card p-4">
                <h2 className="font-semibold text-gray-900 text-sm mb-3">
                  Laporan Berkoordinat ({withCoords.length})
                </h2>
                {loading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
                  </div>
                ) : withCoords.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">Belum ada laporan dengan koordinat GPS.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {withCoords.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelected(selected?.id === r.id ? null : r)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selected?.id === r.id
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-medium text-gray-900 text-xs truncate">{r.judul}</p>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">📍 {r.alamat}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{r.category.nama}</span>
                          <StatusChip status={r.status as ReportStatus} size="sm" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected detail */}
              {selected && (
                <div className="card p-4 border-primary-200">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">{selected.judul}</h3>
                  <p className="text-gray-500 text-xs mb-3">📍 {selected.alamat}</p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs text-center"
                    >
                      🗺️ Buka di Google Maps
                    </a>
                    <Link
                      href={`/laporan/${selected.id}`}
                      className="btn-secondary text-xs text-center"
                    >
                      Lihat Detail Laporan
                    </Link>
                  </div>
                  <p className="text-gray-400 text-xs mt-2 text-right">{formatDate(selected.createdAt)}</p>
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
