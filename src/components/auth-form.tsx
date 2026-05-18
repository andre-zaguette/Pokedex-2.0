'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { navigation } from '@/lib/navigation';

type ViewMode = 'onboarding' | 'login' | 'register' | 'social';

type AuthFormProps = {
  initialView?: ViewMode;
};

export function AuthForm({ initialView = 'onboarding' }: AuthFormProps) {
  const [view, setView] = useState<ViewMode>(initialView);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      if (view === 'login') {
        await api.login({ email, password });
        navigation.assign('/pokedex');
      } else {
        await api.register({ name, email, password });
        // Após o registro, levamos o usuário para a tela social/onboarding do Figma
        setView('social');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha na conexão.');
    } finally {
      setPending(false);
    }
  }

  if (view === 'onboarding') {
    return (
      <main className="figma-screen">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" 
            alt="Pikachu" 
            className="onboarding-image"
          />
          <h1 className="figma-title">Todos os Pokémons em um só Lugar</h1>
          <p className="figma-desc">
            Acesse uma vasta lista de Pokémon de todas as gerações já feitas pela Nintendo
          </p>
          <div className="pagination-dots">
            <div className="dot active" />
            <div className="dot inactive" />
          </div>
        </div>
        <button className="figma-btn-primary" onClick={() => setView('social')}>
          Continuar
        </button>
      </main>
    );
  }

  if (view === 'social') {
    return (
      <main className="figma-screen">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png" 
            alt="Bulbasaur" 
            style={{ width: '220px', marginBottom: '2rem', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
          />
          <h1 className="figma-title">Falta pouco para explorar esse mundo!</h1>
          <p className="figma-desc">Como deseja se conectar?</p>
          
          <div className="figma-input-container">
            <button className="figma-btn-outline">
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" style={{ width: '18px' }} />
              Continuar com a Apple
            </button>
            <button className="figma-btn-outline">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" style={{ width: '18px' }} />
              Continuar com o Google
            </button>
            <button className="figma-btn-primary" onClick={() => setView('register')}>
              Continuar com um e-mail
            </button>
          </div>
        </div>
        
        <p className="figma-desc" style={{ marginTop: '2rem' }}>
          Já possui uma conta? <button className="figma-btn-secondary" onClick={() => setView('login')}>Fazer Login</button>
        </p>
      </main>
    );
  }

  return (
    <main className="figma-screen">
      <div style={{ alignSelf: 'flex-start', marginBottom: '2.5rem' }}>
        <button onClick={() => setView('social')} className="back-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>
      
      <div style={{ width: '100%', flex: 1 }}>
        <h1 className="figma-title" style={{ textAlign: 'left', fontSize: '32px', fontWeight: 700 }}>
          {view === 'login' ? 'Bem-vindo de volta, Treinador!' : 'Criar sua conta'}
        </h1>
        <p className="figma-desc" style={{ textAlign: 'left', marginBottom: '3rem' }}>
          {view === 'login' ? 'Ficamos felizes em te ver novamente.' : 'Preencha os dados abaixo para começar.'}
        </p>

        <form onSubmit={handleSubmit} className="figma-input-container">
          {view === 'register' && (
            <input 
              className="figma-input"
              placeholder="Nome Completo"
              value={name} 
              onChange={(event) => setName(event.target.value)} 
              required 
            />
          )}
          <input
            className="figma-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="figma-input"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />

          {error ? <p style={{ color: 'var(--pk-red)', fontSize: '13px', textAlign: 'center', marginTop: '1rem', fontWeight: 500 }}>{error}</p> : null}

          <button type="submit" className="figma-btn-primary" disabled={pending} style={{ marginTop: '2.5rem' }}>
            {pending ? 'Processando...' : (view === 'login' ? 'Entrar' : 'Finalizar Cadastro')}
          </button>
        </form>
      </div>
    </main>
  );
}
