'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatusChip from '@/components/ui/StatusChip';
import StarRating from '@/components/ui/StarRating';
import { formatDateTime } from '@/lib/utils';
import { ReportStatus } from '@prisma/client';

interface Officer { id: string; nama: string; role: string; departmentId: string | null; }
interface Department { id: string; nama: string; }
interface ReportDetail {
  id: string; judul: string; deskripsi: string; alamat: string; lat: number | null; lng: number | null;
  status: ReportStatus; alasanTolak: string | null; createdAt: string;
  user: { nama: string; noHp?: string; };
  category: { nama: string; };
  department: { id: string; nama: string; } | null;
  assignedUser: { id: string; nama: string; } | null;
  photos: { id: string; url: string; jenis: string; }[];
  updates: { id: string; statusBaru: ReportStatus; statusLama: ReportStatus | null; catatan: string | null; createdAt: string; user: { nama: string; role: string; }; }[];
  rating: { skor: number; komentar: string | null; } | null;
}

export default function AdminLaporanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);

  // Verify/Reject state
  const [verifyAction, setVerifyAction] = useState<'verify' | 'reject' | null>(null);
  const [alasanTolak, setAlasanTolak] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Assign state
  const [assignDept, setAssignDept] = useState('');
  const [assignOfficer, setAssignOfficer] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/admin/reports/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) setReport(data.data.report);
        })
        .catch(() => {/* error handled by !report check */})
        .finally(() => setLoading(false));
    });

    fetch('/api/admin/departments').then(r => r.json()).then(d => { if (d.success) setDepartments(d.data.departments); });
    fetch('/api/admin/users?role=petugas&limit=50').then(r => r.json()).then(d => { if (d.success) setOfficers(d.data.users); });
  }, [params]);

  const handleVerify = async () => {
    if (!report) return;
    setVerifyLoading(true); setVerifyError('');
    try {
      const res = await fetch(`/api/admin/reports/${report.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: verifyAction, alasanTolak: verifyAction === 'reject' ? alasanTolak : undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setVerifyError(data.error ?? 'Gagal'); return; }
      setReport(r => r ? { ...r, status: data.data.report.status } : r);
      setVerifyAction(null);
      router.refresh();
    } catch { setVerifyError('Terjadi kesalahan'); }
    finally { setVerifyLoading(false); }
  };

  const handleAssign = async () => {
    if (!report || !assignDept) return;
    setAssignLoading(true); setAssignError('');
    try {
      const res = await fetch(`/api/admin/reports/${report.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: assignDept, assignedTo: assignOfficer || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setAssignError(data.error ?? 'Gagal'); return; }
      const dept = departments.find(d => d.id === assignDept);
      const off = officers.find(o => o.id === assignOfficer);
      setReport(r => r ? { ...r, department: dept ? { id: dept.id, nama: dept.nama } : r.department, assignedUser: off ? { id: off.id, nama: off.nama } : r.assignedUser } : r);
      router.refresh();
    } catch { setAssignError('Terjadi kesalahan'); }
    finally { setAssignLoading(false); }
  };

  const filteredOfficers = assignDept ? officers.filter(o => o.departmentId === assignDept) : officers;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;

  if (!report) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">Laporan tidak ditemukan</p>
      <Link href="/admin/laporan" className="btn-primary">Kembali</Link>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="hidden md:flex w-56 bg-white border-r flex-col flex-shrink-0">
          <div className="p-4 border-b"><p className="font-semibold text-gray-900 text-sm">Dashboard Admin</p></div>
          <nav className="p-3 space-y-1">
            {[{href:'/admin',label:'Dashboard',icon:'📊'},{href:'/admin/laporan',label:'Semua Laporan',icon:'📋',active:true},{href:'/admin/kategori',label:'Kategori',icon:'🏷️'},{href:'/admin/dinas',label:'Dinas',icon:'🏢'},{href:'/admin/pengguna',label:'Pengguna',icon:'👥'}].map(item=>(
              <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${item.active?'bg-primary-50 text-primary-700 font-medium':'text-gray-700 hover:bg-primary-50 hover:text-primary-700'}`}>
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-3 mb-6">
              <Link href="/admin/laporan" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900 truncate">{report.judul}</h1>
              <StatusChip status={report.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main */}
              <div className="lg:col-span-2 space-y-6">
                {/* Report Info */}
                <div className="card p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{report.category.nama}</span>
                    <StatusChip status={report.status} />
                  </div>
                  <h2 className="font-bold text-gray-900 mb-2">{report.judul}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{report.deskripsi}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-gray-400 text-xs">Pelapor</p><p className="font-medium">{report.user.nama}</p></div>
                    <div><p className="text-gray-400 text-xs">Tanggal</p><p className="font-medium">{formatDateTime(report.createdAt)}</p></div>
                    <div className="col-span-2"><p className="text-gray-400 text-xs">Alamat</p><p className="font-medium">📍 {report.alamat}</p></div>
                    {report.alasanTolak && <div className="col-span-2 bg-red-50 rounded-lg p-3"><p className="text-red-600 text-xs font-medium">Alasan Penolakan:</p><p className="text-red-700 text-sm">{report.alasanTolak}</p></div>}
                  </div>
                </div>

                {/* Photos */}
                {report.photos.length > 0 && (
                  <div className="card p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Foto ({report.photos.filter(p=>p.jenis==='awal').length} laporan, {report.photos.filter(p=>p.jenis==='bukti').length} bukti)</h2>
                    {report.photos.filter(p=>p.jenis==='awal').length > 0 && (
                      <>
                        <p className="text-xs text-gray-500 mb-2 font-medium">Foto Laporan</p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {report.photos.filter(p=>p.jenis==='awal').map(ph=>(
                            <a key={ph.id} href={ph.url} target="_blank" rel="noopener noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={ph.url} alt="" className="w-full h-32 object-cover rounded-lg" />
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                    {report.photos.filter(p=>p.jenis==='bukti').length > 0 && (
                      <>
                        <p className="text-xs text-gray-500 mb-2 font-medium">Foto Bukti</p>
                        <div className="grid grid-cols-3 gap-2">
                          {report.photos.filter(p=>p.jenis==='bukti').map(ph=>(
                            <a key={ph.id} href={ph.url} target="_blank" rel="noopener noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={ph.url} alt="" className="w-full h-32 object-cover rounded-lg border-2 border-green-200" />
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Rating */}
                {report.rating && (
                  <div className="card p-6">
                    <h2 className="font-semibold text-gray-900 mb-3">Penilaian Warga</h2>
                    <div className="flex items-center gap-3"><StarRating value={report.rating.skor} readOnly /><span className="font-bold">{report.rating.skor}/5</span></div>
                    {report.rating.komentar && <p className="text-gray-600 text-sm mt-2 italic">&ldquo;{report.rating.komentar}&rdquo;</p>}
                  </div>
                )}

                {/* Timeline */}
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Riwayat Status</h2>
                  <div className="space-y-4">
                    {report.updates.map((update, idx) => (
                      <div key={update.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${idx === report.updates.length - 1 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                          {idx < report.updates.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                        </div>
                        <div className="pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            {update.statusLama && <><StatusChip status={update.statusLama} size="sm" /><span className="text-gray-400 text-xs">→</span></>}
                            <StatusChip status={update.statusBaru} size="sm" />
                          </div>
                          {update.catatan && <p className="text-gray-600 text-xs mt-1">{update.catatan}</p>}
                          <p className="text-gray-400 text-xs mt-1">{update.user.nama} ({update.user.role}) · {formatDateTime(update.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar - Actions */}
              <div className="space-y-6">
                {/* Verify/Reject */}
                {report.status === 'Baru' && (
                  <div className="card p-5">
                    <h2 className="font-semibold text-gray-900 mb-4 text-sm">Verifikasi Laporan</h2>
                    {verifyError && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">{verifyError}</div>}
                    {verifyAction === null && (
                      <div className="space-y-2">
                        <button onClick={() => setVerifyAction('verify')} className="btn-primary w-full text-sm">✅ Verifikasi</button>
                        <button onClick={() => setVerifyAction('reject')} className="btn-danger w-full text-sm">❌ Tolak</button>
                      </div>
                    )}
                    {verifyAction === 'verify' && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Anda akan memverifikasi laporan ini.</p>
                        <div className="flex gap-2">
                          <button onClick={handleVerify} disabled={verifyLoading} className="btn-primary flex-1 text-sm">{verifyLoading ? 'Memproses...' : 'Konfirmasi'}</button>
                          <button onClick={() => setVerifyAction(null)} className="btn-secondary flex-1 text-sm">Batal</button>
                        </div>
                      </div>
                    )}
                    {verifyAction === 'reject' && (
                      <div className="space-y-3">
                        <div>
                          <label className="label text-xs">Alasan Penolakan *</label>
                          <textarea value={alasanTolak} onChange={e => setAlasanTolak(e.target.value)} className="input-field text-sm" rows={3} placeholder="Jelaskan alasan penolakan..." required />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleVerify} disabled={verifyLoading || !alasanTolak.trim()} className="btn-danger flex-1 text-sm">{verifyLoading ? 'Memproses...' : 'Tolak'}</button>
                          <button onClick={() => setVerifyAction(null)} className="btn-secondary flex-1 text-sm">Batal</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Assign */}
                {report.status === 'Terverifikasi' && (
                  <div className="card p-5">
                    <h2 className="font-semibold text-gray-900 mb-4 text-sm">Disposisi ke Dinas</h2>
                    {assignError && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">{assignError}</div>}
                    <div className="space-y-3">
                      <div>
                        <label className="label text-xs">Dinas *</label>
                        <select value={assignDept} onChange={e => { setAssignDept(e.target.value); setAssignOfficer(''); }} className="input-field text-sm">
                          <option value="">-- Pilih Dinas --</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Petugas (Opsional)</label>
                        <select value={assignOfficer} onChange={e => setAssignOfficer(e.target.value)} className="input-field text-sm" disabled={!assignDept}>
                          <option value="">-- Pilih Petugas --</option>
                          {filteredOfficers.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                        </select>
                      </div>
                      <button onClick={handleAssign} disabled={assignLoading || !assignDept} className="btn-primary w-full text-sm">
                        {assignLoading ? 'Mendisposisikan...' : '📤 Disposisikan'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="card p-5">
                  <h2 className="font-semibold text-gray-900 mb-4 text-sm">Informasi</h2>
                  <dl className="space-y-3 text-sm">
                    <div><dt className="text-gray-400 text-xs">Dinas</dt><dd className="font-medium mt-0.5">{report.department?.nama ?? 'Belum didisposisi'}</dd></div>
                    <div><dt className="text-gray-400 text-xs">Petugas</dt><dd className="font-medium mt-0.5">{report.assignedUser?.nama ?? 'Belum ditugaskan'}</dd></div>
                    {report.lat && report.lng && (
                      <div>
                        <dt className="text-gray-400 text-xs">Koordinat</dt>
                        <dd className="mt-0.5">
                          <a href={`https://www.google.com/maps?q=${report.lat},${report.lng}`} target="_blank" rel="noopener noreferrer" className="text-primary-500 text-xs hover:underline">
                            {report.lat.toFixed(5)}, {report.lng.toFixed(5)} 🗺️
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

