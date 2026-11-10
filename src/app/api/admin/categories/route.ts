import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { categorySchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { nama: 'asc' },
      include: { department: { select: { id: true, nama: true } } },
    });
    return successResponse({ categories });
  } catch (error) {
    console.error('GET /api/admin/categories error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'admin') {
      return errorResponse('Hanya admin yang dapat mengelola kategori', 403);
    }

    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
    }

    const category = await prisma.category.create({
      data: {
        nama: parsed.data.nama,
        departmentId: parsed.data.departmentId ?? null,
      },
      include: { department: { select: { id: true, nama: true } } },
    });

    return successResponse({ category }, 201);
  } catch (error) {
    console.error('POST /api/admin/categories error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

