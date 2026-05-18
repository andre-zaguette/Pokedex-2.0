import { cookies } from 'next/headers';

const NEST_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getAuthToken(): Promise<string | null> {
  const store = await cookies();
  return store.get('pokedex_token')?.value ?? null;
}

export async function nestFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${NEST_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
}

export const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};
