import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SiLapor Kota - Portal Pengaduan Warga',
  description:
    'Portal pengaduan warga untuk Smart City. Laporkan masalah fasilitas publik dengan mudah dan pantau perkembangannya secara transparan.',
  keywords: ['pengaduan warga', 'smart city', 'laporan', 'fasilitas publik'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

