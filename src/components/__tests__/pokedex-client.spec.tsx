import { render, screen, waitFor } from '@testing-library/react';
import { PokedexClient } from '../pokedex-client';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: {
    getCollection: jest.fn(),
    searchPokemon: jest.fn(),
    logout: jest.fn(),
  },
  ApiError: class extends Error {
    constructor(message: string, public status: number) {
      super(message);
    }
  },
}));

jest.mock('@/lib/navigation', () => ({
  navigation: {
    assign: jest.fn(),
  },
}));

describe('PokedexClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getCollection as jest.Mock).mockResolvedValue([]);
    (api.searchPokemon as jest.Mock).mockResolvedValue({ items: [], total: 0 });
  });

  it('deve renderizar o título e o campo de busca', async () => {
    render(<PokedexClient />);
    
    expect(screen.getByText(/Monte a sua coleção pokemon/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar pokemon/i)).toBeInTheDocument();
  });

  it('deve carregar a coleção ao montar', async () => {
    render(<PokedexClient />);
    
    await waitFor(() => {
      expect(api.getCollection).toHaveBeenCalled();
    });
  });

  it('deve exibir resultados de busca', async () => {
    const mockPokemon = [
      { id: 1, name: 'bulbasaur', types: ['grass', 'poison'], artworkUrl: '', spriteUrl: '', shinySpriteUrl: '' }
    ];
    (api.searchPokemon as jest.Mock).mockResolvedValue({ items: mockPokemon, total: 1 });

    render(<PokedexClient />);
    
    await waitFor(() => {
      expect(screen.getByText(/bulbasaur/i)).toBeInTheDocument();
      expect(screen.getByText(/#1/i)).toBeInTheDocument();
    });
  });
});
