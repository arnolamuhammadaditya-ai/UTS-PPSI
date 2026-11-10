import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { signToken, setAuthCookie } from '@/lib/auth';
import { errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
    }

    const { nama, email, password, noHp } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse('Email sudah terdaftar', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        nama,
        email,
        passwordHash,
        noHp: noHp || null,
        role: 'warga',
      },
    });

    // Sign JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      nama: user.nama,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            nama: user.nama,
            email: user.email,
            role: user.role,
          },
        },
      },
      { status: 201 }
    );

    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

