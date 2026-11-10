import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { departmentSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'admin') return errorResponse('Akses ditolak', 403);

    const { id } = await params;
    const body = await request.json();
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return notFoundResponse('Dinas');

    const department = await prisma.department.update({
      where: { id },
      data: { nama: parsed.data.nama, kontak: parsed.data.kontak ?? null },
    });

    return successResponse({ department });
  } catch (error) {
    console.error('PATCH /api/admin/departments/[id] error:', error);
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
    if (session.role !== 'admin') return errorResponse('Akses ditolak', 403);

    const { id } = await params;
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return notFoundResponse('Dinas');

    await prisma.department.delete({ where: { id } });
    return successResponse({ message: 'Dinas berhasil dihapus' });
  } catch (error) {
    console.error('DELETE /api/admin/departments/[id] error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

