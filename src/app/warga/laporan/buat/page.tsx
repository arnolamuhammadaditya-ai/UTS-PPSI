'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Category {
  id: string;
  nama: string;
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
  const [locationSuccess, setLocationSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCategories(data.data.categories);
      });
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (photos.length + files.length > 3) {
      setError('Maksimal 3 foto yang dapat diunggah');
      return;
    }

    const invalid = files.filter(
      (f) =>
        f.size > 5 * 1024 * 1024 ||
        !['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)
    );
    if (invalid.length > 0) {
      setError('File harus berformat JPG/PNG dan maksimal 5 MB');
      return;
    }

    const newPhotos = [...photos, ...files].slice(0, 3);
    setPhotos(newPhotos);
    setPhotoPreview(newPhotos.map((f) => URL.createObjectURL(f)));
    setError('');
  };

  const removePhoto = (idx: number) => {
    const newPhotos = photos.filter((_, i) => i !== idx);
    setPhotos(newPhotos);
    setPhotoPreview(newPhotos.map((f) => URL.createObjectURL(f)));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolokasi');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setLocationSuccess(true);
        setLocating(false);
      },
      () => {
        setError('Gagal mendeteksi lokasi otomatis. Silakan tulis alamat/patokan manual.');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!form.categoryId) {
      setError('Pilih kategori terlebih dahulu');
      return;
    }

    if (photos.length === 0) {
      setError('Minimal 1 foto harus diunggah (maksimal 3 foto)');
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
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex justify-center py-8 px-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center sm:text-left">
            Buat Laporan
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Kategori */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Kategori
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5CAD]/30 focus:border-[#0B5CAD]"
                required
              >
                <option value="">Pilih kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nama}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.categoryId[0]}</p>
              )}
            </div>

            {/* 2. Judul laporan */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Judul laporan
              </label>
              <input
                type="text"
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5CAD]/30 focus:border-[#0B5CAD]"
                placeholder="Masukkan judul laporan"
                required
                maxLength={200}
              />
              {fieldErrors.judul && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.judul[0]}</p>
              )}
            </div>

            {/* 3. Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Deskripsi
              </label>
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#0B5CAD]/30 focus:border-[#0B5CAD]"
                placeholder="Jelaskan detail masalah secara rinci..."
                required
                minLength={20}
                maxLength={2000}
              />
              {fieldErrors.deskripsi && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.deskripsi[0]}</p>
              )}
            </div>

            {/* 4. Foto (maks. 3, 5 MB) */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Foto (maks. 3, 5 MB)
              </label>

              {photoPreview.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {photoPreview.map((src, idx) => (
                    <div key={idx} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 3 && (
                <label className="w-full border border-dashed border-[#0B5CAD] rounded-lg py-4 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 transition-colors">
                  <span className="text-sm font-medium text-[#0B5CAD]">Tambah foto</span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    ({photos.length}/3 foto terunggah)
                  </span>
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

            {/* 5. Lokasi */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Lokasi
              </label>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="w-full border border-[#0B5CAD] text-[#0B5CAD] hover:bg-blue-50 font-medium py-2.5 rounded-lg text-sm mb-2.5 transition-colors flex items-center justify-center gap-2"
              >
                {locating ? (
                  <span>Mendeteksi koordinat...</span>
                ) : locationSuccess ? (
                  <span>&#10003; Lokasi GPS Terdeteksi ({form.lat}, {form.lng})</span>
                ) : (
                  <span>Gunakan lokasi saya</span>
                )}
              </button>

              <input
                type="text"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5CAD]/30 focus:border-[#0B5CAD]"
                placeholder="Alamat atau patokan"
                required
              />
              {fieldErrors.alamat && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.alamat[0]}</p>
              )}
            </div>

            {/* 6. Kirim Laporan Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0B5CAD] hover:bg-[#094d92] disabled:opacity-50 text-white font-medium py-3 rounded-lg text-base shadow-sm transition-colors"
              >
                {loading ? 'Mengirim Laporan...' : 'Kirim Laporan'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
