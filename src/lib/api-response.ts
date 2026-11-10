import { NextResponse } from 'next/server';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function unauthorizedResponse() {
  return errorResponse('Tidak terautentikasi. Silakan login terlebih dahulu.', 401);
}

export function forbiddenResponse() {
  return errorResponse('Anda tidak memiliki izin untuk mengakses resource ini.', 403);
}

export function notFoundResponse(resource = 'Resource') {
  return errorResponse(`${resource} tidak ditemukan.`, 404);
}

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') return unauthorizedResponse();
    if (error.message === 'FORBIDDEN') return forbiddenResponse();
  }
  console.error('API Error:', error);
  return errorResponse('Terjadi kesalahan pada server.', 500);
}

