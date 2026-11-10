import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundResponse, errorResponse } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const report = await prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        judul: true,
        deskripsi: true,
        alamat: true,
        lat: true,
        lng: true,
        status: true,
        alasanTolak: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, nama: true } },
        department: { select: { id: true, nama: true, kontak: true } },
        // Hide personal data for public
        user: { select: { nama: true } },
        photos: {
          select: { id: true, url: true, jenis: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
        updates: {
          select: {
            id: true,
            statusLama: true,
            statusBaru: true,
            catatan: true,
            createdAt: true,
            user: { select: { nama: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        rating: {
          select: { skor: true, komentar: true, createdAt: true },
        },
      },
    });

    if (!report) {
      return notFoundResponse('Laporan');
    }

    // Only show public reports (not Baru/Ditolak) to anonymous users
    if (report.status === 'Baru' || report.status === 'Ditolak') {
      return notFoundResponse('Laporan');
    }

    return successResponse({ report });
  } catch (error) {
    console.error('GET /api/reports/[id] error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

