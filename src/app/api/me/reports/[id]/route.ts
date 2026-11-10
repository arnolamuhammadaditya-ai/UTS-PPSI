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
    if (session.role !== 'warga') return errorResponse('Akses ditolak', 403);

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
        userId: true,
        category: { select: { id: true, nama: true } },
        department: { select: { id: true, nama: true, kontak: true } },
        assignedUser: { select: { nama: true } },
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

    if (!report) return notFoundResponse('Laporan');
    
    // Ensure report belongs to this user
    if (report.userId !== session.userId) {
      return errorResponse('Anda tidak memiliki akses ke laporan ini', 403);
    }

    return successResponse({ report });
  } catch (error) {
    console.error('GET /api/me/reports/[id] error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

