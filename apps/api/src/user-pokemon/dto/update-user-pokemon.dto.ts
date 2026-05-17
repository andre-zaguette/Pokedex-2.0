import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { pokemonGenderValues, PokemonGenderValue } from '../pokemon-gender';

export class UpdateUserPokemonDto {
  @IsOptional()
  @IsBoolean()
  isShiny?: boolean;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsIn(pokemonGenderValues)
  gender?: PokemonGenderValue;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;

  @IsOptional()
  @IsIn(['seen', 'caught'])
  status?: 'seen' | 'caught';

  @IsOptional()
  @IsString()
  ability?: string;

  @IsOptional()
  @IsString()
  item?: string;

  @IsOptional()
  @IsString()
  move1?: string;

  @IsOptional()
  @IsString()
  move2?: string;

  @IsOptional()
  @IsString()
  move3?: string;

  @IsOptional()
  @IsString()
  move4?: string;

  @IsOptional()
  @IsString()
  nature?: string;

  @IsOptional()
  @IsInt()
  ev_hp?: number;

  @IsOptional()
  @IsInt()
  ev_atk?: number;

  @IsOptional()
  @IsInt()
  ev_def?: number;

  @IsOptional()
  @IsInt()
  ev_spa?: number;

  @IsOptional()
  @IsInt()
  ev_spd?: number;

  @IsOptional()
  @IsInt()
  ev_spe?: number;
}
