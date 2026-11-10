import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { reportQuerySchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'warga') {
      return errorResponse('Akses ditolak', 403);
    }

    const { searchParams } = new URL(request.url);
    
    const parsed = reportQuerySchema.safeParse({
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 10,
      status: searchParams.get('status') ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse('Parameter tidak valid', 400);
    }

    const { page, limit, status } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      userId: session.userId,
      ...(status ? { status } : {}),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          judul: true,
          deskripsi: true,
          alamat: true,
          status: true,
          alasanTolak: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, nama: true } },
          department: { select: { id: true, nama: true } },
          photos: {
            where: { jenis: 'awal' },
            take: 1,
            select: { url: true },
          },
          rating: { select: { skor: true } },
          _count: { select: { updates: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return successResponse({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/me/reports error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

