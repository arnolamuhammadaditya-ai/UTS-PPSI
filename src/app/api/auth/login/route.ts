import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { signToken, setAuthCookie } from '@/lib/auth';
import { errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
    }

    const { email, password } = parsed.data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse('Email atau password salah', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return errorResponse('Email atau password salah', 401);
    }

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
      { status: 200 }
    );

    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Terjadi kesalahan pada server', 500);
  }
}

