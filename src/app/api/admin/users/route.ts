import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'admin') {
      return errorResponse('Hanya admin yang dapat melihat daftar pengguna', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const role = searchParams.get('role') ?? undefined;
    const q = searchParams.get('q') ?? undefined;

    const skip = (page - 1) * limit;

    const where = {
      ...(role ? { role: role as 'warga' | 'petugas' | 'admin' } : {}),
      ...(q ? {
        OR: [
          { nama: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nama: true,
          email: true,
          role: true,
          noHp: true,
          createdAt: true,
          department: { select: { id: true, nama: true } },
          _count: { select: { reports: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

