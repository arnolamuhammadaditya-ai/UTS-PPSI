import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Departments
  const dinasInfrastruktur = await prisma.department.upsert({
    where: { id: 'dept-infrastruktur' },
    update: {},
    create: {
      id: 'dept-infrastruktur',
      nama: 'Dinas Pekerjaan Umum dan Penataan Ruang',
      kontak: '0721-123456',
    },
  });

  const dinasLingkungan = await prisma.department.upsert({
    where: { id: 'dept-lingkungan' },
    update: {},
    create: {
      id: 'dept-lingkungan',
      nama: 'Dinas Lingkungan Hidup',
      kontak: '0721-234567',
    },
  });

  const dinasPerhubungan = await prisma.department.upsert({
    where: { id: 'dept-perhubungan' },
    update: {},
    create: {
      id: 'dept-perhubungan',
      nama: 'Dinas Perhubungan',
      kontak: '0721-345678',
    },
  });

  const dinasKebersihan = await prisma.department.upsert({
    where: { id: 'dept-kebersihan' },
    update: {},
    create: {
      id: 'dept-kebersihan',
      nama: 'Dinas Kebersihan dan Pertamanan',
      kontak: '0721-456789',
    },
  });

  console.log('✅ Departments created');

  // Create Categories
  await prisma.category.upsert({
    where: { id: 'cat-jalan' },
    update: {},
    create: {
      id: 'cat-jalan',
      nama: 'Jalan Rusak',
      departmentId: dinasInfrastruktur.id,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-lampu' },
    update: {},
    create: {
      id: 'cat-lampu',
      nama: 'Lampu Jalan Mati',
      departmentId: dinasPerhubungan.id,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-sampah' },
    update: {},
    create: {
      id: 'cat-sampah',
      nama: 'Sampah Menumpuk',
      departmentId: dinasKebersihan.id,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-drainase' },
    update: {},
    create: {
      id: 'cat-drainase',
      nama: 'Drainase Tersumbat',
      departmentId: dinasInfrastruktur.id,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-taman' },
    update: {},
    create: {
      id: 'cat-taman',
      nama: 'Taman dan Ruang Terbuka Hijau',
      departmentId: dinasLingkungan.id,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-lainnya' },
    update: {},
    create: {
      id: 'cat-lainnya',
      nama: 'Lainnya',
      departmentId: dinasInfrastruktur.id,
    },
  });

  console.log('✅ Categories created');

  // Create Admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@silaporkota.go.id' },
    update: {},
    create: {
      id: 'user-admin',
      nama: 'Administrator Sistem',
      email: 'admin@silaporkota.go.id',
      passwordHash: adminPasswordHash,
      role: Role.admin,
    },
  });

  // Create Officer user
  const officerPasswordHash = await bcrypt.hash('petugas123', 12);
  await prisma.user.upsert({
    where: { email: 'petugas@silaporkota.go.id' },
    update: {},
    create: {
      id: 'user-petugas',
      nama: 'Petugas Lapangan',
      email: 'petugas@silaporkota.go.id',
      passwordHash: officerPasswordHash,
      role: Role.petugas,
      departmentId: dinasInfrastruktur.id,
    },
  });

  // Create Warga user
  const wargaPasswordHash = await bcrypt.hash('warga123', 12);
  await prisma.user.upsert({
    where: { email: 'warga@example.com' },
    update: {},
    create: {
      id: 'user-warga',
      nama: 'Warga Demo',
      email: 'warga@example.com',
      passwordHash: wargaPasswordHash,
      role: Role.warga,
      noHp: '081234567890',
    },
  });

  console.log('✅ Users created');
  console.log('');
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin   : admin@silaporkota.go.id / admin123');
  console.log('  Petugas : petugas@silaporkota.go.id / petugas123');
  console.log('  Warga   : warga@example.com / warga123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

