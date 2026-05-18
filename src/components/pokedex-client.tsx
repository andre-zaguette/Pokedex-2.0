'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { CollectionEntry, PokemonSummary } from '@/lib/types';
import { navigation } from '@/lib/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type SearchState = {
  results: PokemonSummary[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
};

const REGIONS = [
  { id: '', name: 'National Dex', total: 1025 },
  { id: 'kanto', name: 'Kanto', total: 151 },
  { id: 'johto', name: 'Johto', total: 100 },
  { id: 'hoenn', name: 'Hoenn', total: 135 },
  { id: 'sinnoh', name: 'Sinnoh', total: 107 },
  { id: 'unova', name: 'Unova', total: 156 },
  { id: 'kalos', name: 'Kalos', total: 72 },
  { id: 'alola', name: 'Alola', total: 88 },
  { id: 'galar', name: 'Galar', total: 89 },
  { id: 'paldea', name: 'Paldea', total: 120 },
];

const TYPES = ['bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying', 'ghost', 'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock', 'steel', 'water'];

export function PokedexClient() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'seen' | 'caught' | 'shiny'>('all');
  const [state, setState] = useState<SearchState>({
    results: [],
    loading: true,
    hasMore: false,
    error: null,
  });
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonSummary | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const observer = useRef<IntersectionObserver | null>(null);

  const loadInitial = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const [response, userColl] = await Promise.all([
        api.searchPokemon('', 0, region),
        api.getCollection(),
      ]);
      setState({ 
        results: response.items || [], 
        loading: false, 
        hasMore: response.hasMore,
        error: null 
      });
      setCollection(userColl);
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Falha ao carregar Pokédex.' }));
    }
  }, [region]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  async function handleSearch(query: string) {
    setSearch(query);
    setState((prev) => ({ ...prev, loading: true, results: [] }));
    try {
      const response = await api.searchPokemon(query, 0, region);
      setState({ 
        results: response.items || [], 
        loading: false, 
        hasMore: response.hasMore, 
        error: null 
      });
    } catch (error) {
      setState({ results: [], loading: false, hasMore: false, error: 'Nenhum Pokémon encontrado.' });
    }
  }

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    setSearch('');
    setTypeFilter('');
    setStatusFilter('all');
  };

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore || search.length > 0 || typeFilter !== '' || statusFilter !== 'all') return;
    setState(prev => ({ ...prev, loading: true }));
    try {
      const response = await api.searchPokemon('', state.results.length, region);
      setState(prev => ({
        results: [...prev.results, ...(response.items || [])],
        loading: false,
        hasMore: response.hasMore,
        error: null
      }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.loading, state.hasMore, state.results.length, search, region, typeFilter]);

  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (state.loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && state.hasMore && search.length === 0 && typeFilter === '' && statusFilter === 'all') {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [state.loading, state.hasMore, loadMore, search.length, typeFilter, statusFilter]);

  async function handleOpenDetail(pokemon: PokemonSummary | { id: number }) {
    setLoadingDetail(true);
    try {
      const detail = await api.getPokemonDetail(pokemon.id);
      setSelectedPokemon(detail);
    } catch (error) {
      console.error('Failed to load detail', error);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleInteraction(type: 'seen' | 'caught' | 'shiny' | 'male' | 'female' | 'unknown' | 'favorite') {
    if (!selectedPokemon) return;
    const existing = collection.find(c => c.pokeApiId === selectedPokemon.id);
    try {
      if (existing) {
        let update: any = {};
        if (type === 'seen') update = { status: 'seen' };
        if (type === 'caught') update = { status: 'caught' };
        if (type === 'shiny') update = { isShiny: !existing.isShiny };
        if (type === 'favorite') update = { isFavorite: !existing.isFavorite };
        if (type === 'male' || type === 'female' || type === 'unknown') update = { gender: type };
        const updated = await api.updateCollectionItem(existing.id, update);
        setCollection(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const newItem = await api.addToCollection({
          pokeApiId: selectedPokemon.id,
          pokemonName: selectedPokemon.name,
          spriteUrl: selectedPokemon.spriteUrl,
          isShiny: type === 'shiny',
          status: type === 'caught' ? 'caught' : 'seen',
          gender: (type === 'male' || type === 'female' || type === 'unknown') ? type : 'unknown'
        });
        setCollection(prev => [...prev, newItem]);
        if (type === 'favorite') {
          // Immediately update favorite if it was a new creation
          const favUpdated = await api.updateCollectionItem(newItem.id, { isFavorite: true });
          setCollection(prev => prev.map(c => c.id === favUpdated.id ? favUpdated : c));
        }
      }
    } catch (error) {
      console.error('Interação falhou', error);
    }
  }

  const navigatePokemon = (direction: 'next' | 'prev') => {
    const currentIndex = state.results.findIndex(p => p.id === selectedPokemon?.id);
    if (currentIndex === -1) return;
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < state.results.length) {
      handleOpenDetail(state.results[nextIndex]);
    }
  };

  const playCry = () => {
    if (selectedPokemon?.cryUrl) {
      const audio = new Audio(selectedPokemon.cryUrl);
      audio.volume = 0.5;
      audio.play();
    }
  };

  const logout = () => {
    api.logout();
    navigation.assign('/login');
  };

  const goToProfile = () => {
    navigation.assign('/profile');
  };

  const getDisplayImage = (pokemon: PokemonSummary, entry?: CollectionEntry) => {
    const isShiny = entry?.isShiny;
    const isFemale = entry?.gender === 'female';
    if (isShiny) {
      return (isFemale && pokemon.femaleShinySpriteUrl) ? pokemon.femaleShinySpriteUrl : (pokemon.shinySpriteUrl || pokemon.spriteUrl);
    }
    return (isFemale && pokemon.femaleSpriteUrl) ? pokemon.femaleSpriteUrl : pokemon.artworkUrl;
  };

  const filteredResults = state.results.filter(p => {
    const matchesType = typeFilter ? p.types.includes(typeFilter) : true;
    const userItem = collection.find(c => c.pokeApiId === p.id);
    
    let matchesStatus = true;
    if (statusFilter === 'seen') matchesStatus = !!userItem && userItem.status === 'seen';
    if (statusFilter === 'caught') matchesStatus = !!userItem && userItem.status === 'caught';
    if (statusFilter === 'shiny') matchesStatus = !!userItem && userItem.isShiny;
    
    return matchesType && matchesStatus;
  });

  const currentRegion = REGIONS.find(r => r.id === region) || REGIONS[0];
  const regionCaught = collection.filter(c => c.status === 'caught').length;
  const progressPercent = Math.min(Math.round((regionCaught / currentRegion.total) * 100), 100);

  return (
    <main className="pokedex-list-screen">
      <header className="pokedex-header">
        <div className="pokedex-title-row">
          <div className="pokedex-title-left">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokeball" style={{ width: '24px', height: '24px' }} />
            <h1>Pokédex</h1>
          </div>
          <div className="pokedex-nav-right">
            <button onClick={() => navigation.assign('/teams')} className="meta-link">Times</button>
            <button onClick={goToProfile} className="meta-link">Perfil</button>
            <button onClick={logout} className="meta-link">Sair</button>
          </div>
        </div>

        <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem' }}>
          <span className="progress-label">{currentRegion.name}: {regionCaught}/{currentRegion.total} ({progressPercent}%)</span>
          <div className="progress-container"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
        </div>
        
        <div className="pokedex-search-row">
          <div className="pokedex-search-container">
            <input className="pokedex-search-input" placeholder="Search" value={search} onChange={(e) => handleSearch(e.target.value)} />
            <svg className="pokedex-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <select className="sort-button" style={{ width: 'auto', borderRadius: '18px', padding: '0 10px', fontSize: '12px', appearance: 'none', textAlign: 'center' }} value={region} onChange={(e) => handleRegionChange(e.target.value)}>
            {REGIONS.map(r => <option key={r.id} value={r.id}>{r.id === '' ? 'Region' : r.name}</option>)}
          </select>
        </div>
        <div className="type-filter-bar">
          <span onClick={() => setTypeFilter('')} className={`type-tag ${typeFilter === '' ? 'active' : ''}`}>All</span>
          {TYPES.map(t => (
            <span key={t} onClick={() => setTypeFilter(t)} className={`type-tag ${typeFilter === t ? 'active' : ''}`} style={{ borderColor: `var(--type-${t})` }}>{t}</span>
          ))}
        </div>

        <div className="status-filter-bar">
          <span onClick={() => setStatusFilter('all')} className={`status-tag ${statusFilter === 'all' ? 'active-seen' : ''}`}>Todos</span>
          <span onClick={() => setStatusFilter('seen')} className={`status-tag ${statusFilter === 'seen' ? 'active-seen' : ''}`}>Vistos</span>
          <span onClick={() => setStatusFilter('caught')} className={`status-tag ${statusFilter === 'caught' ? 'active-caught' : ''}`}>Capturados</span>
          <span onClick={() => setStatusFilter('shiny')} className={`status-tag ${statusFilter === 'shiny' ? 'active-shiny' : ''}`}>Shinies</span>
        </div>
      </header>

      <div className="pokedex-content">
        <section className="pokedex-grid">
          <AnimatePresence>
            {filteredResults.map((pokemon, index) => {
              const userItem = collection.find(c => c.pokeApiId === pokemon.id);
              const isCaught = userItem?.status === 'caught';
              const isSeen = userItem?.status === 'seen';
              const isFavorite = userItem?.isFavorite;
              let imgOverlay = null;
              let imgStyle: React.CSSProperties = {};
              if (!userItem) {
                imgOverlay = <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--pk-gray-medium)' }}>?</span>;
                imgStyle = { opacity: 0, visibility: 'hidden' };
              } else if (isSeen && !isCaught) {
                imgStyle = { filter: 'grayscale(1)', opacity: 0.6 };
              }
              const displayImg = getDisplayImage(pokemon, userItem);
              const isLast = index === filteredResults.length - 1;

              return (
                <motion.article 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  ref={isLast ? lastElementRef : null} 
                  key={pokemon.id} 
                  className="pk-card" 
                  onClick={() => handleOpenDetail(pokemon)}
                >
                  <span className="pk-card-id">#{String(pokemon.id).padStart(3, '0')}</span>
                  {isFavorite && (
                    <div style={{ position: 'absolute', top: '4px', left: '4px', color: '#ff4d4f' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '72px' }}>
                    {imgOverlay}
                    <motion.img 
                      layoutId={`pokemon-image-${pokemon.id}`}
                      src={displayImg || ''} 
                      alt={pokemon.name} 
                      className="pk-card-img" 
                      style={{ ...imgStyle, position: imgOverlay ? 'absolute' : 'relative' }} 
                    />
                  </div>
                  <div className="pk-card-footer">
                    <h3 className="pk-card-name">{pokemon.name}</h3>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </section>
        {state.loading && <p style={{ textAlign: 'center', color: 'var(--pk-gray-medium)', marginTop: '1.5rem', fontSize: '12px' }}>Explorando...</p>}
      </div>

      <AnimatePresence>
        {selectedPokemon && (
          <motion.div 
            className="modal-overlay" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPokemon(null)}
          >
            <motion.div 
              className="modal-container" 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              style={{ backgroundColor: `var(--type-${selectedPokemon.types[0]})` }} 
              onClick={(e) => e.stopPropagation()}
            >
              <header className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button style={{background:'none',border:'none',color:'white',cursor:'pointer',display:'flex'}} onClick={() => setSelectedPokemon(null)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  </button>
                  <h2 style={{ fontSize: selectedPokemon.name.length > 12 ? '18px' : '24px' }}>{selectedPokemon.name}</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleInteraction('favorite'); }}
                    style={{ background: 'none', border: 'none', color: collection.find(c => c.pokeApiId === selectedPokemon.id)?.isFavorite ? '#ff4d4f' : 'white', cursor: 'pointer' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={collection.find(c => c.pokeApiId === selectedPokemon.id)?.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>
                  <button className="cry-btn" onClick={playCry}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 10 0 0 1 0 7.07"/></svg>
                  </button>
                  <span>#{String(selectedPokemon.id).padStart(3, '0')}</span>
                </div>
              </header>
              
              <div className="modal-image-wrap">
                <button className="nav-btn" style={{ position: 'absolute', left: '1rem' }} onClick={() => navigatePokemon('prev')}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg></button>
                <motion.img 
                  layoutId={`pokemon-image-${selectedPokemon.id}`}
                  src={getDisplayImage(selectedPokemon, collection.find(c => c.pokeApiId === selectedPokemon.id)) || ''} 
                  alt={selectedPokemon.name} 
                />
                <button className="nav-btn" style={{ position: 'absolute', right: '1rem' }} onClick={() => navigatePokemon('next')}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg></button>
              </div>
              
              <div className="modal-card">
                <div className="type-row">
                  {selectedPokemon.types.map(t => <span key={t} className="type-chip" style={{ backgroundColor: `var(--type-${t})` }}>{t}</span>)}
                </div>

                <div className="interaction-bar">
                   <button onClick={() => handleInteraction('seen')} disabled={collection.find(c => c.pokeApiId === selectedPokemon.id)?.status === 'caught'} className={`btn-action ${collection.find(c => c.pokeApiId === selectedPokemon.id)?.status === 'seen' ? 'active-seen' : ''}`}>Visto</button>
                   <button onClick={() => handleInteraction('caught')} className={`btn-action ${collection.find(c => c.pokeApiId === selectedPokemon.id)?.status === 'caught' ? 'active-caught' : ''}`}>Capturado</button>
                   <button onClick={() => handleInteraction('shiny')} disabled={collection.find(c => c.pokeApiId === selectedPokemon.id)?.status !== 'caught'} className={`btn-action ${collection.find(c => c.pokeApiId === selectedPokemon.id)?.isShiny ? 'active-shiny' : ''}`}>Shiny</button>
                </div>

                {collection.find(c => c.pokeApiId === selectedPokemon.id)?.status === 'caught' && selectedPokemon.genderRate !== -1 && (
                  <div className="interaction-bar" style={{ marginTop: '-0.75rem' }}>
                    {selectedPokemon.genderRate! < 8 && <button onClick={() => handleInteraction('male')} className={`btn-action ${collection.find(c => c.pokeApiId === selectedPokemon.id)?.gender === 'male' ? 'male' : ''}`}>Macho</button>}
                    {selectedPokemon.genderRate! > 0 && <button onClick={() => handleInteraction('female')} className={`btn-action ${collection.find(c => c.pokeApiId === selectedPokemon.id)?.gender === 'female' ? 'female' : ''}`}>Fêmea</button>}
                  </div>
                )}

                <h3 className="section-title" style={{ color: `var(--type-${selectedPokemon.types[0]})` }}>About</h3>
                <div className="about-row">
                  <div className="about-item"><div className="about-value"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M12 7v10"/><path d="M8 11h8"/></svg>{(selectedPokemon.weight || 0) / 10} kg</div><div className="about-label">Weight</div></div>
                  <div className="about-item"><div className="about-value"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8.5"/><path d="M16 2l5 5-11 11-5-5 5-5 6 6"/></svg>{(selectedPokemon.height || 0) / 10} m</div><div className="about-label">Height</div></div>
                </div>

                <p className="description">{selectedPokemon.description}</p>

                <h3 className="section-title" style={{ color: `var(--type-${selectedPokemon.types[0]})` }}>Held Items</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {selectedPokemon.heldItems?.length ? selectedPokemon.heldItems.map(i => (
                    <span key={i} style={{ background: '#F9FAFB', padding: '4px 10px', borderRadius: '12px', fontSize: '9px', fontWeight: 600, textTransform: 'capitalize', border: '1px solid #EEF2F6' }}>{i.replace('-', ' ')}</span>
                  )) : <span style={{ fontSize: '10px', color: 'var(--pk-gray-medium)' }}>None</span>}
                </div>

                <h3 className="section-title" style={{ color: `var(--type-${selectedPokemon.types[0]})` }}>Weaknesses</h3>
                <div className="effectiveness-grid" style={{ justifyContent: 'center' }}>
                  {selectedPokemon.effectiveness?.weaknesses.map(w => <span key={w} className="effect-tag" style={{ backgroundColor: `var(--type-${w})` }}>{w}</span>)}
                </div>

                <h3 className="section-title" style={{ color: `var(--type-${selectedPokemon.types[0]})` }}>Abilities</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedPokemon.abilitiesDetails?.map(a => (
                    <div key={a.name} style={{ background: '#F9FAFB', padding: '0.75rem', borderRadius: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'capitalize' }}>{a.name}</div>
                      <div style={{ fontSize: '9px', color: 'var(--pk-gray-medium)' }}>{a.description}</div>
                    </div>
                  ))}
                </div>

                <h3 className="section-title" style={{ color: `var(--type-${selectedPokemon.types[0]})` }}>Level-up Moves</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {selectedPokemon.moves?.map(m => (
                    <div key={m.name} style={{ background: '#F9FAFB', padding: '6px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #EEF2F6' }}>
                      <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'capitalize' }}>{m.name.replace('-', ' ')}</span>
                      <span style={{ fontSize: '8px', color: 'var(--pk-gray-medium)', fontWeight: 700 }}>Lv. {m.level}</span>
                    </div>
                  ))}
                </div>

                <h3 className="section-title" style={{ color: `var(--type-${selectedPokemon.types[0]})` }}>Evolution Chain</h3>
                <div className="evolution-wrap">
                  {selectedPokemon.evolutionChain?.map((evo, i) => (
                    <div key={evo.id} style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="evo-item" onClick={() => handleOpenDetail({ id: evo.id } as any)}>
                        <img src={evo.spriteUrl} alt={evo.name} className="evo-img" />
                        <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'capitalize' }}>{evo.name}</span>
                      </div>
                      {i < (selectedPokemon.evolutionChain?.length || 0) - 1 && <span className="evo-arrow">→</span>}
                    </div>
                  ))}
                </div>

                <h3 className="section-title" style={{ color: `var(--type-${selectedPokemon.types[0]})` }}>Base Stats</h3>
                <div className="stats-table">
                  {selectedPokemon.stats && Object.entries(selectedPokemon.stats).map(([key, val]) => (
                    <div key={key} className="stat-row">
                      <span className="stat-label">{key.toUpperCase()}</span>
                      <span className="stat-value">{String(val).padStart(3, '0')}</span>
                      <div className="stat-bar-bg"><div className="stat-bar-fill" style={{ width: `${Math.min(val / 2, 100)}%`, backgroundColor: `var(--type-${selectedPokemon?.types[0]})` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
