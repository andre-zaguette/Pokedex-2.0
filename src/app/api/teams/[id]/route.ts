import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, nestFetch } from '@/lib/nest-client';

const UNAUTHORIZED = NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getAuthToken();
  if (!token) return UNAUTHORIZED;

  const body = await req.json();
  const res = await nestFetch(`/teams/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getAuthToken();
  if (!token) return UNAUTHORIZED;

  const res = await nestFetch(`/teams/${id}`, token, {
    method: 'DELETE',
  });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
