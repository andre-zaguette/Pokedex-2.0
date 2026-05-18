import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PokedexClient } from '@/components/pokedex-client';

export default async function PokedexPage() {
  const store = await cookies();
  if (!store.get('pokedex_token')) {
    redirect('/login');
  }
  return <PokedexClient />;
}
