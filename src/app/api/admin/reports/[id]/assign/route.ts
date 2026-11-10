import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { assignReportSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'admin') {
      return errorResponse('Hanya admin yang dapat mendisposisikan laporan', 403);
    }

    const { id } = await params;
    const body = await request.json();
    
    const parsed = assignReportSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
    }

    const { departmentId, assignedTo } = parsed.data;

    const report = await prisma.report.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!report) return notFoundResponse('Laporan');

    if (report.status !== 'Terverifikasi') {
      return errorResponse('Hanya laporan terverifikasi yang dapat didisposisikan', 400);
    }

    // Verify department exists
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) return notFoundResponse('Dinas');

    // Verify officer if provided
    if (assignedTo) {
      const officer = await prisma.user.findUnique({
        where: { id: assignedTo },
        select: { id: true, role: true, departmentId: true },
      });
      if (!officer || officer.role !== 'petugas') {
        return notFoundResponse('Petugas');
      }
    }

    const updatedReport = await prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id },
        data: {
          departmentId,
          assignedTo: assignedTo ?? null,
        },
      });

      await tx.reportUpdate.create({
        data: {
          reportId: id,
          userId: session.userId,
          statusLama: 'Terverifikasi',
          statusBaru: 'Terverifikasi',
          catatan: `Laporan didisposisikan ke ${department.nama}${assignedTo ? ' dan ditugaskan ke petugas' : ''}`,
        },
      });

      return updated;
    });

    return successResponse({ report: { id: updatedReport.id } });
  } catch (error) {
    console.error('PATCH /api/admin/reports/[id]/assign error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

