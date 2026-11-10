import { getSession } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }
  return NextResponse.json({ success: true, data: { user: session } });
}

