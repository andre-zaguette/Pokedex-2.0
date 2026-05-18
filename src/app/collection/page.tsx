import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CollectionClient } from '@/components/collection-client';

export default async function CollectionPage() {
  const store = await cookies();
  if (!store.get('pokedex_token')) {
    redirect('/login');
  }
  return <CollectionClient />;
}
