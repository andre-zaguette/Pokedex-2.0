import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, nestFetch } from '@/lib/nest-client';

const UNAUTHORIZED = NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });

export async function GET() {
  const token = await getAuthToken();
  if (!token) return UNAUTHORIZED;

  const res = await nestFetch('/teams', token);
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const token = await getAuthToken();
  if (!token) return UNAUTHORIZED;

  const body = await req.json();
  const res = await nestFetch('/teams', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
