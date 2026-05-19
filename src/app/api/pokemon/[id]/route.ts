import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/pokemon/${id}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
