'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { CollectionEntry } from '@/lib/types';
import Link from 'next/link';
import { navigation } from '@/lib/navigation';

const genderOptions: Array<CollectionEntry['gender']> = ['male', 'female', 'unknown'];

export function CollectionClient() {
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadCollection();
  }, []);

  async function loadCollection() {
    try {
      setLoading(true);
      const items = await api.getCollection();
      setCollection(items);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigation.assign('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Falha ao carregar coleção.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCollectionChange(
    item: CollectionEntry,
    changes: Partial<Pick<CollectionEntry, 'isShiny' | 'gender' | 'note'>>,
  ) {
    setError(null);

    try {
      await api.updateCollectionItem(item.id, changes);
      // Update local state for better UX before reloading or just reload
      setCollection((current) =>
        current.map((c) => (c.id === item.id ? { ...c, ...changes } : c))
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigation.assign('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Deseja remover este pokemon da sua coleção?')) return;

    try {
      await api.deleteCollectionItem(id);
      setCollection((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError('Falha ao remover item.');
    }
  }

  async function handleLogout() {
    await api.logout();
    navigation.assign('/login');
  }

  return (
    <main className="shell">
      <section className="hero panel">
        <div className="stack-tight">
          <p className="eyebrow">Sua Coleção</p>
          <h1>Gerencie seus pokemons capturados</h1>
          <p className="muted">
            Aqui você pode ver todos os pokemons que marcou como seus, ajustar o gênero, se é shiny ou adicionar notas.
          </p>
        </div>

        <div className="hero-actions">
          <Link href="/pokedex" className="link-button">
            Voltar para Pokedex
          </Link>
          <button onClick={() => void handleLogout()}>Sair</button>
        </div>
      </section>

      {error ? <p className="error banner">{error}</p> : null}

      {loading ? (
        <p className="muted">Carregando sua coleção...</p>
      ) : collection.length === 0 ? (
        <section className="panel">
          <p>Sua coleção está vazia. Vá até a <Link href="/pokedex">Pokedex</Link> para adicionar pokemons.</p>
        </section>
      ) : (
        <section className="panel stack">
          <div className="stack-tight">
            <p className="eyebrow">Sua Coleção ({collection.length})</p>
            <h2>Detalhes e observações</h2>
          </div>

          <div className="collection-grid">
            {collection.map((item) => (
              <article key={item.id} className="collection-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>{item.pokemonName}</strong>
                    <p className="muted">#{item.pokeApiId}</p>
                  </div>
                  <button 
                    className="link-button" 
                    style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: 'var(--error, #ff4444)' }}
                    onClick={() => void handleRemove(item.id)}
                  >
                    Remover
                  </button>
                </div>

                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={item.isShiny}
                    onChange={(event) =>
                      void handleCollectionChange(item, { isShiny: event.target.checked })
                    }
                  />
                  <span>Shiny</span>
                </label>

                <select
                  value={item.gender}
                  onChange={(event) =>
                    void handleCollectionChange(item, {
                      gender: event.target.value as CollectionEntry['gender'],
                    })
                  }
                >
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <textarea
                  rows={2}
                  defaultValue={item.note ?? ''}
                  placeholder="Observações"
                  onBlur={(event) =>
                    void handleCollectionChange(item, {
                      note: event.target.value,
                    })
                  }
                />
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
