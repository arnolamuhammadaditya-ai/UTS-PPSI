import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { reportQuerySchema, createReportSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { uploadMultiplePhotos } from '@/lib/upload';

import { ReportStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const parsed = reportQuerySchema.safeParse({
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 10,
      status: searchParams.get('status') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      q: searchParams.get('q') ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse('Parameter tidak valid', 400, parsed.error.flatten().fieldErrors);
    }

    const { page, limit, status, categoryId, startDate, endDate, q } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      // Public only sees verified+ reports (not Baru/Ditolak)
      status: status
        ? { equals: status }
        : { in: ['Terverifikasi', 'Diproses', 'Selesai'] as ReportStatus[] },
      ...(categoryId ? { categoryId } : {}),
      ...(q ? { judul: { contains: q, mode: 'insensitive' as const } } : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
            },
          }
        : {}),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          judul: true,
          deskripsi: true,
          alamat: true,
          lat: true,
          lng: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, nama: true } },
          department: { select: { id: true, nama: true } },
          // Hide personal data
          user: { select: { nama: true } },
          photos: {
            where: { jenis: 'awal' },
            take: 1,
            select: { url: true },
          },
          _count: { select: { updates: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return successResponse({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'warga') {
      return errorResponse('Hanya warga yang dapat membuat laporan', 403);
    }

    const formData = await request.formData();
    
    const bodyData = {
      judul: formData.get('judul') as string,
      deskripsi: formData.get('deskripsi') as string,
      categoryId: formData.get('categoryId') as string,
      alamat: formData.get('alamat') as string,
      lat: formData.get('lat') ? parseFloat(formData.get('lat') as string) : undefined,
      lng: formData.get('lng') ? parseFloat(formData.get('lng') as string) : undefined,
    };

    const parsed = createReportSchema.safeParse(bodyData);
    if (!parsed.success) {
      return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
    }

    // Check category exists
    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      include: { department: true },
    });
    if (!category) {
      return errorResponse('Kategori tidak ditemukan', 404);
    }

    // Handle photo uploads
    const photoFiles: File[] = [];
    for (let i = 1; i <= 3; i++) {
      const file = formData.get(`foto${i}`) as File | null;
      if (file && file.size > 0) {
        photoFiles.push(file);
      }
    }

    if (photoFiles.length === 0) {
      return errorResponse('Minimal 1 foto harus diunggah', 400);
    }

    const uploadResults = await uploadMultiplePhotos(photoFiles, 'reports');
    const failedUploads = uploadResults.filter((r) => !r.success);
    if (failedUploads.length > 0) {
      return errorResponse(failedUploads[0].error ?? 'Gagal mengupload foto', 400);
    }

    // Create report with photos in transaction
    const report = await prisma.$transaction(async (tx) => {
      const newReport = await tx.report.create({
        data: {
          userId: session.userId,
          categoryId: parsed.data.categoryId,
          judul: parsed.data.judul,
          deskripsi: parsed.data.deskripsi,
          alamat: parsed.data.alamat,
          lat: parsed.data.lat,
          lng: parsed.data.lng,
          status: 'Baru',
        },
      });

      await tx.reportPhoto.createMany({
        data: uploadResults
          .filter((r) => r.success)
          .map((r) => ({
            reportId: newReport.id,
            url: r.url,
            jenis: 'awal' as const,
          })),
      });

      await tx.reportUpdate.create({
        data: {
          reportId: newReport.id,
          userId: session.userId,
          statusBaru: 'Baru',
          catatan: 'Laporan berhasil dibuat',
        },
      });

      return newReport;
    });

    return successResponse({ report: { id: report.id } }, 201);
  } catch (error) {
    console.error('POST /api/reports error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

