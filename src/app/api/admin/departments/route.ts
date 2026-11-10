import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { departmentSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { nama: 'asc' },
      include: {
        _count: { select: { categories: true, reports: true, officers: true } },
      },
    });
    return successResponse({ departments });
  } catch (error) {
    console.error('GET /api/admin/departments error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'admin') {
      return errorResponse('Hanya admin yang dapat mengelola dinas', 403);
    }

    const body = await request.json();
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
    }

    const department = await prisma.department.create({
      data: { nama: parsed.data.nama, kontak: parsed.data.kontak ?? null },
    });

    return successResponse({ department }, 201);
  } catch (error) {
    console.error('POST /api/admin/departments error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

