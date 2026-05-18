import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from '../auth-form';
import { api } from '@/lib/api';
import { navigation } from '@/lib/navigation';

// Mock do módulo de API
jest.mock('@/lib/api', () => ({
  api: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

// Mock do módulo de navegação
jest.mock('@/lib/navigation', () => ({
  navigation: {
    assign: jest.fn(),
  },
}));

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o modo login corretamente', () => {
    render(<AuthForm mode="login" />);
    
    expect(screen.getByRole('heading', { name: /Entrar/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
  });

  it('deve renderizar o modo register corretamente', () => {
    render(<AuthForm mode="register" />);
    
    expect(screen.getByRole('heading', { name: /Criar conta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
  });

  it('deve chamar api.login ao submeter no modo login', async () => {
    (api.login as jest.Mock).mockResolvedValue({ user: { id: '1', name: 'Test' } });
    
    render(<AuthForm mode="login" />);
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    
    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
      expect(navigation.assign).toHaveBeenCalledWith('/pokedex');
    });
  });

  it('deve exibir erro se a api falhar', async () => {
    (api.login as jest.Mock).mockRejectedValue(new Error('Credenciais inválidas'));
    
    render(<AuthForm mode="login" />);
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'wrong-pass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Credenciais inválidas/i)).toBeInTheDocument();
    });
  });
});
