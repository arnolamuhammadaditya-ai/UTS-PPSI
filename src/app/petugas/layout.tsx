import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function PetugasLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'petugas') {
    if (session.role === 'admin') redirect('/admin');
    if (session.role === 'warga') redirect('/warga/laporan');
    redirect('/');
  }
  return <>{children}</>;
}

