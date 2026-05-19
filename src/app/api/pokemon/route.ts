import { NextRequest, NextResponse } from 'next/server';
import { nestFetch } from '@/lib/nest-client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const limit = searchParams.get('limit') ?? '12';
  const offset = searchParams.get('offset') ?? '0';
  const region = searchParams.get('region') ?? '';

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/pokemon?search=${search}&limit=${limit}&offset=${offset}&region=${region}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
