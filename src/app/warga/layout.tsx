import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function WargaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'warga') {
    if (session.role === 'admin') redirect('/admin');
    if (session.role === 'petugas') redirect('/petugas');
    redirect('/');
  }

  return <>{children}</>;
}

