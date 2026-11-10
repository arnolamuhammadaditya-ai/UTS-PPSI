import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { verifyReportSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'admin') {
      return errorResponse('Hanya admin yang dapat memverifikasi laporan', 403);
    }

    const { id } = await params;
    const body = await request.json();
    
    const parsed = verifyReportSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
    }

    const { action, alasanTolak } = parsed.data;

    if (action === 'reject' && !alasanTolak) {
      return errorResponse('Alasan penolakan harus diisi', 400);
    }

    const report = await prisma.report.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!report) return notFoundResponse('Laporan');

    if (report.status !== 'Baru') {
      return errorResponse('Hanya laporan dengan status Baru yang dapat diverifikasi', 400);
    }

    const newStatus = action === 'verify' ? 'Terverifikasi' : 'Ditolak';

    const updatedReport = await prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id },
        data: {
          status: newStatus,
          alasanTolak: action === 'reject' ? alasanTolak : null,
        },
      });

      await tx.reportUpdate.create({
        data: {
          reportId: id,
          userId: session.userId,
          statusLama: 'Baru',
          statusBaru: newStatus,
          catatan:
            action === 'verify'
              ? 'Laporan telah diverifikasi oleh admin'
              : `Laporan ditolak: ${alasanTolak}`,
        },
      });

      return updated;
    });

    return successResponse({ report: { id: updatedReport.id, status: updatedReport.status } });
  } catch (error) {
    console.error('PATCH /api/admin/reports/[id]/verify error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

