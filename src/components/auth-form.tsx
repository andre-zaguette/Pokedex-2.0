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
        setView('social');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha na conexão.');
    } finally {
      setPending(false);
    }
  }

  const BackButton = () => (
    <div style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}>
      <button onClick={() => setView('social')} className="back-arrow" aria-label="Voltar">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
    </div>
  );

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
          <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '260px', height: '260px', backgroundColor: 'var(--pk-gray-input)', borderRadius: '50%', zIndex: -1 }} />
             <img 
               src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png" 
               alt="Bulbasaur" 
               style={{ width: '220px', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.15))' }}
             />
          </div>
          
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
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--pk-text-secondary)', fontSize: '14px' }}>Já possui uma conta?</span>
          <button className="figma-btn-secondary" onClick={() => setView('login')}>Fazer Login</button>
        </div>
      </main>
    );
  }

  return (
    <main className="figma-screen">
      <BackButton />
      
      <div style={{ width: '100%', flex: 1 }}>
        <h1 className="figma-title" style={{ textAlign: 'left', fontSize: '32px', marginBottom: '0.75rem' }}>
          {view === 'login' ? 'Bem-vindo de volta, Treinador!' : 'Criar sua conta'}
        </h1>
        <p className="figma-desc" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
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

          {error && (
            <div style={{ backgroundColor: 'rgba(220, 10, 45, 0.1)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
              <p style={{ color: 'var(--pk-red)', fontSize: '13px', textAlign: 'center', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          <button type="submit" className="figma-btn-primary" disabled={pending} style={{ marginTop: '2rem' }}>
            {pending ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.2" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                </svg>
                <span>Processando...</span>
              </div>
            ) : (view === 'login' ? 'Entrar' : 'Finalizar Cadastro')}
          </button>
        </form>
      </div>
      
      {view === 'login' && (
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--pk-text-secondary)', fontSize: '14px' }}>
          Esqueceu sua senha? <button className="figma-btn-secondary">Recuperar</button>
        </p>
      )}
    </main>
  );
}
