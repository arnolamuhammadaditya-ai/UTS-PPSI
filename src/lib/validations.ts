import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  noHp: z
    .string()
    .regex(/^[0-9+\-\s()]{10,15}$/, 'Format nomor HP tidak valid')
    .optional()
    .or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
});

// Report schemas
export const createReportSchema = z.object({
  judul: z.string().min(5, 'Judul minimal 5 karakter').max(200, 'Judul maksimal 200 karakter'),
  deskripsi: z
    .string()
    .min(20, 'Deskripsi minimal 20 karakter')
    .max(2000, 'Deskripsi maksimal 2000 karakter'),
  categoryId: z.string().min(1, 'Kategori harus dipilih'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter').max(500, 'Alamat maksimal 500 karakter'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const verifyReportSchema = z.object({
  action: z.enum(['verify', 'reject']),
  alasanTolak: z.string().optional(),
});

export const assignReportSchema = z.object({
  departmentId: z.string().min(1, 'Dinas harus dipilih'),
  assignedTo: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['Diproses', 'Selesai']),
  catatan: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional(),
});

export const ratingSchema = z.object({
  skor: z.number().int().min(1, 'Skor minimal 1').max(5, 'Skor maksimal 5'),
  komentar: z.string().max(500, 'Komentar maksimal 500 karakter').optional(),
});

// Category schemas
export const categorySchema = z.object({
  nama: z.string().min(2, 'Nama kategori minimal 2 karakter').max(100),
  departmentId: z.string().optional(),
});

// Department schemas
export const departmentSchema = z.object({
  nama: z.string().min(2, 'Nama dinas minimal 2 karakter').max(200),
  kontak: z.string().max(50).optional(),
});

// User management schemas
export const updateUserSchema = z.object({
  nama: z.string().min(2).max(100).optional(),
  role: z.enum(['warga', 'petugas', 'admin']).optional(),
  departmentId: z.string().optional().nullable(),
});

// Query param schemas
export const reportQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z
    .enum(['Baru', 'Terverifikasi', 'Diproses', 'Selesai', 'Ditolak'])
    .optional(),
  categoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  q: z.string().max(100).optional(),
});

