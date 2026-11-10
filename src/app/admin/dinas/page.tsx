'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

interface Department { id: string; nama: string; kontak: string | null; _count: { categories: number; reports: number; officers: number; }; }

export default function AdminDinasPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Department | null }>({ open: false, editing: null });
  const [form, setForm] = useState({ nama: '', kontak: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const user = { nama: '', email: '', role: 'admin' };

  const load = () => {
    fetch('/api/admin/departments').then(r => r.json()).then(d => { if (d.success) setDepartments(d.data.departments); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ nama: '', kontak: '' }); setModal({ open: true, editing: null }); setError(''); };
  const openEdit = (dept: Department) => { setForm({ nama: dept.nama, kontak: dept.kontak ?? '' }); setModal({ open: true, editing: dept }); setError(''); };
  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const url = modal.editing ? `/api/admin/departments/${modal.editing.id}` : '/api/admin/departments';
      const method = modal.editing ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: form.nama, kontak: form.kontak || undefined }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Gagal'); return; }
      closeModal(); load();
    } catch { setError('Terjadi kesalahan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus dinas ini? Pastikan tidak ada laporan atau petugas terkait.')) return;
    const res = await fetch(`/api/admin/departments/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? 'Gagal menghapus'); return; }
    load();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <div className="flex flex-1">
        <aside className="hidden md:flex w-56 bg-white border-r flex-col flex-shrink-0">
          <div className="p-4 border-b"><p className="font-semibold text-gray-900 text-sm">Dashboard Admin</p></div>
          <nav className="p-3 space-y-1">
            {[{href:'/admin',label:'Dashboard',icon:'📊'},{href:'/admin/laporan',label:'Semua Laporan',icon:'📋'},{href:'/admin/kategori',label:'Kategori',icon:'🏷️'},{href:'/admin/dinas',label:'Dinas',icon:'🏢',active:true},{href:'/admin/pengguna',label:'Pengguna',icon:'👥'}].map(item=>(
              <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${item.active?'bg-primary-50 text-primary-700 font-medium':'text-gray-700 hover:bg-primary-50 hover:text-primary-700'}`}>
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Dinas / Instansi</h1>
              <button onClick={openAdd} className="btn-primary text-sm">+ Tambah Dinas</button>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Dinas</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kontak</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statistik</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Memuat...</td></tr>
                  ) : departments.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Belum ada dinas</td></tr>
                  ) : departments.map(dept => (
                    <tr key={dept.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{dept.nama}</td>
                      <td className="px-4 py-3 text-gray-600">{dept.kontak ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 text-xs text-gray-500">
                          <span>{dept._count.categories} kategori</span>
                          <span>{dept._count.reports} laporan</span>
                          <span>{dept._count.officers} petugas</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEdit(dept)} className="text-primary-500 hover:text-primary-700 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(dept.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-gray-900">{modal.editing ? 'Edit Dinas' : 'Tambah Dinas'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="label">Nama Dinas *</label>
                <input type="text" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="input-field" placeholder="Nama dinas/instansi" required />
              </div>
              <div>
                <label className="label">Nomor Kontak</label>
                <input type="text" value={form.kontak} onChange={e => setForm({...form, kontak: e.target.value})} className="input-field" placeholder="Contoh: 0721-123456" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={handleSave} disabled={saving || !form.nama.trim()} className="btn-primary flex-1">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              <button onClick={closeModal} className="btn-secondary flex-1">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

