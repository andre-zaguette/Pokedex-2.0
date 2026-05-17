export const pokemonGenderValues = ['male', 'female', 'unknown'] as const;

export type PokemonGenderValue = (typeof pokemonGenderValues)[number];
