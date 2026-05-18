'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User, CollectionEntry } from '@/lib/types';
import { navigation } from '@/lib/navigation';

const BADGES = [
  { id: 'kanto', name: 'Master of Kanto', desc: 'Catch all original 151', goal: 151 },
  { id: 'collector', name: 'Collector', desc: 'Catch 50 Pokemons', goal: 50 },
  { id: 'shiny', name: 'Shiny Hunter', desc: 'Find 1 rare Shiny', goal: 1 },
  { id: 'strategist', name: 'Strategist', desc: 'Create 1 Team', goal: 1 },
  { id: 'expert', name: 'Expert', desc: 'Catch 250 Pokemons', goal: 250 },
  { id: 'elite', name: 'Elite Four', desc: 'Capture 500 Pokemons', goal: 500 },
];

export default function ProfilePage() {
  const [name, setName] = useState('Junior Saraiva');
  const [email, setEmail] = useState('treinador@pokedex.com');
  const [collectionStats, setCollectionStats] = useState({ caught: 0, seen: 0, shiny: 0 });
  const [teamsCount, setTeamsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [collection, teams] = await Promise.all([
          api.getCollection(),
          api.getTeams()
        ]);
        const caught = collection.filter(c => c.status === 'caught').length;
        const shiny = collection.filter(c => c.isShiny).length;
        const seen = collection.length;
        setCollectionStats({ caught, seen, shiny });
        setTeamsCount(teams.length);
      } catch (error) {
        console.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleBack = () => navigation.assign('/pokedex');
  const handleLogout = () => { api.logout(); navigation.assign('/login'); };

  const checkBadge = (id: string, goal: number) => {
    if (id === 'kanto') return collectionStats.caught >= 151; // Simplified
    if (id === 'collector') return collectionStats.caught >= 50;
    if (id === 'expert') return collectionStats.caught >= 250;
    if (id === 'elite') return collectionStats.caught >= 500;
    if (id === 'shiny') return collectionStats.shiny >= 1;
    if (id === 'strategist') return teamsCount >= 1;
    return false;
  };

  return (
    <main className="pokedex-list-screen" style={{ backgroundColor: '#F6F8FC', minHeight: '100vh', overflowY: 'auto' }}>
      <div style={{ background: 'linear-gradient(180deg, var(--pk-red) 0%, #B00824 100%)', padding: '3rem 2rem 8rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', borderBottomLeftRadius: '48px', borderBottomRightRadius: '48px', boxShadow: '0 10px 30px rgba(220, 10, 45, 0.2)', zIndex: 1 }}>
        <button onClick={handleBack} className="back-arrow" style={{ position: 'absolute', left: '1.5rem', top: '2rem', color: 'white', background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 800, marginBottom: '2.5rem' }}>Meu Perfil</h1>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '40px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', transform: 'rotate(-5deg)', border: '6px solid rgba(255,255,255,0.8)' }}>
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" alt="Avatar" style={{ width: '90px', height: '90px', transform: 'rotate(5deg)' }} />
          </div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: '#FFCB05', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 10 }}>LV. {Math.floor(collectionStats.caught / 10) + 1}</div>
        </div>
      </div>

      <div style={{ maxWidth: '440px', margin: '-4rem auto 0', width: '90%', paddingBottom: '4rem', position: 'relative', zIndex: 2 }}>
        
        {/* Achievements Section */}
        <section className="panel" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'white', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#FFFBEB', padding: '8px', borderRadius: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17M14 14.66V17M18 9.22c0 3.86-2.68 7-6 7s-6-3.14-6-7V4h12v5.22z"/></svg>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Hall da Fama</h2>
          </div>
          <div className="badges-grid">
            {BADGES.map(badge => {
              const isUnlocked = checkBadge(badge.id, badge.goal);
              return (
                <div key={badge.id} className={`badge-item ${isUnlocked ? 'unlocked' : ''}`}>
                  <div className="badge-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isUnlocked ? "#92400E" : "#9CA3AF"} strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                  </div>
                  <span className="badge-label">{badge.name}</span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="panel" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'white', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#F3F4F6', padding: '8px', borderRadius: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pk-red)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Treinador</h2>
          </div>
          <div className="stack-tight" style={{ gap: '1.25rem' }}>
            <div className="figma-field"><span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--pk-gray-medium)', textTransform: 'uppercase' }}>Nome</span><input className="figma-input" value={name} onChange={(e) => setName(e.target.value)} style={{ background: '#F9FAFB', border: '1px solid #EEF2F6', height: '48px', borderRadius: '12px', padding: '0 1rem' }} /></div>
            <div className="figma-field"><span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--pk-gray-medium)', textTransform: 'uppercase' }}>E-mail</span><input className="figma-input" value={email} readOnly style={{ background: '#F9FAFB', border: '1px solid #EEF2F6', opacity: 0.6, height: '48px', borderRadius: '12px', padding: '0 1rem' }} /></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="panel" style={{ padding: '1.5rem', textAlign: 'center', background: 'white', borderRadius: '20px' }}><div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--pk-red)' }}>{collectionStats.seen}</div><div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--pk-gray-medium)' }}>VISTOS</div></div>
          <div className="panel" style={{ padding: '1.5rem', textAlign: 'center', background: 'white', borderRadius: '20px' }}><div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--pk-blue)' }}>{collectionStats.caught}</div><div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--pk-gray-medium)' }}>CAPTURADOS</div></div>
        </div>

        <div style={{ padding: '1.5rem', background: 'white', borderRadius: '20px' }} onClick={handleLogout}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div><span style={{ fontSize: '14px', fontWeight: 700, color: '#C53030', display: 'block' }}>Encerrar Sessão</span><span style={{ fontSize: '11px', color: 'var(--pk-gray-medium)' }}>Sair da conta atual</span></div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C53030" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
        </div>
        <button className="figma-btn-primary" style={{ marginTop: '2.5rem', borderRadius: '16px', height: '54px' }}>Salvar Alterações</button>
      </div>
    </main>
  );
}
