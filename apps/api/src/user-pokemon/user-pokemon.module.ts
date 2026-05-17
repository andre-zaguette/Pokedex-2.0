import { Module } from '@nestjs/common';
import { UserPokemonController } from './user-pokemon.controller';
import { UserPokemonService } from './user-pokemon.service';

@Module({
  controllers: [UserPokemonController],
  providers: [UserPokemonService],
})
export class UserPokemonModule {}
