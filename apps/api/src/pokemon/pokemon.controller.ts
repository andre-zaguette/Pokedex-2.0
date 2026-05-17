import { Controller, Get, Param, Query } from '@nestjs/common';
import { PokemonService } from './pokemon.service';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  search(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('region') region?: string,
  ) {
    return this.pokemonService.search(
      search, 
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
      region
    );
  }

  @Get(':nameOrId')
  getById(@Param('nameOrId') nameOrId: string) {
    return this.pokemonService.getByNameOrId(nameOrId);
  }
}
