import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { pokemonGenderValues, PokemonGenderValue } from '../pokemon-gender';

export class CreateUserPokemonDto {
  @IsInt()
  @Min(1)
  pokeApiId!: number;

  @IsString()
  pokemonName!: string;

  @IsOptional()
  @IsString()
  spriteUrl?: string;

  @IsBoolean()
  isShiny!: boolean;

  @IsIn(pokemonGenderValues)
  gender!: PokemonGenderValue;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;

  @IsOptional()
  @IsIn(['seen', 'caught'])
  status?: 'seen' | 'caught';
}
