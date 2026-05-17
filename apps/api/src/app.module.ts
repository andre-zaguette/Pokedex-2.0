import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { PokemonModule } from './pokemon/pokemon.module';
import { UserPokemonModule } from './user-pokemon/user-pokemon.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    PokemonModule,
    UserPokemonModule,
    TeamsModule,
  ],
})
export class AppModule {}
