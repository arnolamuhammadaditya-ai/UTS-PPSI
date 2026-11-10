import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { updateUserSchema } from '@/lib/validations';
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
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return notFoundResponse('Pengguna');

    // Prevent demoting the last admin
    if (parsed.data.role && parsed.data.role !== 'admin' && existing.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return errorResponse('Tidak dapat mengubah peran admin terakhir', 400);
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.nama ? { nama: parsed.data.nama } : {}),
        ...(parsed.data.role ? { role: parsed.data.role } : {}),
        ...(parsed.data.departmentId !== undefined ? { departmentId: parsed.data.departmentId } : {}),
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        department: { select: { id: true, nama: true } },
      },
    });

    return successResponse({ user });
  } catch (error) {
    console.error('PATCH /api/admin/users/[id] error:', error);
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
    
    // Cannot delete yourself
    if (id === session.userId) {
      return errorResponse('Tidak dapat menghapus akun sendiri', 400);
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return notFoundResponse('Pengguna');

    await prisma.user.delete({ where: { id } });
    return successResponse({ message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

