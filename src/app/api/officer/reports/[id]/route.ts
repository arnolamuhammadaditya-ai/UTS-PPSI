import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'petugas') return errorResponse('Akses ditolak', 403);

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
        createdAt: true,
        assignedTo: true,
        user: { select: { nama: true } },
        category: { select: { id: true, nama: true } },
        department: { select: { id: true, nama: true } },
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
      },
    });

    if (!report) return notFoundResponse('Laporan');

    // Petugas hanya bisa lihat laporan yang ditugaskan kepadanya
    if (report.assignedTo !== session.userId) {
      return errorResponse('Laporan tidak ditugaskan kepada Anda', 403);
    }

    return successResponse({ report });
  } catch (error) {
    console.error('GET /api/officer/reports/[id] error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

