import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { ratingSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'warga') {
      return errorResponse('Hanya warga yang dapat memberi rating', 403);
    }

    const { id } = await params;
    const body = await request.json();
    
    const parsed = ratingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
    }

    // Find report - must be owned by user and status Selesai
    const report = await prisma.report.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, rating: { select: { id: true } } },
    });

    if (!report) return notFoundResponse('Laporan');
    
    if (report.userId !== session.userId) {
      return errorResponse('Anda tidak memiliki akses ke laporan ini', 403);
    }

    if (report.status !== 'Selesai') {
      return errorResponse('Rating hanya dapat diberikan pada laporan yang sudah selesai', 400);
    }

    if (report.rating) {
      return errorResponse('Anda sudah memberikan rating untuk laporan ini', 409);
    }

    const rating = await prisma.rating.create({
      data: {
        reportId: id,
        userId: session.userId,
        skor: parsed.data.skor,
        komentar: parsed.data.komentar,
      },
    });

    return successResponse({ rating }, 201);
  } catch (error) {
    console.error('POST /api/reports/[id]/rating error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

