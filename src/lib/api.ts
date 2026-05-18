import { CollectionEntry, PokemonSummary, User } from './types';

const NEST_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const raw = body?.message;
    const message = Array.isArray(raw) ? raw[0] : typeof raw === 'string' ? raw : 'Request failed.';
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  register: (payload: { name: string; email: string; password: string }) =>
    request<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  searchPokemon: (search: string, offset = 0, region = '') =>
    request<{ total: number; items: PokemonSummary[]; hasMore: boolean }>(
      `${NEST_URL}/pokemon?search=${encodeURIComponent(search)}&limit=12&offset=${offset}&region=${region}`,
    ),

  getPokemonDetail: (idOrName: string | number) =>
    request<PokemonSummary>(`${NEST_URL}/pokemon/${idOrName}`),

  getCollection: () =>
    request<CollectionEntry[]>('/api/collection'),

  addToCollection: (payload: {
    pokeApiId: number;
    pokemonName: string;
    spriteUrl?: string | null;
    isShiny: boolean;
    status: 'seen' | 'caught';
    gender: 'male' | 'female' | 'unknown';
    note?: string;
  }) =>
    request<CollectionEntry>('/api/collection', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCollectionItem: (
    id: string,
    payload: Partial<{
      isShiny: boolean;
      isFavorite: boolean;
      status: 'seen' | 'caught';
      gender: 'male' | 'female' | 'unknown';
      ability: string | null;
      item: string | null;
      move1: string | null;
      move2: string | null;
      move3: string | null;
      move4: string | null;
      nature: string | null;
      ev_hp: number;
      ev_atk: number;
      ev_def: number;
      ev_spa: number;
      ev_spd: number;
      ev_spe: number;
      note: string | null;
    }>,
  ) =>
    request<CollectionEntry>(`/api/collection/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteCollectionItem: (id: string) =>
    request<{ success: boolean }>(`/api/collection/${id}`, {
      method: 'DELETE',
    }),

  // Teams
  getTeams: () => request<Team[]>('/api/teams'),
  createTeam: (name: string) =>
    request<Team>('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  updateTeam: (id: string, payload: { name?: string; memberIds?: string[] }) =>
    request<Team>(`/api/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteTeam: (id: string) =>
    request<{ success: boolean }>(`/api/teams/${id}`, {
      method: 'DELETE',
    }),
};
