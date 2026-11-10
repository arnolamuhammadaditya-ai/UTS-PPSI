import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== 'admin') {
      return errorResponse('Hanya admin yang dapat melihat statistik', 403);
    }

    const [
      totalReports,
      byStatus,
      byCategory,
      byDepartment,
      avgRating,
      recentReports,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.report.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 5,
      }),
      prisma.report.groupBy({
        by: ['departmentId'],
        _count: { departmentId: true },
        where: { departmentId: { not: null } },
      }),
      prisma.rating.aggregate({
        _avg: { skor: true },
        _count: { skor: true },
      }),
      prisma.report.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          judul: true,
          status: true,
          createdAt: true,
          category: { select: { nama: true } },
        },
      }),
    ]);

    // Get category names for byCategory
    const categoryIds = byCategory.map((c) => c.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, nama: true },
    });

    // Get department names for byDepartment
    const departmentIds = byDepartment
      .filter((d) => d.departmentId)
      .map((d) => d.departmentId as string);
    const departments = await prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, nama: true },
    });

    return successResponse({
      totalReports,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      byCategory: byCategory.map((c) => ({
        category: categories.find((cat) => cat.id === c.categoryId)?.nama ?? 'Unknown',
        count: c._count.categoryId,
      })),
      byDepartment: byDepartment.map((d) => ({
        department: departments.find((dep) => dep.id === d.departmentId)?.nama ?? 'Belum Didisposisi',
        count: d._count.departmentId,
      })),
      avgRating: {
        value: avgRating._avg.skor ?? 0,
        count: avgRating._count.skor,
      },
      recentReports,
    });
  } catch (error) {
    console.error('GET /api/admin/stats error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

