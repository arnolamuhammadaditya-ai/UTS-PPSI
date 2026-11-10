import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { updateStatusSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';
import { uploadMultiplePhotos } from '@/lib/upload';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'petugas') {
      return errorResponse('Hanya petugas yang dapat mengupdate status laporan', 403);
    }

    const { id } = await params;
    const formData = await request.formData();

    const bodyData = {
      status: formData.get('status') as string,
      catatan: formData.get('catatan') as string | null,
    };

    const parsed = updateStatusSchema.safeParse(bodyData);
    if (!parsed.success) {
      return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
    }

    // Verify report is assigned to this officer
    const report = await prisma.report.findUnique({
      where: { id },
      select: { id: true, assignedTo: true, status: true },
    });

    if (!report) return notFoundResponse('Laporan');
    
    if (report.assignedTo !== session.userId) {
      return errorResponse('Laporan tidak ditugaskan kepada Anda', 403);
    }

    if (report.status === 'Selesai' || report.status === 'Ditolak') {
      return errorResponse('Status laporan tidak dapat diubah', 400);
    }

    // Handle evidence photo upload
    const evidenceFiles: File[] = [];
    for (let i = 1; i <= 3; i++) {
      const file = formData.get(`bukti${i}`) as File | null;
      if (file && file.size > 0) {
        evidenceFiles.push(file);
      }
    }

    let uploadedUrls: string[] = [];
    if (evidenceFiles.length > 0) {
      const uploadResults = await uploadMultiplePhotos(evidenceFiles, 'evidence');
      const failedUploads = uploadResults.filter((r) => !r.success);
      if (failedUploads.length > 0) {
        return errorResponse(failedUploads[0].error ?? 'Gagal mengupload foto bukti', 400);
      }
      uploadedUrls = uploadResults.filter((r) => r.success).map((r) => r.url);
    }

    const updatedReport = await prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id },
        data: { status: parsed.data.status },
      });

      await tx.reportUpdate.create({
        data: {
          reportId: id,
          userId: session.userId,
          statusLama: report.status,
          statusBaru: parsed.data.status,
          catatan: parsed.data.catatan ?? null,
        },
      });

      if (uploadedUrls.length > 0) {
        await tx.reportPhoto.createMany({
          data: uploadedUrls.map((url) => ({
            reportId: id,
            url,
            jenis: 'bukti' as const,
          })),
        });
      }

      return updated;
    });

    return successResponse({ report: { id: updatedReport.id, status: updatedReport.status } });
  } catch (error) {
    console.error('PATCH /api/officer/reports/[id]/status error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

