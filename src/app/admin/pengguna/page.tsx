'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

interface User { id: string; nama: string; email: string; role: string; noHp: string | null; createdAt: string; department: { nama: string } | null; _count: { reports: number }; }
interface Department { id: string; nama: string; }

const ROLE_LABELS: Record<string, string> = { warga: 'Warga', petugas: 'Petugas', admin: 'Admin' };
const ROLE_COLORS: Record<string, string> = { warga: 'bg-gray-100 text-gray-700', petugas: 'bg-blue-100 text-blue-700', admin: 'bg-purple-100 text-purple-700' };

export default function AdminPenggunaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: User | null }>({ open: false, editing: null });
  const [form, setForm] = useState({ nama: '', role: 'warga', departmentId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const user = { nama: '', email: '', role: 'admin' };

  const load = (search = q, role = roleFilter) => {
    const qs = new URLSearchParams({ limit: '50', ...(search ? { q: search } : {}), ...(role ? { role } : {}) }).toString();
    fetch(`/api/admin/users?${qs}`).then(r => r.json()).then(d => { if (d.success) setUsers(d.data.users); setLoading(false); });
  };

  useEffect(() => {
    load();
    fetch('/api/admin/departments').then(r => r.json()).then(d => { if (d.success) setDepartments(d.data.departments); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (u: User) => {
    setForm({ nama: u.nama, role: u.role, departmentId: u.department ? departments.find(d => d.nama === u.department?.nama)?.id ?? '' : '' });
    setModal({ open: true, editing: u }); setError('');
  };
  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async () => {
    if (!modal.editing) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/admin/users/${modal.editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: form.nama, role: form.role, departmentId: form.departmentId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Gagal'); return; }
      closeModal(); load();
    } catch { setError('Terjadi kesalahan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengguna ini?')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? 'Gagal menghapus'); return; }
    load();
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(q, roleFilter); };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <div className="flex flex-1">
        <aside className="hidden md:flex w-56 bg-white border-r flex-col flex-shrink-0">
          <div className="p-4 border-b"><p className="font-semibold text-gray-900 text-sm">Dashboard Admin</p></div>
          <nav className="p-3 space-y-1">
            {[{href:'/admin',label:'Dashboard',icon:'📊'},{href:'/admin/laporan',label:'Semua Laporan',icon:'📋'},{href:'/admin/kategori',label:'Kategori',icon:'🏷️'},{href:'/admin/dinas',label:'Dinas',icon:'🏢'},{href:'/admin/pengguna',label:'Pengguna',icon:'👥',active:true}].map(item=>(
              <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${item.active?'bg-primary-50 text-primary-700 font-medium':'text-gray-700 hover:bg-primary-50 hover:text-primary-700'}`}>
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Kelola Pengguna</h1>
              <span className="text-gray-500 text-sm">{users.length} pengguna</span>
            </div>

            {/* Filter */}
            <div className="card p-4 mb-6">
              <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
                <input type="text" value={q} onChange={e => setQ(e.target.value)} className="input-field flex-1 min-w-48 text-sm" placeholder="Cari nama atau email..." />
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-36 text-sm">
                  <option value="">Semua Peran</option>
                  <option value="warga">Warga</option>
                  <option value="petugas">Petugas</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn-primary text-sm">Cari</button>
                <button type="button" onClick={() => { setQ(''); setRoleFilter(''); load('', ''); }} className="btn-secondary text-sm">Reset</button>
              </form>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pengguna</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Peran</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Dinas</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Laporan</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Memuat...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Tidak ada pengguna</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{u.nama}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{u.department?.nama ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{u._count.reports}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEdit(u)} className="text-primary-500 hover:text-primary-700 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Hapus</button>
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

      {modal.open && modal.editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-gray-900">Edit Pengguna</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
              <div>
                <p className="text-xs text-gray-500 mb-3">Email: {modal.editing.email}</p>
              </div>
              <div>
                <label className="label">Nama</label>
                <input type="text" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="label">Peran</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input-field">
                  <option value="warga">Warga</option>
                  <option value="petugas">Petugas</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {form.role === 'petugas' && (
                <div>
                  <label className="label">Dinas</label>
                  <select value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})} className="input-field">
                    <option value="">-- Pilih Dinas --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              <button onClick={closeModal} className="btn-secondary flex-1">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

