import { ReportStatus } from '@prisma/client';

export const STATUS_LABELS: Record<ReportStatus, string> = {
  Baru: 'Baru',
  Terverifikasi: 'Terverifikasi',
  Diproses: 'Diproses',
  Selesai: 'Selesai',
  Ditolak: 'Ditolak',
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  Baru: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Terverifikasi: 'bg-blue-100 text-blue-800 border-blue-200',
  Diproses: 'bg-purple-100 text-purple-800 border-purple-200',
  Selesai: 'bg-green-100 text-green-800 border-green-200',
  Ditolak: 'bg-red-100 text-red-800 border-red-200',
};

export const ROLE_LABELS: Record<string, string> = {
  warga: 'Warga',
  petugas: 'Petugas',
  admin: 'Admin',
};

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

