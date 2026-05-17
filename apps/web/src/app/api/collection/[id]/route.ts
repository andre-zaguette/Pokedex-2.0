import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, nestFetch } from '@/lib/nest-client';

const UNAUTHORIZED = NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const token = await getAuthToken();
  if (!token) return UNAUTHORIZED;

  const { id } = await params;
  const body = await req.json();
  const res = await nestFetch(`/collection/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const token = await getAuthToken();
  if (!token) return UNAUTHORIZED;

  const { id } = await params;
  const res = await nestFetch(`/collection/${id}`, token, { method: 'DELETE' });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
