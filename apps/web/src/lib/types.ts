export type User = {
  id: string;
  name: string;
  email: string;
};

export type PokemonSummary = {
  id: number;
  name: string;
  spriteUrl: string | null;
  femaleSpriteUrl?: string | null;
  shinySpriteUrl: string | null;
  femaleShinySpriteUrl?: string | null;
  artworkUrl: string | null;
  types: string[];
  weight?: number;
  height?: number;
  abilities?: string[];
  description?: string;
  genderRate?: number; // -1 for genderless, otherwise 0-8 (chance of being female in eighths)
  stats?: {
    hp: number;
    atk: number;
    def: number;
    satk: number;
    sdef: number;
    spd: number;
  };
  varieties?: Array<{
    name: string;
    is_default: boolean;
    pokemonId: string;
  }>;
  evolutionChain?: Array<{
    id: number;
    name: string;
    spriteUrl: string;
  }>;
  cryUrl?: string | null;
  effectiveness?: {
    weaknesses: string[];
    resistances: string[];
  };
  abilitiesDetails?: Array<{
    name: string;
    description: string;
  }>;
  heldItems?: string[];
  moves?: Array<{
    name: string;
    level: number;
  }>;
};

export type CollectionEntry = {
  id: string;
  userId: string;
  pokeApiId: number;
  pokemonName: string;
  spriteUrl?: string | null;
  isShiny: boolean;
  isFavorite: boolean;
  status: 'seen' | 'caught';
  gender: 'male' | 'female' | 'unknown';
  
  // Competitive
  ability?: string | null;
  item?: string | null;
  move1?: string | null;
  move2?: string | null;
  move3?: string | null;
  move4?: string | null;
  nature?: string | null;
  ev_hp: number;
  ev_atk: number;
  ev_def: number;
  ev_spa: number;
  ev_spd: number;
  ev_spe: number;

  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Team = {
  id: string;
  userId: string;
  name: string;
  members: CollectionEntry[];
  createdAt: string;
  updatedAt: string;
};
