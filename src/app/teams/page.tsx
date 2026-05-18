'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Team, CollectionEntry, PokemonSummary } from '@/lib/types';
import { navigation } from '@/lib/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const NATURES = ["hardy","bold","modest","calm","timid","lonely","docile","mild","gentle","hasty","adamant","impish","bashful","careful","rash","jolly","naughty","lax","quirky","naive","brave","relaxed","quiet","sassy","serious"];

const TYPE_CHART: Record<string, { weaknesses: string[], resistances: string[] }> = {
  normal: { weaknesses: ['fighting'], resistances: ['ghost'] },
  fire: { weaknesses: ['water', 'ground', 'rock'], resistances: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'] },
  water: { weaknesses: ['electric', 'grass'], resistances: ['fire', 'water', 'ice', 'steel'] },
  electric: { weaknesses: ['ground'], resistances: ['electric', 'flying', 'steel'] },
  grass: { weaknesses: ['fire', 'ice', 'poison', 'flying', 'bug'], resistances: ['water', 'electric', 'grass', 'ground'] },
  ice: { weaknesses: ['fire', 'fighting', 'rock', 'steel'], resistances: ['ice'] },
  fighting: { weaknesses: ['flying', 'psychic', 'fairy'], resistances: ['bug', 'rock', 'dark'] },
  poison: { weaknesses: ['ground', 'psychic'], resistances: ['grass', 'fighting', 'poison', 'bug', 'fairy'] },
  ground: { weaknesses: ['water', 'grass', 'ice'], resistances: ['poison', 'rock'], },
  flying: { weaknesses: ['electric', 'ice', 'rock'], resistances: ['grass', 'fighting', 'bug'], },
  psychic: { weaknesses: ['bug', 'ghost', 'dark'], resistances: ['fighting', 'psychic'] },
  bug: { weaknesses: ['fire', 'flying', 'rock'], resistances: ['grass', 'fighting', 'ground'] },
  rock: { weaknesses: ['water', 'grass', 'fighting', 'ground', 'steel'], resistances: ['normal', 'fire', 'poison', 'flying'] },
  ghost: { weaknesses: ['ghost', 'dark'], resistances: ['poison', 'bug'], },
  dragon: { weaknesses: ['ice', 'dragon', 'fairy'], resistances: ['fire', 'water', 'electric', 'grass'] },
  dark: { weaknesses: ['fighting', 'bug', 'fairy'], resistances: ['ghost', 'dark'], },
  steel: { weaknesses: ['fire', 'fighting', 'ground'], resistances: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'] },
  fairy: { weaknesses: ['poison', 'steel'], resistances: ['fighting', 'bug', 'dark'], },
};

export default function TeamBuilderPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingMember, setEditingMember] = useState<CollectionEntry | null>(null);
  const [memberDetails, setMemberDetails] = useState<PokemonSummary | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [showdownText, setShowdownText] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [teamsData, collectionData] = await Promise.all([
          api.getTeams(),
          api.getCollection(),
        ]);
        setTeams(teamsData);
        setCollection(collectionData.filter(c => c.status === 'caught'));
      } catch (error) {
        console.error('Failed to load teams');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- SHOWDOWN LOGIC ---
  const handleExport = (team: Team) => {
    const text = team.members.map(m => {
      let s = `${m.pokemonName}${m.item ? ` @ ${m.item}` : ''}\n`;
      s += `Ability: ${m.ability || 'Default'}\n`;
      s += `EVs: ${m.ev_hp} HP / ${m.ev_atk} Atk / ${m.ev_def} Def / ${m.ev_spa} SpA / ${m.ev_spd} SpD / ${m.ev_spe} Spe\n`;
      s += `${m.nature || 'Serious'} Nature\n`;
      if (m.move1) s += `- ${m.move1}\n`;
      if (m.move2) s += `- ${m.move2}\n`;
      if (m.move3) s += `- ${m.move3}\n`;
      if (m.move4) s += `- ${m.move4}\n`;
      return s;
    }).join('\n');
    setShowdownText(text);
    setShowImportExport(true);
  };

  // --- TYPE COVERAGE LOGIC ---
  const coverage = useMemo(() => {
    if (!editingTeam) return null;
    const stats: Record<string, number> = {};
    Object.keys(TYPE_CHART).forEach(t => stats[t] = 0);

    editingTeam.members.forEach(m => {
      // This is simplified. In a real app we'd fetch actual types for members
      // For now we'll assume we have them or can infer (needs full data)
    });
    return stats;
  }, [editingTeam]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      const newTeam = await api.createTeam(newTeamName);
      setTeams(prev => [newTeam, ...prev]);
      setNewTeamName('');
    } catch (e) { console.error(e); }
  };

  const toggleMember = async (pokemon: CollectionEntry) => {
    if (!editingTeam) return;
    const isMember = editingTeam.members.some(m => m.id === pokemon.id);
    let newMemberIds = isMember 
      ? editingTeam.members.filter(m => m.id !== pokemon.id).map(m => m.id)
      : (editingTeam.members.length < 6 ? [...editingTeam.members.map(m => m.id), pokemon.id] : editingTeam.members.map(m => m.id));
    
    try {
      const updated = await api.updateTeam(editingTeam.id, { memberIds: newMemberIds });
      setEditingTeam(updated);
      setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (e) { console.error(e); }
  };

  const openMemberEditor = async (member: CollectionEntry) => {
    setEditingMember(member);
    try {
      const details = await api.getPokemonDetail(member.pokeApiId);
      setMemberDetails(details);
    } catch (e) { console.error(e); }
  };

  const updateMemberStats = async (updates: any) => {
    if (!editingMember) return;
    try {
      const updated = await api.updateCollectionItem(editingMember.id, updates);
      setEditingMember(updated);
      setCollection(prev => prev.map(c => c.id === updated.id ? updated : c));
      setTeams(prev => prev.map(t => ({
        ...t,
        members: t.members.map(m => m.id === updated.id ? updated : m)
      })));
      if (editingTeam) setEditingTeam(prev => prev ? { ...prev, members: prev.members.map(m => m.id === updated.id ? updated : m) } : null);
    } catch (e) { console.error(e); }
  };

  return (
    <main className="figma-screen" style={{ backgroundColor: '#F6F8FC', padding: 0 }}>
      <div style={{ background: 'var(--pk-red)', padding: '2rem 1.5rem 3rem', width: '100%', position: 'relative', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
        <button onClick={() => navigation.assign('/pokedex')} className="back-arrow" style={{ position: 'absolute', left: '1.5rem', top: '2rem', color: 'white', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '12px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, textAlign: 'center', marginTop: '0.5rem' }}>Showdown Builder</h1>
      </div>

      <div style={{ width: '100%', padding: '1.5rem', marginTop: '-2rem', zIndex: 2, position: 'relative' }}>
        <div className="panel" style={{ padding: '1.25rem', marginBottom: '2rem', background: 'white', display: 'flex', gap: '1rem', borderRadius: '16px' }}>
          <input className="figma-input" placeholder="Novo time estratégico..." value={newTeamName} onChange={e => setNewTeamName(e.target.value)} style={{ flex: 1, height: '44px', borderRadius: '22px' }} />
          <button className="figma-btn-primary" onClick={handleCreateTeam} style={{ width: 'auto', height: '44px', padding: '0 1.5rem', borderRadius: '22px' }}>Criar</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {teams.map(team => (
            <div key={team.id} className="panel" style={{ padding: '1.5rem', background: 'white', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{team.name}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleExport(team)} style={{ background: 'var(--pk-gray-background)', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '10px' }}>EXPORT</button>
                  <button onClick={() => setEditingTeam(team)} style={{ background: 'var(--pk-blue)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '10px' }}>EDITAR</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', background: '#F9FAFB', padding: '1rem', borderRadius: '12px' }}>
                {Array.from({ length: 6 }).map((_, i) => {
                  const member = team.members[i];
                  return (
                    <div key={i} onClick={() => member && openMemberEditor(member)} style={{ aspectRatio: '1/1', background: member ? 'white' : 'rgba(0,0,0,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: member ? '2px solid var(--pk-red)' : '2px dashed rgba(0,0,0,0.1)', cursor: member ? 'pointer' : 'default' }}>
                      {member && <img src={member.spriteUrl || ''} alt={member.pokemonName} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Showdown Import/Export Modal */}
      <AnimatePresence>
        {showImportExport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowImportExport(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="modal-container" style={{ background: 'white', padding: '1.5rem', height: 'auto', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ marginBottom: '1rem' }}>Showdown Format</h2>
              <textarea 
                className="figma-input" 
                style={{ height: '300px', fontSize: '11px', fontFamily: 'monospace', borderRadius: '12px', padding: '1rem' }}
                value={showdownText}
                readOnly
              />
              <button className="figma-btn-primary" style={{ marginTop: '1rem' }} onClick={() => { navigator.clipboard.writeText(showdownText); setShowImportExport(false); }}>Copiar para o ClipBoard</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Team Selector Modal */}
      <AnimatePresence>
        {editingTeam && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setEditingTeam(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="modal-container" style={{ background: 'white', padding: '1.5rem', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{editingTeam.name}</h2>
                <button onClick={() => setEditingTeam(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </header>

              {/* Simple Coverage View */}
              <div style={{ background: '#F0F4F8', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--pk-blue)', marginBottom: '0.5rem' }}>ANÁLISE DE EQUILÍBRIO</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {editingTeam.members.length === 0 ? <span style={{ fontSize: '10px', color: 'var(--pk-gray-medium)' }}>Adicione Pokémons para analisar cobertura...</span> : (
                      <span style={{ fontSize: '10px' }}>Time em formação. Use o editor individual para definir tipos e estratégias.</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginBottom: '2rem' }}>
                {Array.from({ length: 6 }).map((_, i) => {
                  const member = editingTeam.members[i];
                  return (
                    <div key={i} onClick={() => member && openMemberEditor(member)} style={{ aspectRatio: '1/1', background: member ? '#F3F4F6' : 'rgba(0,0,0,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: member ? '2px solid var(--pk-red)' : 'none', cursor: member ? 'pointer' : 'default', position: 'relative' }}>
                      {member && <img src={member.spriteUrl || ''} alt={member.pokemonName} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />}
                      {member && <div onClick={(e) => { e.stopPropagation(); toggleMember(member); }} style={{ position: 'absolute', top: -4, right: -4, background: '#C53030', color: 'white', width: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer' }}>×</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <p style={{ fontSize: '12px', color: 'var(--pk-gray-medium)', marginBottom: '1rem', fontWeight: 700 }}>SUA COLEÇÃO</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  {collection.map(pokemon => {
                    const isSelected = editingTeam.members.some(m => m.id === pokemon.id);
                    return (
                      <div key={pokemon.id} onClick={() => toggleMember(pokemon)} style={{ aspectRatio: '1/1', background: 'white', border: isSelected ? '2px solid var(--pk-red)' : '1px solid #EEF2F6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: isSelected ? 0.4 : 1 }}>
                        <img src={pokemon.spriteUrl || ''} alt={pokemon.pokemonName} style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Showdown-style Member Editor */}
      <AnimatePresence>
        {editingMember && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ zIndex: 200 }} onClick={() => { setEditingMember(null); setMemberDetails(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-container" style={{ background: 'white', padding: '1.5rem', maxWidth: '400px', height: 'auto', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <img src={editingMember.spriteUrl || ''} style={{ width: '64px', height: '64px' }} alt="poke" />
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, textTransform: 'capitalize' }}>{editingMember.pokemonName}</h2>
                  <p style={{ fontSize: '10px', color: 'var(--pk-gray-medium)', fontWeight: 700 }}>CONFIGURAÇÃO SHOWDOWN</p>
                </div>
                <button onClick={() => { setEditingMember(null); setMemberDetails(null); }} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </header>

              <div className="stack-tight" style={{ gap: '1.25rem' }}>
                <section>
                  <p style={{ fontSize: '10px', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--pk-red)' }}>MOVES (4)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[1,2,3,4].map(i => (
                      <select key={i} className="figma-input" style={{ height: '38px', fontSize: '11px', borderRadius: '10px' }} value={(editingMember as any)[`move${i}`] || ''} onChange={(e) => updateMemberStats({ [`move${i}`]: e.target.value })}>
                        <option value="">Empty</option>
                        {memberDetails?.moves?.map(m => <option key={m.name} value={m.name}>{m.name.replace('-', ' ')}</option>)}
                      </select>
                    ))}
                  </div>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <section>
                    <p style={{ fontSize: '10px', fontWeight: 800, marginBottom: '0.5rem' }}>ABILITY</p>
                    <select className="figma-input" style={{ height: '38px', fontSize: '11px', borderRadius: '10px' }} value={editingMember.ability || ''} onChange={(e) => updateMemberStats({ ability: e.target.value })}>
                      <option value="">Default</option>
                      {memberDetails?.abilities?.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </section>
                  <section>
                    <p style={{ fontSize: '10px', fontWeight: 800, marginBottom: '0.5rem' }}>ITEM</p>
                    <input className="figma-input" placeholder="Choice Band..." value={editingMember.item || ''} onChange={(e) => updateMemberStats({ item: e.target.value })} style={{ height: '38px', fontSize: '11px', borderRadius: '10px' }} />
                  </section>
                </div>

                <section>
                  <p style={{ fontSize: '10px', fontWeight: 800, marginBottom: '0.5rem' }}>NATURE</p>
                  <select className="figma-input" style={{ height: '38px', fontSize: '11px', borderRadius: '10px' }} value={editingMember.nature || ''} onChange={(e) => updateMemberStats({ nature: e.target.value })}>
                    <option value="">Serious (Neutral)</option>
                    {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </section>

                <section>
                  <p style={{ fontSize: '10px', fontWeight: 800, marginBottom: '0.75rem' }}>EVs SPREAD (Max 252)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map(stat => (
                      <div key={stat} className="stack-tight" style={{ gap: '4px' }}>
                        <label style={{ fontSize: '8px', fontWeight: 800, color: 'var(--pk-gray-medium)', textAlign: 'center' }}>{stat.toUpperCase()}</label>
                        <input type="number" max={252} min={0} className="figma-input" style={{ height: '34px', fontSize: '11px', borderRadius: '8px', textAlign: 'center', padding: 0 }} value={(editingMember as any)[`ev_${stat}`] || 0} onChange={(e) => updateMemberStats({ [`ev_${stat}`]: parseInt(e.target.value) || 0 })} />
                      </div>
                    ))}
                  </div>
                </section>

                <button className="figma-btn-primary" onClick={() => { setEditingMember(null); setMemberDetails(null); }} style={{ height: '48px', marginTop: '1rem' }}>Finalizar Membro</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
