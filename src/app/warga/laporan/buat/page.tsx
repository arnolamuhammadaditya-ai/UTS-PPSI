'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Category {
  id: string;
  nama: string;
  department?: { nama: string } | null;
}

export default function BuatLaporanPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    categoryId: '',
    alamat: '',
    lat: '',
    lng: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [user] = useState({ nama: '', email: '', role: 'warga' });

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(data => {
        if (data.success) setCategories(data.data.categories);
      });
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (photos.length + files.length > 3) {
      setError('Maksimal 3 foto yang dapat diunggah');
      return;
    }
    
    const invalid = files.filter(f => f.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/jpg'].includes(f.type));
    if (invalid.length > 0) {
      setError('File harus berformat JPG/PNG dan maksimal 5 MB');
      return;
    }

    const newPhotos = [...photos, ...files].slice(0, 3);
    setPhotos(newPhotos);

    // Create previews
    const previews = newPhotos.map(f => URL.createObjectURL(f));
    setPhotoPreview(previews);
    setError('');
  };

  const removePhoto = (idx: number) => {
    const newPhotos = photos.filter((_, i) => i !== idx);
    setPhotos(newPhotos);
    const previews = newPhotos.map(f => URL.createObjectURL(f));
    setPhotoPreview(previews);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolokasi');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        setError('Gagal mendapatkan lokasi. Isi koordinat manual.');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (photos.length === 0) {
      setError('Minimal 1 foto harus diunggah');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('judul', form.judul);
      formData.append('deskripsi', form.deskripsi);
      formData.append('categoryId', form.categoryId);
      formData.append('alamat', form.alamat);
      if (form.lat) formData.append('lat', form.lat);
      if (form.lng) formData.append('lng', form.lng);
      photos.forEach((photo, idx) => {
        formData.append(`foto${idx + 1}`, photo);
      });

      const res = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) setFieldErrors(data.details);
        else setError(data.error ?? 'Gagal membuat laporan');
        return;
      }

      router.push('/warga/laporan');
      router.refresh();
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <Link href="/warga/laporan" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Buat Laporan Baru</h1>
                <p className="text-gray-500 text-sm">Isi formulir dengan lengkap dan benar</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Informasi Laporan</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Judul Laporan <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.judul}
                    onChange={e => setForm({...form, judul: e.target.value})}
                    className="input-field"
                    placeholder="Contoh: Jalan Berlubang di Jl. Sudirman"
                    required
                    maxLength={200}
                  />
                  {fieldErrors.judul && <p className="text-red-500 text-xs mt-1">{fieldErrors.judul[0]}</p>}
                </div>

                <div>
                  <label className="label">Kategori <span className="text-red-500">*</span></label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm({...form, categoryId: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nama}</option>
                    ))}
                  </select>
                  {fieldErrors.categoryId && <p className="text-red-500 text-xs mt-1">{fieldErrors.categoryId[0]}</p>}
                </div>

                <div>
                  <label className="label">Deskripsi <span className="text-red-500">*</span></label>
                  <textarea
                    value={form.deskripsi}
                    onChange={e => setForm({...form, deskripsi: e.target.value})}
                    className="input-field min-h-[120px] resize-y"
                    placeholder="Jelaskan masalah secara detail: kondisi, ukuran kerusakan, dampak, dll."
                    required
                    minLength={20}
                    maxLength={2000}
                  />
                  <p className="text-gray-400 text-xs mt-1 text-right">{form.deskripsi.length}/2000</p>
                  {fieldErrors.deskripsi && <p className="text-red-500 text-xs mt-1">{fieldErrors.deskripsi[0]}</p>}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Lokasi</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Alamat Lengkap <span className="text-red-500">*</span></label>
                  <textarea
                    value={form.alamat}
                    onChange={e => setForm({...form, alamat: e.target.value})}
                    className="input-field min-h-[80px] resize-y"
                    placeholder="Contoh: Jl. Sudirman No. 10, Kelurahan Kampung Baru, Kecamatan Kedaton, Bandar Lampung"
                    required
                  />
                  {fieldErrors.alamat && <p className="text-red-500 text-xs mt-1">{fieldErrors.alamat[0]}</p>}
                </div>

                <div>
                  <label className="label">Koordinat GPS (Opsional)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      step="any"
                      value={form.lat}
                      onChange={e => setForm({...form, lat: e.target.value})}
                      className="input-field flex-1"
                      placeholder="Latitude"
                    />
                    <input
                      type="number"
                      step="any"
                      value={form.lng}
                      onChange={e => setForm({...form, lng: e.target.value})}
                      className="input-field flex-1"
                      placeholder="Longitude"
                    />
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locating}
                      className="btn-secondary px-3 py-2.5 flex-shrink-0 text-sm"
                      title="Dapatkan lokasi saat ini"
                    >
                      {locating ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">Klik tombol lokasi untuk mengisi otomatis dari GPS</p>
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-1">Foto Laporan <span className="text-red-500">*</span></h2>
              <p className="text-gray-500 text-sm mb-4">Unggah 1-3 foto (JPG/PNG, maks 5 MB per foto)</p>

              {/* Photo Previews */}
              {photoPreview.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {photoPreview.map((src, idx) => (
                    <div key={idx} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-28 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 3 && (
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium">Klik untuk memilih foto</span>
                  <span className="text-xs text-gray-400 mt-1">({photos.length}/3 foto dipilih)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 justify-end">
              <Link href="/warga/laporan" className="btn-secondary">
                Batal
              </Link>
              <button type="submit" disabled={loading} className="btn-primary px-6">
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  'Kirim Laporan'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

