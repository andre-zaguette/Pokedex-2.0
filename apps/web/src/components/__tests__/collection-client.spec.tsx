import { render, screen, waitFor } from '@testing-library/react';
import { CollectionClient } from '../collection-client';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: {
    getCollection: jest.fn(),
    updateCollectionItem: jest.fn(),
    deleteCollectionItem: jest.fn(),
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

describe('CollectionClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve exibir mensagem de carregamento', () => {
    (api.getCollection as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<CollectionClient />);
    expect(screen.getByText(/Carregando sua coleção/i)).toBeInTheDocument();
  });

  it('deve exibir mensagem se a coleção estiver vazia', async () => {
    (api.getCollection as jest.Mock).mockResolvedValue([]);
    render(<CollectionClient />);
    
    await waitFor(() => {
      expect(screen.getByText(/Sua coleção está vazia/i)).toBeInTheDocument();
    });
  });

  it('deve listar itens da coleção', async () => {
    const mockCollection = [
      { id: 'c1', pokeApiId: 25, pokemonName: 'pikachu', isShiny: false, gender: 'male', note: 'Bravo' }
    ];
    (api.getCollection as jest.Mock).mockResolvedValue(mockCollection);
    
    render(<CollectionClient />);
    
    await waitFor(() => {
      expect(screen.getByText(/pikachu/i)).toBeInTheDocument();
      expect(screen.getByText(/#25/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Bravo/i)).toBeInTheDocument();
    });
  });
});
