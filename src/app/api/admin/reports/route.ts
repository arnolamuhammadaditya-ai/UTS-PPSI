import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { reportQuerySchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'admin') return errorResponse('Akses ditolak', 403);

    const { searchParams } = new URL(request.url);
    const parsed = reportQuerySchema.safeParse({
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 15,
      status: searchParams.get('status') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      q: searchParams.get('q') ?? undefined,
    });

    if (!parsed.success) return errorResponse('Parameter tidak valid', 400);

    const { page, limit, status, categoryId, q } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(q ? { judul: { contains: q, mode: 'insensitive' as const } } : {}),
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
          status: true,
          createdAt: true,
          category: { select: { id: true, nama: true } },
          department: { select: { id: true, nama: true } },
          user: { select: { nama: true } },
          assignedUser: { select: { id: true, nama: true } },
          _count: { select: { photos: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return successResponse({ reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

