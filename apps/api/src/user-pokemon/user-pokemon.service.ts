import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserPokemonDto } from './dto/create-user-pokemon.dto';
import { UpdateUserPokemonDto } from './dto/update-user-pokemon.dto';

@Injectable()
export class UserPokemonService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.userPokemon.findMany({
      where: { userId },
      orderBy: [{ pokemonName: 'asc' }],
    });
  }

  async create(userId: string, input: CreateUserPokemonDto) {
    const existing = await this.prisma.userPokemon.findUnique({
      where: {
        userId_pokeApiId: {
          userId,
          pokeApiId: input.pokeApiId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Pokemon already exists in collection.');
    }

    return this.prisma.userPokemon.create({
      data: {
        userId,
        pokeApiId: input.pokeApiId,
        pokemonName: input.pokemonName,
        spriteUrl: input.spriteUrl,
        isShiny: input.isShiny,
        status: input.status as any,
        gender: input.gender as 'male' | 'female' | 'unknown',
        note: input.note,
      },
    });
  }

  async update(userId: string, id: string, input: UpdateUserPokemonDto) {
    await this.ensureOwnership(userId, id);

    return this.prisma.userPokemon.update({
      where: { id },
      data: input,
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwnership(userId, id);

    await this.prisma.userPokemon.delete({
      where: { id },
    });

    return { success: true };
  }

  private async ensureOwnership(userId: string, id: string) {
    const item = await this.prisma.userPokemon.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Collection item not found.');
    }

    if (item.userId !== userId) {
      throw new ForbiddenException('Access denied.');
    }
  }
}
