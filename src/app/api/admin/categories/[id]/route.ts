import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { categorySchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'admin') {
      return errorResponse('Hanya admin yang dapat mengelola kategori', 403);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return notFoundResponse('Kategori');

    const category = await prisma.category.update({
      where: { id },
      data: {
        nama: parsed.data.nama,
        departmentId: parsed.data.departmentId ?? null,
      },
      include: { department: { select: { id: true, nama: true } } },
    });

    return successResponse({ category });
  } catch (error) {
    console.error('PATCH /api/admin/categories/[id] error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'admin') {
      return errorResponse('Hanya admin yang dapat menghapus kategori', 403);
    }

    const { id } = await params;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return notFoundResponse('Kategori');

    await prisma.category.delete({ where: { id } });
    return successResponse({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('DELETE /api/admin/categories/[id] error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

